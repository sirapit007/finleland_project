type LineAdminOrderNotification = {
  customerName: string;
  deliveryLabel: string;
  itemCount: number;
  orderNumber: string;
  placedAt: string | Date;
  total: number;
  totalQuantity: number;
};

type LineCustomerOrderStatusNotification = {
  customerUuid: string;
  note?: string | null;
  orderNumber: string;
  status: string;
};

const statusLabels: Record<string, string> = {
  pending: "รอตรวจสอบ",
  confirmed: "ยืนยันคำสั่งซื้อแล้ว",
  processing: "กำลังเตรียมสินค้า",
  ready_for_pickup: "พร้อมรับสินค้า",
  shipped: "กำลังจัดส่ง",
  completed: "สำเร็จ",
  canceled: "ยกเลิก",
};

async function pushLineText(recipientId: string, text: string) {
  const config = useRuntimeConfig();
  const accessToken = String(config.lineMessagingChannelAccessToken || "").trim();

  if (!accessToken) {
    return {
      sent: false,
      skipped: true,
      reason: "LINE_CHANNEL_ACCESS_TOKEN has not been configured",
    };
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: recipientId,
      messages: [{ type: "text", text }],
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`LINE push notification failed (${response.status}): ${detail}`);
  }

  return { sent: true, skipped: false, reason: null };
}

export async function notifyLineAdminGroupOfNewOrder(
  order: LineAdminOrderNotification,
) {
  const config = useRuntimeConfig();
  const groupId = String(config.lineAdminGroupId || "").trim();

  if (!groupId) {
    return {
      sent: false,
      skipped: true,
      reason: "LINE_ADMIN_GROUP_ID has not been configured",
    };
  }

  const total = new Intl.NumberFormat("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(order.total);
  const placedAt = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.placedAt));
  return pushLineText(
    groupId,
    [
      "มีคำสั่งซื้อใหม่",
      `เลขที่: ${order.orderNumber}`,
      `ลูกค้า: ${order.customerName || "-"}`,
      `สั่งซื้อเมื่อ: ${placedAt}`,
      `จัดส่ง: ${order.deliveryLabel || "-"}`,
      `จำนวน: ${order.itemCount} รายการสินค้า`,
      `จำนวนสินค้า: ${order.totalQuantity} ชิ้น`,
      `ยอดรวม: ฿${total}`,
    ].join("\n"),
  );
}

export async function notifyLineCustomerOfOrderStatus(
  order: LineCustomerOrderStatusNotification,
) {
  const db = useDb();
  const accountResult = await db.query(
    `SELECT line_user_id
     FROM tb_user_line_accounts
     WHERE line_user = $1
       AND line_is_connected = TRUE
       AND deleted_at IS NULL
       AND line_user_id IS NOT NULL
     ORDER BY line_connected_at DESC, id DESC
     LIMIT 1`,
    [order.customerUuid],
  );
  const lineUserId = String(accountResult.rows[0]?.line_user_id || "").trim();

  if (!lineUserId) {
    return {
      sent: false,
      skipped: true,
      reason: "Customer has not connected a LINE account",
    };
  }

  return pushLineText(
    lineUserId,
    [
      "อัปเดตสถานะคำสั่งซื้อ",
      `เลขที่: ${order.orderNumber}`,
      `สถานะ: ${statusLabels[order.status] || order.status}`,
      order.note ? `หมายเหตุ: ${order.note}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
}
