import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type SupplierBody = {
  supplier_code?: string;
  supplier_name?: string;
  supplier_address?: string;
  user?: object;
};

export default defineEventHandler(async (event) => {
  const tableName = "tb_master_suppliers";

  const body = await readBody<SupplierBody>(event);
  const db = useDb();
  const admin = await requireCurrentAdmin(event);

  const supplier_code = String(body.supplier_code || "").trim();
  const supplier_name = String(body.supplier_name || "").trim();
  const supplier_address = String(body.supplier_address || "").trim();

  if (!supplier_code || !supplier_name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Supplier code and name are required",
    });
  }

  const result = await db.query(
    `INSERT INTO ${tableName} (supplier_code, supplier_name, supplier_address, created_by)
    VALUES($1, $2, $3, $4)
     RETURNING *`,
    [supplier_code, supplier_name, supplier_address, admin.uuid],
  );

  return {
    row: result.rows[0],
  };
});
