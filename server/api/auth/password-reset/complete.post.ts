import { useDb } from "@@/server/utils/db";
import { hashPassword } from "@@/server/utils/password";
import { RESET_COOKIE, RESET_COOKIE_PATH, RESET_VERIFIED_COOKIE, matchesResetAccountBinding, matchesResetVerificationProof } from "@@/server/utils/passwordReset";

type Challenge = { phone: string; expires_at: Date | string; verified_at: Date | string | null; consumed_at: Date | string | null };

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const body = await readBody<{ challengeId?: string; phone?: string; password?: string }>(event);
  const challengeId = String(body?.challengeId || "").trim();
  const phone = String(body?.phone || "").replace(/\s+/g, "");
  const password = String(body?.password || "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(challengeId) ||
      !/^[0-9]{10}$/.test(phone)) {
    throw createError({ statusCode: 400, statusMessage: "ข้อมูลหรือรหัสยืนยันไม่ถูกต้อง" });
  }
  if (password.length < 6 || password.length > 256) {
    throw createError({ statusCode: 400, statusMessage: "รหัสผ่านต้องมีความยาว 6–256 ตัวอักษร" });
  }
  const secret = String(process.env.JWT_SECRET || "");
  if (!secret) throw createError({ statusCode: 500, statusMessage: "ระบบไม่พร้อมใช้งาน กรุณาลองใหม่ภายหลัง" });
  const binding = getCookie(event, RESET_COOKIE) || "";
  const proof = getCookie(event, RESET_VERIFIED_COOKIE) || "";
  if (!/^[0-9a-f]{64}$/.test(binding) || !matchesResetVerificationProof(proof, challengeId, binding, secret)) {
    throw createError({ statusCode: 403, statusMessage: "การยืนยันหมดอายุ กรุณาขอรหัสใหม่" });
  }

  const client = await useDb().connect();
  let committed = false;
  try {
    await client.query("BEGIN");
    const result = await client.query<Challenge>(
      `SELECT phone, expires_at, verified_at, consumed_at FROM tb_otp_challenges
       WHERE uuid = $1 AND purpose = 'password_reset' FOR UPDATE`, [challengeId],
    );
    const challenge = result.rows[0];
    if (!challenge || challenge.phone !== phone || challenge.consumed_at || !challenge.verified_at) {
      throw createError({ statusCode: 400, statusMessage: "การยืนยันไม่ถูกต้องหรือใช้งานไม่ได้ กรุณาขอรหัสใหม่" });
    }
    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
      throw createError({ statusCode: 410, statusMessage: "การยืนยันหมดอายุ กรุณาขอรหัสใหม่" });
    }

    // Match the identity lock used by registration and profile changes so a
    // phone cannot be assigned to another account during the update.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`signup-phone:${phone}`]);
    const accounts = await client.query<{ uuid: string; role: string | null }>(
      `SELECT uuid, role FROM tb_users WHERE BTRIM(phone) = $1 AND deleted_at IS NULL LIMIT 2 FOR UPDATE`, [phone],
    );
    // Run the same password hashing work regardless of whether an account exists.
    const passwordHash = await hashPassword(password);
    // A lock or password hashing can take time. Claim the proof only if it is
    // still valid at this moment; rollback also undoes this claim on failure.
    const consumed = await client.query(
      `UPDATE tb_otp_challenges SET consumed_at = clock_timestamp()
       WHERE uuid = $1 AND expires_at > clock_timestamp() RETURNING uuid`, [challengeId],
    );
    if (!consumed.rowCount) {
      throw createError({ statusCode: 410, statusMessage: "การยืนยันหมดอายุ กรุณาขอรหัสใหม่" });
    }
    if (accounts.rows.length === 1 && String(accounts.rows[0]!.role || "").toLowerCase() !== "admin" &&
        matchesResetAccountBinding(binding, challengeId, accounts.rows[0]!.uuid, secret)) {
      await client.query(
        `UPDATE tb_users SET password = $1, updated_at = NOW()
         WHERE uuid = $2 AND BTRIM(phone) = $3 AND deleted_at IS NULL AND LOWER(COALESCE(role, '')) <> 'admin'`,
        [passwordHash, accounts.rows[0]!.uuid, phone],
      );
    }
    await client.query("COMMIT");
    committed = true;
    deleteCookie(event, RESET_COOKIE, { path: RESET_COOKIE_PATH });
    deleteCookie(event, RESET_VERIFIED_COOKIE, { path: RESET_COOKIE_PATH });
    return { success: true };
  } catch (error) {
    if (!committed) await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
