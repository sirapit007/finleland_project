import { useDb } from "@@/server/utils/db";
import { requireCurrentUser } from "@@/server/utils/session";

type ContactBody = {
  contact_message?: string;
};

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event);
  const body = await readBody<ContactBody>(event);
  const contactMessage = String(body.contact_message || "").trim();

  if (contactMessage.length < 5 || contactMessage.length > 5000) {
    throw createError({
      statusCode: 400,
      statusMessage: "Feedback must be between 5 and 5,000 characters",
    });
  }

  const db = useDb();
  const result = await db.query(
    `INSERT INTO tb_user_contacts
      (contact_user, contact_message, contact_status, created_by)
     VALUES ($1, $2, 'new', $1)
     RETURNING uuid, contact_message, contact_status, created_at`,
    [currentUser.uuid, contactMessage],
  );

  setResponseStatus(event, 201);

  return {
    row: result.rows[0],
  };
});
