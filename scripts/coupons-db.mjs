import pg from "pg";
import { readFile } from "node:fs/promises";
const command = process.argv[2];
if (!["migrate", "seed", "status"].includes(command))
  throw new Error(
    "Usage: node --env-file=.env scripts/coupons-db.mjs migrate|seed|status",
  );
const client = new pg.Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});
try {
  await client.connect();
  if (command === "migrate") {
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query(
      await readFile(
        new URL("../database/tb_event_coupons.sql", import.meta.url),
        "utf8",
      ),
    );
    await client.query("COMMIT");
    console.log("Coupon schema applied.");
  }
  if (command === "seed") {
    await client.query("BEGIN");
    const result = await client.query(`INSERT INTO tb_event_coupons
      (coupon_key,coupon_name,coupon_description,coupon_discount_type,coupon_discount_value,coupon_min_purchase_amount,coupon_usage_limit,coupon_recipient_limit,coupon_distribution_method,coupon_status,coupon_activated_at,created_by)
      VALUES ('welcome-new-members-20','คูปองต้อนรับสมาชิกใหม่','สำหรับสมาชิกใหม่ 20 คนแรก ลด 50 บาท เมื่อซื้อครบ 500 บาท ใช้ได้ 1 ครั้ง ไม่มีวันหมดอายุ','amount',50,500,1,20,'signup','active',clock_timestamp(),'system:coupon-seed')
      ON CONFLICT (coupon_key) DO NOTHING RETURNING uuid`);
    await client.query("COMMIT");
    console.log(
      result.rowCount
        ? "Welcome coupon created and activated."
        : "Welcome coupon already exists; preserved unchanged.",
    );
  }
  const status = await client.query(
    `SELECT uuid,coupon_name,coupon_discount_value,coupon_min_purchase_amount,coupon_recipient_limit,coupon_issued_count,coupon_usage_limit,coupon_expires_at,coupon_activated_at,coupon_status FROM tb_event_coupons WHERE coupon_key='welcome-new-members-20'`,
  );
  console.log(JSON.stringify(status.rows, null, 2));
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
