import { createHmac } from "node:crypto";
import { useDb } from "@@/server/utils/db";
import { hashPassword } from "@@/server/utils/password";

const USERS_TABLE = "tb_users";
const OTP_TABLE = "tb_otp_challenges";
const TOKEN_AGE_SECONDS = 60 * 60 * 24;

type RegisterBody = {
  firstname?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  password?: string;
  challengeId?: string;
};

type UserRow = {
  id: number | string;
  uuid: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  role?: string | null;
};

type OtpChallengeRow = {
  uuid: string;
  phone: string;
  email: string | null;
  expires_at: Date | string;
  verified_at: Date | string | null;
  consumed_at: Date | string | null;
};

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: number,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const tokenPayload = { ...payload, iat: now, exp: now + expiresIn };

  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(tokenPayload),
  )}`;
  const signature = createHmac("sha256", secret).update(unsignedToken).digest();

  return `${unsignedToken}.${base64Url(signature)}`;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event);
  const firstname = String(body.firstname || "")
    .trim()
    .toLowerCase();
  const lastname = String(body.lastname || "")
    .trim()
    .toLowerCase();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");
  const challengeId = String(body.challengeId || "").trim();

  if (!firstname || !lastname || !email || !phone || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "All signup fields are required",
    });
  }

  if (!/^[0-9]{10}$/.test(phone)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Phone number must contain exactly 10 digits",
    });
  }

  if (password.length < 6) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password must contain at least 6 characters",
    });
  }

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      challengeId,
    )
  ) {
    throw createError({
      statusCode: 403,
      statusMessage: "กรุณายืนยันเบอร์โทรศัพท์ด้วย OTP ก่อนสมัครสมาชิก",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: "JWT_SECRET is not configured",
    });
  }

  const db = useDb();
  const role = "User";
  const client = await db.connect();
  let user: UserRow | undefined;

  try {
    await client.query("BEGIN");
    const challengeResult = await client.query<OtpChallengeRow>(
      `SELECT uuid, phone, email, expires_at, verified_at, consumed_at
       FROM ${OTP_TABLE}
       WHERE uuid = $1
         AND purpose = 'signup'
       LIMIT 1
       FOR UPDATE`,
      [challengeId],
    );
    const challenge = challengeResult.rows[0];

    if (
      !challenge ||
      !challenge.verified_at ||
      challenge.consumed_at ||
      new Date(challenge.expires_at).getTime() <= Date.now() ||
      challenge.phone !== phone ||
      String(challenge.email || "").toLowerCase() !== email
    ) {
      throw createError({
        statusCode: 403,
        statusMessage:
          "การยืนยันเบอร์โทรศัพท์ไม่ถูกต้องหรือหมดอายุ กรุณาขอ OTP ใหม่",
      });
    }

    // Prevent concurrent registrations using the same phone or email.
    const registrationLocks = [
      `signup-email:${email}`,
      `signup-phone:${phone}`,
    ].sort();
    for (const lock of registrationLocks) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [lock]);
    }

    const existing = await client.query(
      `SELECT id
       FROM ${USERS_TABLE}
       WHERE (phone = $1 OR LOWER(email) = $2) AND deleted_at IS NULL
       LIMIT 1`,
      [phone, email],
    );

    if (existing.rowCount) {
      throw createError({
        statusCode: 409,
        statusMessage: "ไม่สามารถสมัครสมาชิกด้วยข้อมูลนี้ได้",
      });
    }

    const hashedPassword = await hashPassword(password);
    const result = await client.query<UserRow>(
      `INSERT INTO ${USERS_TABLE}
        (firstname, lastname, phone, email, password, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, uuid, firstname, lastname, phone, email, role`,
      [firstname, lastname, phone, email, hashedPassword, role],
    );
    user = result.rows[0];

    await client.query(
      `UPDATE ${OTP_TABLE}
       SET consumed_at = NOW()
       WHERE uuid = $1`,
      [challengeId],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  if (!user) {
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to create user",
    });
  }

  const token = signJwt(
    {
      sub: String(user.id),
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone,
      email: user.email,
      role: user.role || role,
    },
    jwtSecret,
    TOKEN_AGE_SECONDS,
  );

  setCookie(event, "user_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_AGE_SECONDS,
  });

  return {
    token,
    user: {
      ...user,
    },
  };
});
