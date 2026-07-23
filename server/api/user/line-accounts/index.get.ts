import { requireCurrentUser } from "@@/server/utils/session";
import { useDb } from "@@/server/utils/db";

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event);
  const db = useDb();
  const result = await db.query(
    `SELECT base.*
     FROM tb_user_line_accounts AS base
     WHERE base.line_user = $1
       AND base.deleted_at IS NULL
     ORDER BY base.line_connected_at DESC, base.id DESC`,
    [currentUser.uuid],
  );

  return {
    rows: result.rows,
    total: result.rows.length,
  };
});
