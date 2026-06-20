import { useDb } from "@@/server/utils/db";

type SupplierBody = {
  supplier_code?: string;
  supplier_name?: string;
  supplier_address?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_suppliers";

  const db = useDb();
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<SupplierBody>(event);

  if (!uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Supplier uuid is required",
    });
  }

  const supplier_code = String(body.supplier_code || "").trim();
  const supplier_name = String(body.supplier_name || "").trim();
  const supplier_address = String(body.supplier_address || "").trim();
  const deleted_by = null;
  const deleted_at = null;
  const user: any = body.user || "";

  if (!supplier_code || !supplier_name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Supplier code and name are required",
    });
  }

  const result = await db.query(
    `UPDATE ${tableName}
    SET supplier_code = $1, supplier_name = $2, supplier_address = $3, updated_by = $4, updated_at = now(), deleted_by = $5, deleted_at = $6
    WHERE uuid = $7
     RETURNING *`,
    [
      supplier_code,
      supplier_name,
      supplier_address,
      user.uuid,
      deleted_by,
      deleted_at,
      uuid,
    ],
  );

  return {
    row: result.rows[0],
  };
});
