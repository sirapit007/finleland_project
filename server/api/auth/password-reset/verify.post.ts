import { useDb } from "@@/server/utils/db";
import { getOtpSettings } from "@@/server/utils/otpSettings";
import { RESET_COOKIE, RESET_COOKIE_PATH, RESET_VERIFIED_COOKIE, resetVerificationProof } from "@@/server/utils/passwordReset";
import { OtpProviderError, verifyThaiBulkSmsOtp } from "@@/server/utils/thaiBulkSmsOtp";

type Challenge = { phone: string; provider_token: string; attempts: number; expires_at: Date | string; verified_at: Date | string | null; consumed_at: Date | string | null };

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const body = await readBody<{ challengeId?: string; phone?: string; otp?: string }>(event);
  const challengeId = String(body?.challengeId || "").trim();
  const phone = String(body?.phone || "").replace(/\s+/g, "");
  const otp = String(body?.otp || "").trim();
  const settings = getOtpSettings();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(challengeId) ||
      !/^[0-9]{10}$/.test(phone) || !/^\d+$/.test(otp) || otp.length !== settings.length) {
    throw createError({ statusCode: 400, statusMessage: "ข้อมูลหรือรหัสยืนยันไม่ถูกต้อง" });
  }
  const secret = String(process.env.JWT_SECRET || "");
  if (!secret) throw createError({ statusCode: 500, statusMessage: "ระบบไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง" });
  const binding = getCookie(event, RESET_COOKIE) || "";
  if (!/^[0-9a-f]{64}$/.test(binding)) {
    throw createError({ statusCode: 403, statusMessage: "การยืนยันหมดอายุ กรุณาขอรหัสใหม่" });
  }

  const client = await useDb().connect();
  let committed = false;
  try {
    await client.query("BEGIN");
    const result = await client.query<Challenge>(
      `SELECT phone, provider_token, attempts, expires_at, verified_at, consumed_at FROM tb_otp_challenges
       WHERE uuid = $1 AND purpose = 'password_reset' FOR UPDATE`, [challengeId],
    );
    const challenge = result.rows[0];
    if (!challenge || challenge.phone !== phone || challenge.consumed_at || challenge.verified_at ||
        challenge.attempts >= settings.maxVerifyAttempts) {
      throw createError({ statusCode: 400, statusMessage: "รหัสยืนยันไม่ถูกต้องหรือใช้งานไม่ได้ กรุณาขอรหัสใหม่" });
    }
    const secondsLeft = Math.floor((new Date(challenge.expires_at).getTime() - Date.now()) / 1000);
    if (secondsLeft <= 0) {
      throw createError({ statusCode: 410, statusMessage: "รหัสยืนยันหมดอายุ กรุณาขอรหัสใหม่" });
    }
    const valid = await verifyThaiBulkSmsOtp(challenge.provider_token, otp);
    if (!valid) {
      const attempts = challenge.attempts + 1;
      await client.query(
        `UPDATE tb_otp_challenges SET attempts = $2,
         consumed_at = CASE WHEN $2 >= $3 THEN NOW() ELSE consumed_at END WHERE uuid = $1`,
        [challengeId, attempts, settings.maxVerifyAttempts],
      );
      await client.query("COMMIT");
      committed = true;
      const remainingAttempts = Math.max(0, settings.maxVerifyAttempts - attempts);
      throw createError({ statusCode: remainingAttempts ? 400 : 429,
        statusMessage: remainingAttempts ? `รหัส OTP ไม่ถูกต้อง เหลือลองได้อีก ${remainingAttempts} ครั้ง` : "กรอกรหัสผิดเกินจำนวนที่กำหนด กรุณาขอรหัสใหม่",
        data: { remainingAttempts } });
    }
    // The provider call can take time; never issue proof for an expired OTP.
    const proofLifetime = Math.floor((new Date(challenge.expires_at).getTime() - Date.now()) / 1000);
    if (proofLifetime <= 0) throw createError({ statusCode: 410, statusMessage: "รหัสยืนยันหมดอายุ กรุณาขอรหัสใหม่" });
    await client.query("UPDATE tb_otp_challenges SET verified_at = NOW() WHERE uuid = $1", [challengeId]);
    await client.query("COMMIT");
    committed = true;
    setCookie(event, RESET_VERIFIED_COOKIE, resetVerificationProof(challengeId, binding, secret), {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
      path: RESET_COOKIE_PATH, maxAge: proofLifetime,
    });
    return { verified: true };
  } catch (error) {
    if (!committed) await client.query("ROLLBACK");
    if (error instanceof OtpProviderError) {
      throw createError({ statusCode: 502, statusMessage: "ระบบตรวจสอบ OTP ไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง" });
    }
    throw error;
  } finally {
    client.release();
  }
});
