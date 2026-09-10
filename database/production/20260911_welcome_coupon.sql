-- Optional: run after deploying coupon-capable application code.
-- Starts the first-20-new-members campaign at execution time.
-- Re-running does not recreate or reset an existing campaign.
BEGIN;

INSERT INTO tb_event_coupons (
  coupon_key,
  coupon_name,
  coupon_description,
  coupon_discount_type,
  coupon_discount_value,
  coupon_min_purchase_amount,
  coupon_usage_limit,
  coupon_recipient_limit,
  coupon_distribution_method,
  coupon_status,
  coupon_activated_at,
  created_by
)
VALUES (
  'welcome-new-members-20',
  'คูปองต้อนรับสมาชิกใหม่',
  'สำหรับสมาชิกใหม่ 20 คนแรก ลด 50 บาท เมื่อซื้อครบ 500 บาท ใช้ได้ 1 ครั้ง ไม่มีวันหมดอายุ',
  'amount',
  50,
  500,
  1,
  20,
  'signup',
  'active',
  clock_timestamp(),
  'system:coupon-seed'
)
ON CONFLICT (coupon_key) DO NOTHING;

COMMIT;
