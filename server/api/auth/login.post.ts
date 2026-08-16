import { useDb } from "@@/server/utils/db";
import { hashPassword, verifyPassword } from "@@/server/utils/password";
import {
  createPasswordSessionVersion,
  signSessionToken,
} from "@@/server/utils/sessionToken";

const USERS_TABLE = "tb_users";
const ID_COLUMN = "id";
const USERNAME_COLUMN = "username";
const PASSWORD_COLUMN = "password";
const ROLE_COLUMN = "role";

const TOKEN_AGE_SECONDS = 60 * 60 * 24;

type LoginBody = {
  username?: string;
  password?: string;
  rememberMe?: boolean;
  admin?: boolean;
};

type UserRow = {
  id: number | string;
  uuid: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  password: string;
  role?: string | null;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<LoginBody>(event);
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  const admin = Boolean(body.admin);

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Username and password are required",
    });
  }

  const db = useDb();
  const result = await db.query<UserRow>(
    `SELECT id, uuid, firstname, lastname, phone, email, password, role
     FROM tb_users
     WHERE deleted_at IS NULL
       AND (phone = $1 OR LOWER(email) = LOWER($1))
     LIMIT 1`,
    [username],
  );

  const user = result.rows[0];

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: `Invalid username or password`,
    });
  }

  const passwordResult = await verifyPassword(password, user.password);

  if (!passwordResult.valid) {
    throw createError({
      statusCode: 401,
      statusMessage: `Invalid username or password`,
    });
  }

  let sessionPasswordHash = user.password;

  if (passwordResult.needsUpgrade) {
    const upgradedHash = await hashPassword(password);
    await db.query(
      `UPDATE ${USERS_TABLE}
       SET password = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [upgradedHash, user.id],
    );
    sessionPasswordHash = upgradedHash;
  }

  if (admin && user.role !== "Admin") {
    throw createError({
      statusCode: 500,
      statusMessage: "This account does not have admin privileges",
    });
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: "JWT_SECRET is not configured",
    });
  }

  const maxAge = body.rememberMe ? TOKEN_AGE_SECONDS * 30 : TOKEN_AGE_SECONDS;
  const token = signSessionToken(
    {
      sub: String(user?.id),
      pwdv: createPasswordSessionVersion(sessionPasswordHash, jwtSecret),
      firstname: user?.firstname,
      lastname: user?.lastname,
      phone: user?.phone,
      email: user?.email,
      role: user?.role,
    },
    jwtSecret,
    maxAge,
  );

  setCookie(event, admin ? "admin_token" : "user_token", token, {
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
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone,
      email: user.email,
      role: user.role,
    },
  };
});
