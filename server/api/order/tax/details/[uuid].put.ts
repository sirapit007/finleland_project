import { useDb } from "@@/server/utils/db";
import { requireCurrentAdmin } from "@@/server/utils/session";

type Body = { order_tax_status?: string; order_tax_invoice_number?: string | null; order_tax_document_url?: string | null };
const statuses = new Set(["requested", "processing", "issued", "cancelled"]);

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, "uuid");
  const body = await readBody<Body>(event);
  const admin = await requireCurrentAdmin(event);
  if (!uuid) throw createError({ statusCode: 400, statusMessage: "Order tax detail uuid is required" });
  const status = body.order_tax_status === undefined ? null : String(body.order_tax_status).trim();
  if (status && !statuses.has(status)) throw createError({ statusCode: 400, statusMessage: "Tax document status is invalid" });
  const invoiceNumber = body.order_tax_invoice_number === undefined ? undefined : String(body.order_tax_invoice_number || "").trim() || null;
  const documentUrl = body.order_tax_document_url === undefined ? undefined : String(body.order_tax_document_url || "").trim() || null;
  if (documentUrl && !/^https?:\/\//i.test(documentUrl)) throw createError({ statusCode: 400, statusMessage: "Tax document URL is invalid" });
  const db = useDb();
  try {
    const result = await db.query(
      `UPDATE tb_shopping_order_tax_details SET
        order_tax_status=COALESCE($1, order_tax_status),
        order_tax_invoice_number=CASE WHEN $2::boolean THEN $3 ELSE order_tax_invoice_number END,
        order_tax_document_url=CASE WHEN $4::boolean THEN $5 ELSE order_tax_document_url END,
        order_tax_issued_at=CASE WHEN COALESCE($1, order_tax_status)='issued' THEN COALESCE(order_tax_issued_at, NOW()) ELSE order_tax_issued_at END,
        updated_by=$6, updated_at=NOW()
       WHERE uuid::text=$7 RETURNING *`,
      [status, invoiceNumber !== undefined, invoiceNumber ?? null, documentUrl !== undefined, documentUrl ?? null, admin.uuid, uuid],
    );
    if (!result.rows[0]) throw createError({ statusCode: 404, statusMessage: "Order tax detail was not found" });
    return { row: result.rows[0] };
  } catch (error: any) {
    if (error?.code === "23505") throw createError({ statusCode: 409, statusMessage: "Invoice number already exists" });
    throw error;
  }
});
