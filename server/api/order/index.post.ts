import { randomUUID } from "node:crypto";
import { useDb } from "@@/server/utils/db";
import { notifyLineAdminGroupOfNewOrder } from "@@/server/utils/lineMessaging";
import { calculateOrderItemPricing, toMoney } from "@@/server/utils/orderPricing";
import { requireCurrentUser } from "@@/server/utils/session";

type DeliveryMethod = "pickup" | "normal" | "express";

type OrderBody = {
  order_shipping_address_uuid?: string;
  order_tax_profile_uuid?: string;
  order_delivery_method?: string;
  order_customer_note?: string;
};

const deliveryOptions: Record<
  DeliveryMethod,
  { label: string; description: string; fee: number }
> = {
  pickup: {
    label: "รับสินค้าด้วยตัวเอง",
    description: "รับสินค้าได้ที่หน้าร้านหรือจุดรับสินค้า",
    fee: 0,
  },
  normal: {
    label: "จัดส่งทั่วประเทศ",
    description: "2 - 4 วันทำการ",
    fee: 35,
  },
  express: {
    label: "ส่งด่วนใกล้บ้าน",
    description: "ภายใน 1 - 2 ชม.",
    fee: 39,
  },
};

const createOrderNumber = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${randomUUID()
    .replaceAll("-", "")
    .slice(0, 8)
    .toUpperCase()}`;

const toImageSnapshot = (image: unknown) => {
  if (typeof image === "string") {
    return image || null;
  }

  return image ? JSON.stringify(image) : null;
};

export default defineEventHandler(async (event) => {
  const body = await readBody<OrderBody>(event);
  const currentUser = await requireCurrentUser(event);
  const userUuid = currentUser.uuid;
  const deliveryMethod = String(body.order_delivery_method || "").trim();
  const shippingAddressUuid = String(
    body.order_shipping_address_uuid || "",
  ).trim();
  const taxProfileUuid = String(body.order_tax_profile_uuid || "").trim();
  const customerNote = String(body.order_customer_note || "").trim() || null;

  if (!Object.hasOwn(deliveryOptions, deliveryMethod)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Delivery method is invalid",
    });
  }

  const selectedDelivery = deliveryOptions[deliveryMethod as DeliveryMethod];
  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `SELECT uuid::text AS uuid, firstname, lastname, email, phone
       FROM tb_users
       WHERE uuid::text = $1
         AND deleted_at IS NULL
       LIMIT 1`,
      [userUuid],
    );
    const orderUser = userResult.rows[0];

    if (!orderUser) {
      throw createError({ statusCode: 404, statusMessage: "User was not found" });
    }

    let shippingAddress: Record<string, any> | null = null;
    let taxProfile: Record<string, any> | null = null;

    if (deliveryMethod !== "pickup") {
      if (!shippingAddressUuid) {
        throw createError({
          statusCode: 400,
          statusMessage: "Shipping address is required",
        });
      }

      const addressResult = await client.query(
        `SELECT uuid::text AS uuid,
                shipping_label,
                shipping_recipient,
                shipping_phone,
                shipping_address,
                shipping_subdistrict,
                shipping_district,
                shipping_province,
                shipping_postcode,
                shipping_note
         FROM tb_user_shipping_addresses
         WHERE uuid::text = $1
           AND shipping_user = $2
           AND deleted_at IS NULL
         LIMIT 1`,
        [shippingAddressUuid, userUuid],
      );
      shippingAddress = addressResult.rows[0] || null;

      if (!shippingAddress) {
        throw createError({
          statusCode: 404,
          statusMessage: "Shipping address was not found",
        });
      }
    }

    if (taxProfileUuid) {
      const taxProfileResult = await client.query(
        `SELECT uuid::text AS uuid,
                taxpayer_type,
                taxpayer_name,
                taxpayer_id,
                taxpayer_branch_type,
                taxpayer_branch_code,
                taxpayer_address,
                taxpayer_subdistrict,
                taxpayer_district,
                taxpayer_province,
                taxpayer_postcode,
                taxpayer_phone,
                taxpayer_email
         FROM tb_user_tax_profiles
         WHERE uuid::text = $1
           AND tax_profile_user = $2
           AND deleted_at IS NULL
         LIMIT 1`,
        [taxProfileUuid, userUuid],
      );
      taxProfile = taxProfileResult.rows[0] || null;

      if (!taxProfile) {
        throw createError({
          statusCode: 404,
          statusMessage: "Tax profile was not found",
        });
      }
    }

    // The promotion is resolved again within this transaction; browser totals are never trusted.
    const basketResult = await client.query(
      `SELECT basket.uuid::text AS basket_uuid,
              basket.basket_product,
              basket.basket_quantity,
              product.product_code,
              product.product_name,
              product.image_url,
              product.product_selling_price,
              promotion.uuid::text AS promotion_uuid,
              promotion.promotion_name,
              promotion.promotion_discounted_price,
              promotion.promotion_bundle_price,
              promotion.promotion_min_quantity,
              promotion.promotion_min_purchase_amount
       FROM tb_shopping_basket AS basket
       LEFT JOIN vw_master_products AS product
         ON product.uuid::text = basket.basket_product
       LEFT JOIN LATERAL (
         SELECT promotion.*
         FROM tb_event_promotions AS promotion
         WHERE promotion.promotion_product = basket.basket_product
           AND promotion.promotion_is_active = TRUE
           AND promotion.deleted_at IS NULL
           AND CURRENT_DATE BETWEEN promotion.promotion_start_date AND promotion.promotion_end_date
         ORDER BY promotion.promotion_start_date DESC, promotion.id DESC
         LIMIT 1
       ) AS promotion ON TRUE
       WHERE basket.created_by = $1
         AND basket.deleted_at IS NULL
         AND basket.basket_expire > NOW()
       ORDER BY basket.id ASC
       FOR UPDATE OF basket`,
      [userUuid],
    );

    if (!basketResult.rows.length) {
      throw createError({
        statusCode: 400,
        statusMessage: "Your basket has no active items",
      });
    }

    const orderItems = basketResult.rows.map((basket) => {
      const quantity = Math.floor(Number(basket.basket_quantity || 0));
      const pricing = calculateOrderItemPricing(basket, quantity);

      if (
        !basket.basket_product ||
        !basket.product_code ||
        !basket.product_name ||
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(pricing.normalUnitPrice) ||
        pricing.normalUnitPrice <= 0
      ) {
        throw createError({
          statusCode: 400,
          statusMessage: "A product in your basket is unavailable or invalid",
        });
      }

      return {
        basketUuid: String(basket.basket_uuid),
        productUuid: String(basket.basket_product),
        productCode: String(basket.product_code),
        productImage: toImageSnapshot(basket.image_url),
        productName: String(basket.product_name),
        promotionName: pricing.promotionName,
        promotionUuid: pricing.promotionUuid,
        quantity,
        ...pricing,
      };
    });

    const subtotal = toMoney(
      orderItems.reduce((total, item) => total + item.subtotal, 0),
    );
    const discount = toMoney(
      orderItems.reduce((total, item) => total + item.discount, 0),
    );
    const merchandiseTotal = toMoney(subtotal - discount);

    if (merchandiseTotal < 1500) {
      throw createError({
        statusCode: 400,
        statusMessage: "Minimum order total after promotions is 1,500 THB",
      });
    }

    const shippingFee = selectedDelivery.fee;
    const grandTotal = toMoney(merchandiseTotal + shippingFee);
    const customerName = `${orderUser.firstname || ""} ${orderUser.lastname || ""}`.trim();

    const orderResult = await client.query(
      `INSERT INTO tb_shopping_orders (
        order_number,
        order_user,
        order_customer_name,
        order_customer_email,
        order_customer_phone,
        order_shipping_address_uuid,
        order_shipping_label,
        order_shipping_recipient,
        order_shipping_phone,
        order_shipping_address,
        order_shipping_subdistrict,
        order_shipping_district,
        order_shipping_province,
        order_shipping_postcode,
        order_shipping_note,
        order_delivery_method,
        order_delivery_label,
        order_delivery_description,
        order_subtotal,
        order_discount,
        order_shipping_fee,
        order_tax_amount,
        order_grand_total,
        order_customer_note,
        order_status,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
      )
      RETURNING *`,
      [
        createOrderNumber(),
        userUuid,
        customerName,
        orderUser.email || null,
        orderUser.phone,
        shippingAddress?.uuid || null,
        shippingAddress?.shipping_label || null,
        shippingAddress?.shipping_recipient || null,
        shippingAddress?.shipping_phone || null,
        shippingAddress?.shipping_address || null,
        shippingAddress?.shipping_subdistrict || null,
        shippingAddress?.shipping_district || null,
        shippingAddress?.shipping_province || null,
        shippingAddress?.shipping_postcode || null,
        shippingAddress?.shipping_note || null,
        deliveryMethod,
        selectedDelivery.label,
        selectedDelivery.description,
        subtotal,
        discount,
        shippingFee,
        0,
        grandTotal,
        customerNote,
        "pending",
        userUuid,
      ],
    );
    const order = orderResult.rows[0];

    let taxDetail: Record<string, any> | null = null;
    if (taxProfile) {
      const taxDetailResult = await client.query(
        `INSERT INTO tb_shopping_order_tax_details (
          order_tax_order,
          order_tax_profile_uuid,
          order_taxpayer_type,
          order_taxpayer_name,
          order_taxpayer_id,
          order_taxpayer_branch_type,
          order_taxpayer_branch_code,
          order_taxpayer_address,
          order_taxpayer_subdistrict,
          order_taxpayer_district,
          order_taxpayer_province,
          order_taxpayer_postcode,
          order_taxpayer_phone,
          order_taxpayer_email,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )
        RETURNING *`,
        [
          order.uuid,
          taxProfile.uuid,
          taxProfile.taxpayer_type,
          taxProfile.taxpayer_name,
          taxProfile.taxpayer_id,
          taxProfile.taxpayer_branch_type,
          taxProfile.taxpayer_branch_code,
          taxProfile.taxpayer_address,
          taxProfile.taxpayer_subdistrict,
          taxProfile.taxpayer_district,
          taxProfile.taxpayer_province,
          taxProfile.taxpayer_postcode,
          taxProfile.taxpayer_phone,
          taxProfile.taxpayer_email,
          userUuid,
        ],
      );
      taxDetail = taxDetailResult.rows[0];
    }

    await client.query(
      `INSERT INTO tb_shopping_order_status_histories (
        order_status_history_order,
        order_status_history_previous_status,
        order_status_history_status,
        order_status_history_note,
        created_by
      ) VALUES ($1, $2, $3, $4, $5)`,
      [order.uuid, null, "pending", "Customer placed this order", userUuid],
    );

    const createdItems = [];
    for (const item of orderItems) {
      const itemResult = await client.query(
        `INSERT INTO tb_shopping_order_items (
          order_item_order,
          order_item_product,
          order_item_product_code,
          order_item_product_name,
          order_item_product_image,
          order_item_unit_price,
          order_item_quantity,
          order_item_subtotal,
          order_item_discount,
          order_item_total,
          order_item_promotion,
          order_item_promotion_name,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          order.uuid,
          item.productUuid,
          item.productCode,
          item.productName,
          item.productImage,
          item.normalUnitPrice,
          item.quantity,
          item.subtotal,
          item.discount,
          item.total,
          item.promotionUuid,
          item.promotionName,
          userUuid,
        ],
      );
      createdItems.push(itemResult.rows[0]);
    }

    await client.query(
      `UPDATE tb_shopping_basket
       SET updated_by = $1,
           updated_at = NOW(),
           deleted_by = $1,
           deleted_at = NOW()
       WHERE created_by = $1
         AND uuid::text = ANY($2::text[])
         AND deleted_at IS NULL`,
      [
        userUuid,
        orderItems.map((item) => item.basketUuid),
      ],
    );

    await client.query("COMMIT");

    let lineNotification = {
      sent: false,
      reason: "LINE notification was not attempted",
    };
    try {
      const notification = await notifyLineAdminGroupOfNewOrder({
        customerName,
        deliveryLabel: selectedDelivery.label,
        itemCount: createdItems.length,
        orderNumber: order.order_number,
        placedAt: order.order_placed_at || order.created_at || new Date(),
        total: grandTotal,
        totalQuantity: orderItems.reduce(
          (total, item) => total + item.quantity,
          0,
        ),
      });
      lineNotification = {
        sent: notification.sent,
        reason: notification.reason,
      };
    } catch (error) {
      // A completed order must not be rolled back because an external notification fails.
      console.error("Unable to send LINE order notification", error);
      lineNotification = {
        sent: false,
        reason: "LINE rejected the notification request. Check the server log.",
      };
    }

    return { row: order, items: createdItems, taxDetail, lineNotification };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
});
