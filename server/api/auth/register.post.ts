import { createHmac, createHash } from "node:crypto";
import { useDb } from "@@/server/utils/db";

const USERS_TABLE = "tb_users";
const TOKEN_AGE_SECONDS = 60 * 60 * 24;

type RegisterBody = {
  firstname?: string;
  lastname?: string;
  phone?: string;
  email?: string;
  password?: string;
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

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event);
  const firstname = String(body.firstname || "").trim().toLowerCase();
  const lastname = String(body.lastname || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

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

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: "JWT_SECRET is not configured",
    });
  }

  const db = useDb();

  const existing = await db.query(
    `SELECT id FROM ${USERS_TABLE} WHERE phone = $1 OR email = $2 LIMIT 1`,
    [phone, email],
  );

  if (existing.rows.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "User already exists",
    });
  }

  const hashedPassword = hashPassword(password);
  const role = "User";

  const result = await db.query<UserRow>(
    `INSERT INTO ${USERS_TABLE} (firstname, lastname, phone, email, password, role)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING
       id, uuid, firstname, lastname, phone, email, role`,
    [firstname, lastname, phone, email, hashedPassword, role],
  );

  const user = result.rows[0];

  const token = signJwt(
    {
      sub: String(user?.id),
      firstname: user?.firstname,
      lastname: user?.lastname,
      phone: user?.phone,
      email: user?.email,
      role: user?.role || role,
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
      ...user
    },
  };
});
