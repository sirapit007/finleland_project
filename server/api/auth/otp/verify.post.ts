import { useDb } from "@@/server/utils/db";
import { getOtpSettings } from "@@/server/utils/otpSettings";
import {
  OtpProviderError,
  verifyThaiBulkSmsOtp,
} from "@@/server/utils/thaiBulkSmsOtp";

const OTP_TABLE = "tb_otp_challenges";

type VerifyOtpBody = {
  challengeId?: string;
  pin?: string;
};

type ChallengeRow = {
  uuid: string;
  provider_token: string;
  attempts: number;
  expires_at: Date | string;
  verified_at: Date | string | null;
  consumed_at: Date | string | null;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<VerifyOtpBody>(event);
  const challengeId = String(body.challengeId || "").trim();
  const pin = String(body.pin || "").replace(/\D/g, "");
  const settings = getOtpSettings();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      challengeId,
    ) ||
    pin.length !== settings.length
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "รหัส OTP ไม่ถูกต้อง",
    });
  }

  const db = useDb();
  const client = await db.connect();
  let transactionCompleted = false;

  try {
    await client.query("BEGIN");
    const result = await client.query<ChallengeRow>(
      `SELECT uuid, provider_token, attempts, expires_at,
              verified_at, consumed_at
       FROM ${OTP_TABLE}
       WHERE uuid = $1
         AND purpose = 'signup'
       LIMIT 1
       FOR UPDATE`,
      [challengeId],
    );
    const challenge = result.rows[0];

    if (!challenge || challenge.consumed_at) {
      throw createError({
        statusCode: 400,
        statusMessage: "รหัส OTP ไม่ถูกต้องหรือไม่สามารถใช้งานได้แล้ว",
      });
    }

    if (challenge.verified_at) {
      await client.query("COMMIT");
      transactionCompleted = true;
      return { verified: true };
    }

    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
      throw createError({
        statusCode: 410,
        statusMessage: "รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่",
      });
    }

    if (challenge.attempts >= settings.maxVerifyAttempts) {
      throw createError({
        statusCode: 429,
        statusMessage: "กรอกรหัสผิดเกินจำนวนที่กำหนด กรุณาขอรหัสใหม่",
      });
    }

    const valid = await verifyThaiBulkSmsOtp(challenge.provider_token, pin);

    if (!valid) {
      const attempts = challenge.attempts + 1;
      await client.query(
        `UPDATE ${OTP_TABLE}
         SET attempts = $2,
             consumed_at = CASE WHEN $2 >= $3 THEN NOW() ELSE consumed_at END
         WHERE uuid = $1`,
        [challengeId, attempts, settings.maxVerifyAttempts],
      );
      await client.query("COMMIT");
      transactionCompleted = true;

      const remainingAttempts = Math.max(
        0,
        settings.maxVerifyAttempts - attempts,
      );
      throw createError({
        statusCode: remainingAttempts ? 400 : 429,
        statusMessage: remainingAttempts
          ? `รหัส OTP ไม่ถูกต้อง เหลือลองได้อีก ${remainingAttempts} ครั้ง`
          : "กรอกรหัสผิดเกินจำนวนที่กำหนด กรุณาขอรหัสใหม่",
        data: { remainingAttempts },
      });
    }

    await client.query(
      `UPDATE ${OTP_TABLE}
       SET verified_at = NOW()
       WHERE uuid = $1`,
      [challengeId],
    );
    await client.query("COMMIT");
    transactionCompleted = true;

    return { verified: true };
  } catch (error) {
    if (!transactionCompleted) {
      await client.query("ROLLBACK");
    }

    if (error instanceof OtpProviderError) {
      throw createError({
        statusCode: error.statusCode,
        statusMessage: "ระบบตรวจสอบ OTP ไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง",
      });
    }

    throw error;
  } finally {
    client.release();
  }
});
