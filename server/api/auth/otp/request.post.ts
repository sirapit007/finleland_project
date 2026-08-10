import { createHmac } from "node:crypto";
import { useDb } from "@@/server/utils/db";
import { getOtpSettings } from "@@/server/utils/otpSettings";
import {
  OtpProviderError,
  requestThaiBulkSmsOtp,
} from "@@/server/utils/thaiBulkSmsOtp";

const USERS_TABLE = "tb_users";
const OTP_TABLE = "tb_otp_challenges";

type RequestOtpBody = {
  phone?: string;
  email?: string;
};

type RateLimitRow = {
  latest_phone_request: Date | string | null;
  phone_request_count: string | number;
  ip_request_count: string | number;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 100;
}

function getIpHash(event: any) {
  const secret = String(process.env.JWT_SECRET || "");
  if (!secret) {
    throw createError({
      statusCode: 500,
      statusMessage: "JWT_SECRET is not configured",
    });
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  return createHmac("sha256", secret).update(ip).digest("hex");
}

function genericRequestError(statusCode = 400) {
  return createError({
    statusCode,
    statusMessage:
      "ไม่สามารถส่งรหัสยืนยันได้ กรุณาตรวจสอบข้อมูลหรือลองใหม่ภายหลัง",
  });
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RequestOtpBody>(event);
  const phone = String(body.phone || "")
    .replace(/\s+/g, "")
    .trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!/^[0-9]{10}$/.test(phone) || !isValidEmail(email)) {
    throw genericRequestError();
  }

  const settings = getOtpSettings();
  const ipHash = getIpHash(event);
  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // Serialize concurrent requests from the same IP and then the same phone.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `otp-ip:${ipHash}`,
    ]);
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `otp-phone:${phone}`,
    ]);

    const existingUser = await client.query(
      `SELECT id
       FROM ${USERS_TABLE}
       WHERE (phone = $1 OR LOWER(email) = $2) AND deleted_at IS NULL
       LIMIT 1`,
      [phone, email],
    );

    if (existingUser.rowCount) {;
      throw genericRequestError(409);
    }

    const rateLimit = await client.query<RateLimitRow>(
      `SELECT
         MAX(created_at) FILTER (WHERE phone = $1) AS latest_phone_request,
         COUNT(*) FILTER (WHERE phone = $1) AS phone_request_count,
         COUNT(*) FILTER (WHERE requester_ip_hash = $2) AS ip_request_count
       FROM ${OTP_TABLE}
       WHERE created_at > NOW() - ($3 * INTERVAL '1 second')`,
      [phone, ipHash, settings.rateLimitWindowSeconds],
    );
    const limit = rateLimit.rows[0];
    const latestRequest = limit?.latest_phone_request
      ? new Date(limit.latest_phone_request).getTime()
      : 0;
    const retryAfter = Math.max(
      0,
      settings.resendCooldownSeconds -
        Math.floor((Date.now() - latestRequest) / 1000),
    );

    if (latestRequest && retryAfter > 0) {
      setResponseHeader(event, "Retry-After", retryAfter);
      throw createError({
        statusCode: 429,
        statusMessage: `กรุณารอ ${retryAfter} วินาทีก่อนขอรหัสใหม่`,
        data: { retryAfter },
      });
    }

    if (
      Number(limit?.phone_request_count || 0) >=
        settings.maxRequestsPerWindow ||
      Number(limit?.ip_request_count || 0) >= settings.maxRequestsPerWindow
    ) {
      setResponseHeader(
        event,
        "Retry-After",
        settings.rateLimitWindowSeconds,
      );
      throw createError({
        statusCode: 429,
        statusMessage: "มีการขอรหัสยืนยันบ่อยเกินไป กรุณาลองใหม่ภายหลัง",
        data: { retryAfter: settings.rateLimitWindowSeconds },
      });
    }

    const provider = await requestThaiBulkSmsOtp(phone);

    await client.query(
      `UPDATE ${OTP_TABLE}
       SET consumed_at = NOW()
       WHERE phone = $1
         AND purpose = 'signup'
         AND consumed_at IS NULL`,
      [phone],
    );

    const challenge = await client.query<{ uuid: string }>(
      `INSERT INTO ${OTP_TABLE}
        (phone, email, provider_token, refno, purpose, attempts,
         requester_ip_hash, expires_at)
       VALUES ($1, $2, $3, $4, 'signup', 0, $5,
               NOW() + ($6 * INTERVAL '1 second'))
       RETURNING uuid`,
      [
        phone,
        email,
        provider.token,
        provider.refno,
        ipHash,
        settings.ttlSeconds,
      ],
    );

    await client.query("COMMIT");

    return {
      challengeId: challenge.rows[0]?.uuid,
      refno: provider.refno,
      expiresIn: settings.ttlSeconds,
      resendAfter: settings.resendCooldownSeconds,
      otpLength: settings.length,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (error instanceof OtpProviderError) {
      throw genericRequestError(error.statusCode);
    }

    throw error;
  } finally {
    client.release();
  }
});
