import { requireScopedUserUuid } from "@@/server/utils/scopedUser";
import { useDb } from "@@/server/utils/db";

type LineAccountQuery = {
  user_uuid?: string;
};

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as LineAccountQuery;
  const scopedUserUuid = await requireScopedUserUuid(event, query.user_uuid);
  const db = useDb();
  const result = await db.query(
    `SELECT base.*
     FROM tb_user_line_accounts AS base
     WHERE base.line_user = $1
       AND base.deleted_at IS NULL
     ORDER BY base.line_connected_at DESC, base.id DESC`,
    [scopedUserUuid],
  );

  return {
    rows: result.rows,
    total: result.rows.length,
  };
});
