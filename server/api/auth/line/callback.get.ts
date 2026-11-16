import { consumeLineAuthState, lineAuthCallbackUrl, setLineSignup } from "@@/server/utils/lineAuth";
import { getLineLoginConfig } from "@@/server/utils/lineLogin";
import { useDb } from "@@/server/utils/db";
import { createPasswordSessionVersion, signSessionToken } from "@@/server/utils/sessionToken";

type LineProfile = { sub?: string; nonce?: string; name?: string; picture?: string; email?: string };
type User = { id: number; uuid: string; firstname: string; lastname: string; phone: string; email: string; password: string; role: string | null };

export default defineEventHandler(async (event) => {
  setResponseHeader(event, "Cache-Control", "no-store");
  const redirect = (result: string) => sendRedirect(event, `/auth/line?result=${result}`);
  const query = getQuery(event);
  let config;
  try {
    config = getLineLoginConfig();
  } catch {
    return redirect("error");
  }
  const state = typeof query.state === "string" ? query.state : "";
  const oauth = consumeLineAuthState(event, config.stateSecret, state);
  if (!oauth) return redirect("error");
  if (query.error) return redirect("cancelled");
  if (typeof query.code !== "string" || !query.code) return redirect("error");

  try {
    const token = await $fetch<{ id_token?: string }>("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: query.code,
        redirect_uri: lineAuthCallbackUrl(config),
        client_id: config.channelId,
        client_secret: config.channelSecret,
        code_verifier: oauth.verifier,
      }),
    });
    if (!token.id_token) return redirect("error");
    const profile = await $fetch<LineProfile>("https://api.line.me/oauth2/v2.1/verify", {
      method: "POST",
      body: new URLSearchParams({ id_token: token.id_token, client_id: config.channelId }),
    });
    if (!profile.sub || !/^U[0-9a-f]{32}$/i.test(profile.sub) || profile.nonce !== oauth.nonce) {
      return redirect("error");
    }
    const db = useDb();
    if (oauth.intent === "register") {
      const existing = await db.query(
        `SELECT 1 FROM tb_user_line_accounts
         WHERE line_provider_id = $1 AND line_user_id = $2 AND deleted_at IS NULL LIMIT 1`,
        [config.providerId, profile.sub],
      );
      if (existing.rowCount) return redirect("duplicate");
      setLineSignup(event, config, { ...profile, sub: profile.sub });
      return redirect("register");
    }

    const result = await db.query<User>(
      `SELECT u.id, u.uuid, u.firstname, u.lastname, u.phone, u.email, u.password, u.role
       FROM tb_user_line_accounts AS l JOIN tb_users AS u ON u.uuid::text = l.line_user
       WHERE l.line_provider_id = $1 AND l.line_user_id = $2
         AND l.deleted_at IS NULL AND l.line_is_connected = TRUE
         AND l.line_login_verified_at IS NOT NULL AND u.deleted_at IS NULL
       LIMIT 1`,
      [config.providerId, profile.sub],
    );
    const user = result.rows[0];
    if (!user) return redirect("unlinked");
    const secret = process.env.JWT_SECRET;
    if (!secret || !user.password) return redirect("error");
    const maxAge = 60 * 60 * 24;
    const session = signSessionToken({
      sub: String(user.id),
      pwdv: createPasswordSessionVersion(user.password, secret),
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone,
      email: user.email,
      role: user.role,
    }, secret, maxAge);
    setCookie(event, "user_token", session, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge,
    });
    return redirect("login");
  } catch {
    return redirect("error");
  }
});

