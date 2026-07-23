import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type ContactStatusBody = {
  contact_status?: string;
};

export default defineEventHandler(async (event) => {
  const admin = await requireCurrentAdmin(event);
  const uuid = String(getRouterParam(event, "uuid") || "").trim();
  const body = await readBody<ContactStatusBody>(event);
  const contactStatus = String(body.contact_status || "").trim();
  const allowedStatuses = new Set(["new", "reviewed", "resolved"]);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Contact uuid is required",
    });
  }

  if (!allowedStatuses.has(contactStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Contact status is invalid",
    });
  }

  const db = useDb();
  const result = await db.query(
    `UPDATE tb_user_contacts
     SET contact_status = $1,
         updated_by = $2,
         updated_at = now()
     WHERE uuid = $3
       AND deleted_at IS NULL
     RETURNING *`,
    [contactStatus, admin.uuid, uuid],
  );

  if (!result.rows[0]) {
    throw createError({
      statusCode: 404,
      statusMessage: "Contact feedback was not found",
    });
  }

  return {
    row: result.rows[0],
  };
});
