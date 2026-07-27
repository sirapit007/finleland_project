import { createHmac, timingSafeEqual } from "node:crypto";
import { useDb } from "@@/server/utils/db";

type SessionPayload = {
  sub?: string;
  exp?: number;
};

type SessionUser = {
  id: number;
  uuid: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  role: string | null;
};

function toBase64UrlBuffer(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

export function getUserSession(event: any): SessionPayload | null {
  return getSessionFromCookie(event, "user_token");
}

export function getAdminSession(event: any): SessionPayload | null {
  return getSessionFromCookie(event, "admin_token");
}

function getSessionFromCookie(
  event: any,
  cookieName: "user_token" | "admin_token",
): SessionPayload | null {
  const token = getCookie(event, cookieName);
  const secret = process.env.JWT_SECRET;

  if (!token || !secret) {
    return null;
  }

  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest();
  const receivedSignature = toBase64UrlBuffer(signature);

  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return null;
  }

  try {
    const session = JSON.parse(
      toBase64UrlBuffer(payload).toString("utf8"),
    ) as SessionPayload;

    if (!session.sub || !session.exp || session.exp <= Date.now() / 1000) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function requireCurrentUser(event: any): Promise<SessionUser> {
  return requireSessionUser(event, "user_token", "Please sign in first");
}

export async function requireCurrentAdmin(event: any): Promise<SessionUser> {
  const user = await requireSessionUser(
    event,
    "admin_token",
    "Please sign in as an administrator first",
  );

  if (user.role !== "Admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "Administrator privileges are required",
    });
  }

  return user;
}

export async function requireCurrentActor(event: any): Promise<{
  isAdmin: boolean;
  user: SessionUser;
}> {
  if (getAdminSession(event)) {
    return { isAdmin: true, user: await requireCurrentAdmin(event) };
  }
  if (getUserSession(event)) {
    return { isAdmin: false, user: await requireCurrentUser(event) };
  }

  throw createError({
    statusCode: 401,
    statusMessage: "Please sign in first",
  });
}

async function requireSessionUser(
  event: any,
  cookieName: "user_token" | "admin_token",
  unauthenticatedMessage: string,
): Promise<SessionUser> {
  const session = getSessionFromCookie(event, cookieName);

  if (!session?.sub) {
    throw createError({
      statusCode: 401,
      statusMessage: unauthenticatedMessage,
    });
  }

  const db = useDb();
  const result = await db.query<SessionUser>(
    `SELECT id, uuid, firstname, lastname, email, phone, role
     FROM tb_users
     WHERE id = $1
       AND deleted_at IS NULL
     LIMIT 1`,
    [session.sub],
  );
  const user = result.rows[0];

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Your sign-in session is no longer valid",
    });
  }

  return user;
}
