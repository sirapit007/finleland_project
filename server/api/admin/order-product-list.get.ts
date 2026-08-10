import { useDb } from "@@/server/utils/db";
import { normalizeProductImageUrls } from "@@/server/utils/productImages";
import { requireCurrentAdmin } from "@@/server/utils/session";

export default defineEventHandler(async (event) => {
  const admin = await requireCurrentAdmin(event);
  const orderUuid = String(getQuery(event).orderUuid || "").trim();

  if (!orderUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: "Order uuid is required",
    });
  }

  const db = useDb();
  const [orderResult, itemResult] = await Promise.all([
    db.query(
      `SELECT base.uuid,
              base.order_number,
              base.order_customer_name,
              base.order_status,
              base.created_at
       FROM tb_shopping_orders AS base
       WHERE base.uuid::text = $1
         AND base.deleted_at IS NULL
       LIMIT 1`,
      [orderUuid],
    ),
    db.query(
      `SELECT item.uuid,
              item.order_item_product_code,
              item.order_item_product_name,
              item.order_item_product_image,
              item.order_item_quantity,
              product.image_url AS product_image_url,
              COALESCE(
                posted.order_item_transaction_unit_cost,
                product.product_cost_price,
                0
              ) AS order_item_unit_cost
       FROM tb_shopping_order_items AS item
       LEFT JOIN vw_master_products AS product
         ON product.uuid::text = item.order_item_product
       LEFT JOIN LATERAL (
         SELECT posted_transaction.order_item_transaction_unit_cost
         FROM tb_shopping_order_item_transactions AS posted_transaction
         WHERE posted_transaction.order_item_transaction_order_item = item.uuid::text
           AND posted_transaction.order_item_transaction_status = 'posted'
           AND posted_transaction.deleted_at IS NULL
         ORDER BY posted_transaction.order_item_transaction_recognized_at DESC,
                  posted_transaction.id DESC
         LIMIT 1
       ) AS posted ON TRUE
       WHERE item.order_item_order = $1
         AND item.deleted_at IS NULL
       ORDER BY item.id ASC`,
      [orderUuid],
    ),
  ]);

  const order = orderResult.rows[0] || null;
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: "ไม่พบคำสั่งซื้อ",
    });
  }

  return {
    order,
    items: itemResult.rows.map((item) => {
      const snapshotImages = normalizeProductImageUrls(
        item.order_item_product_image,
      );

      return {
        ...item,
        order_item_product_image: snapshotImages.length
          ? snapshotImages
          : normalizeProductImageUrls(item.product_image_url),
        order_item_unit: "ชิ้น",
      };
    }),
    printedBy:
      [admin.firstname, admin.lastname].filter(Boolean).join(" ").trim() ||
      admin.email ||
      "ผู้ดูแลระบบ",
    printedAt: new Date().toISOString(),
  };
});
