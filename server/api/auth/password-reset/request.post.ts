import { createHmac, randomUUID } from "node:crypto";
import { useDb } from "@@/server/utils/db";
import { getOtpSettings } from "@@/server/utils/otpSettings";
import { RESET_COOKIE, RESET_COOKIE_PATH, RESET_VERIFIED_COOKIE, resetAccountBinding } from "@@/server/utils/passwordReset";
import { OtpProviderError, requestThaiBulkSmsOtp } from "@@/server/utils/thaiBulkSmsOtp";

type Limit = { latest_phone_request: Date | string | null; phone_request_count: string | number; ip_request_count: string | number };

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const body = await readBody<{ phone?: string }>(event);
  const phone = String(body?.phone || "").replace(/\s+/g, "");
  if (!/^[0-9]{10}$/.test(phone)) {
    throw createError({ statusCode: 400, statusMessage: "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก" });
  }

  const secret = String(process.env.JWT_SECRET || "");
  if (!secret) throw createError({ statusCode: 500, statusMessage: "ระบบไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง" });
  const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
  const ipHash = createHmac("sha256", secret).update(ip).digest("hex");
  const settings = getOtpSettings();
  const client = await useDb().connect();
  try {
    await client.query("BEGIN");
    // Share the same locks and rate limits as signup OTP.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`otp-ip:${ipHash}`]);
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`otp-phone:${phone}`]);
    const limits = await client.query<Limit>(
      `SELECT MAX(created_at) FILTER (WHERE phone = $1) AS latest_phone_request,
              COUNT(*) FILTER (WHERE phone = $1) AS phone_request_count,
              COUNT(*) FILTER (WHERE requester_ip_hash = $2) AS ip_request_count
       FROM tb_otp_challenges WHERE created_at > NOW() - ($3 * INTERVAL '1 second')`,
      [phone, ipHash, settings.rateLimitWindowSeconds],
    );
    const limit = limits.rows[0];
    const latest = limit?.latest_phone_request ? new Date(limit.latest_phone_request).getTime() : 0;
    const retryAfter = Math.max(0, settings.resendCooldownSeconds - Math.floor((Date.now() - latest) / 1000));
    if (latest && retryAfter > 0) {
      setResponseHeader(event, "Retry-After", retryAfter);
      throw createError({ statusCode: 429, statusMessage: `กรุณารอ ${retryAfter} วินาทีก่อนขอรหัสใหม่`, data: { retryAfter } });
    }
    if (Number(limit?.phone_request_count || 0) >= settings.maxRequestsPerWindow ||
        Number(limit?.ip_request_count || 0) >= settings.maxRequestsPerWindow) {
      setResponseHeader(event, "Retry-After", settings.rateLimitWindowSeconds);
      throw createError({ statusCode: 429, statusMessage: "มีการขอรหัสบ่อยเกินไป กรุณาลองใหม่ภายหลัง", data: { retryAfter: settings.rateLimitWindowSeconds } });
    }

    const accounts = await client.query<{ uuid: string; role: string | null }>(
      `SELECT uuid, role FROM tb_users WHERE BTRIM(phone) = $1 AND deleted_at IS NULL LIMIT 2`, [phone],
    );
    const account = accounts.rows.length === 1 ? accounts.rows[0] : null;
    const accountId = account && String(account.role || "").toLowerCase() !== "admin" ? account.uuid : randomUUID();
    // Send for every valid phone, including absent or ambiguous accounts, so the
    // response and provider reference do not disclose membership.
    const provider = await requestThaiBulkSmsOtp(phone);
    await client.query(
      `UPDATE tb_otp_challenges SET consumed_at = NOW()
       WHERE phone = $1 AND purpose = 'password_reset' AND consumed_at IS NULL`, [phone],
    );
    const result = await client.query<{ uuid: string }>(
      `INSERT INTO tb_otp_challenges
        (phone, provider_token, refno, purpose, attempts, requester_ip_hash, expires_at)
       VALUES ($1, $2, $3, 'password_reset', 0, $4, NOW() + ($5 * INTERVAL '1 second'))
       RETURNING uuid`, [phone, provider.token, provider.refno, ipHash, settings.ttlSeconds],
    );
    const challengeId = result.rows[0]!.uuid;
    await client.query("COMMIT");
    deleteCookie(event, RESET_VERIFIED_COOKIE, { path: RESET_COOKIE_PATH });
    setCookie(event, RESET_COOKIE, resetAccountBinding(challengeId, accountId, secret), {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: RESET_COOKIE_PATH, maxAge: settings.ttlSeconds,
    });
    return { challengeId, refno: provider.refno, expiresIn: settings.ttlSeconds,
      resendAfter: settings.resendCooldownSeconds, otpLength: settings.length };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof OtpProviderError) {
      throw createError({ statusCode: 502, statusMessage: "ไม่สามารถส่งรหัสยืนยันได้ กรุณาลองใหม่ภายหลัง" });
    }
    throw error;
  } finally {
    client.release();
  }
});
