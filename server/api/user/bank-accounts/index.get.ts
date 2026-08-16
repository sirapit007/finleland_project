import { useDb } from "@@/server/utils/db";
import { requireScopedUserAccess } from "@@/server/utils/scopedUser";
import { toSafeBankAccountRow } from "@@/server/utils/bankAccount";

type BankAccountQuery = {
  page?: string;
  pageSize?: string;
  orderBy?: string;
  q?: string;
  uuid?: string;
  deleted?: string;
  user_uuid?: string;
  include_account_number?: string;
};

export default defineEventHandler(async (event) => {
  const db = useDb();
  const query = getQuery(event) as BankAccountQuery;
  const { actor, userUuid: scopedUserUuid } = await requireScopedUserAccess(
    event,
    query.user_uuid,
  );
  const includeAccountNumber = query.include_account_number === "true";

  if (includeAccountNumber && !actor.isAdmin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Administrator privileges are required",
    });
  }

  if (includeAccountNumber) {
    setHeader(event, "Cache-Control", "private, no-store");
  }
  const page = Math.max(Number(query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize || 10), 1), 100);
  const offset = (page - 1) * pageSize;
  const requestedOrderBy = String(query.orderBy || "base.id DESC");
  const allowedOrderBy = new Set([
    "base.id DESC",
    "base.id ASC",
    "base.bank_account_holder_name ASC",
    "base.bank_account_holder_name DESC",
    "base.created_at DESC",
    "base.created_at ASC",
  ]);
  const orderBy = allowedOrderBy.has(requestedOrderBy)
    ? requestedOrderBy
    : "base.id DESC";
  const params: unknown[] = [scopedUserUuid];
  let condition = "base.bank_account_user = $1";
  condition += query.deleted
    ? " AND base.deleted_at IS NOT NULL"
    : " AND base.deleted_at IS NULL";

  if (query.q) {
    params.push(`%${String(query.q).trim()}%`);
    const q = `$${params.length}`;
    condition += ` AND (
      base.bank_account_bank_code ILIKE ${q}
      OR base.bank_account_holder_name ILIKE ${q}
      OR base.bank_account_number_last4 ILIKE ${q}
    )`;
  }

  if (query.uuid) {
    params.push(String(query.uuid));
    condition += ` AND base.uuid::text = $${params.length}`;
  }

  params.push(pageSize, offset);
  const result = await db.query(
    `SELECT
       base.id,
       base.uuid,
       base.bank_account_user,
       base.bank_account_bank_code,
       base.bank_account_holder_name,
       ${includeAccountNumber ? "base.bank_account_number_encrypted," : ""}
       base.bank_account_number_last4,
       base.created_by,
       base.created_at,
       base.updated_by,
       base.updated_at,
       base.deleted_by,
       base.deleted_at,
       concat_ws(' ', user_c.firstname, user_c.lastname) AS created_username,
       concat_ws(' ', user_u.firstname, user_u.lastname) AS updated_username,
       concat_ws(' ', user_d.firstname, user_d.lastname) AS deleted_username
     FROM tb_user_bank_accounts AS base
     LEFT JOIN tb_users AS user_c ON user_c.uuid::text = base.created_by
     LEFT JOIN tb_users AS user_u ON user_u.uuid::text = base.updated_by
     LEFT JOIN tb_users AS user_d ON user_d.uuid::text = base.deleted_by
     WHERE ${condition}
     ORDER BY ${orderBy}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  const totalResult = await db.query(
    `SELECT COUNT(*) AS total
     FROM tb_user_bank_accounts AS base
     WHERE ${condition}`,
    params.slice(0, -2),
  );
  const total = Number(totalResult.rows[0]?.total || 0);

  return {
    rows: result.rows.map((row) =>
      toSafeBankAccountRow(row, { includeAccountNumber }),
    ),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
});
