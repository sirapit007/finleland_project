import { requireCurrentActor } from "@@/server/utils/session";

export async function requireScopedUserAccess(
  event: any,
  requestedUserUuid?: unknown,
) {
  const actor = await requireCurrentActor(event);
  const targetUserUuid = String(requestedUserUuid || "").trim();

  if (targetUserUuid && !actor.isAdmin && targetUserUuid !== actor.user.uuid) {
    throw createError({
      statusCode: 403,
      statusMessage: "Administrator privileges are required",
    });
  }

  return {
    actor,
    userUuid: targetUserUuid || actor.user.uuid,
  };
}

export async function requireScopedUserUuid(
  event: any,
  requestedUserUuid?: unknown,
) {
  const access = await requireScopedUserAccess(event, requestedUserUuid);
  return access.userUuid;
}
