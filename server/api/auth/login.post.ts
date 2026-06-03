import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { useDb } from "@@/server/utils/db";

const USERS_TABLE = "tb_users";
const ID_COLUMN = "id";
const USERNAME_COLUMN = "username";
const PASSWORD_COLUMN = "password";
const ROLE_COLUMN = "role";

const TOKEN_AGE_SECONDS = 60 * 60 * 24;

type LoginBody = {
  username?: string;
  password?: string;
  //   rememberMe?: boolean;
};

type UserRow = {
  id: number | string;
  uuid: string;
  username: string;
  password: string;
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

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event);
  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Username and password are required",
    });
  }

  const db = useDb();
  const result = await db.query<UserRow>(
    `SELECT id, uuid, username, password, role
     FROM tb_users
     WHERE username = $1
     LIMIT 1`,
    [username],
  );

  const user = result.rows[0];
  const hashedPassword = hashPassword(password);

  if (!user || !safeCompare(hashedPassword, user.password.trim())) {
    throw createError({
      statusCode: 401,
      statusMessage: `Invalid username or password`,
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: "JWT_SECRET is not configured",
    });
  }

  //   const maxAge = body.rememberMe ? TOKEN_AGE_SECONDS * 30 : TOKEN_AGE_SECONDS;
  const maxAge = TOKEN_AGE_SECONDS;
  const token = signJwt(
    {
      sub: String(user.id),
      username: user.username,
      role: user.role || "admin",
    },
    jwtSecret,
    maxAge,
  );

  setCookie(event, "admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });

  return {
    token,
    user: {
      id: user.id,
      uuid: user.uuid,
      username: user.username,
      role: user.role || "admin",
    },
  };
});
