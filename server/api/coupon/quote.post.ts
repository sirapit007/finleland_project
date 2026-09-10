import { assertCouponUuid } from "@@/server/utils/couponRules";
import { requireCurrentUser } from "@@/server/utils/session";
import { couponTransaction } from "@@/server/utils/couponApi";
import {
  evaluateAndLockUserCoupon,
  getCouponBasket,
} from "@@/server/utils/coupons";
export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event),
    body = await readBody(event);
  const uuid = assertCouponUuid(body?.user_coupon_uuid);
  return couponTransaction(async (client) => {
    const basket = await getCouponBasket(client, user.uuid);
    const result = await evaluateAndLockUserCoupon(
      client,
      user.uuid,
      uuid,
      basket,
    );
    return {
      row: {
        user_coupon_uuid: result.userCouponUuid,
        coupon_name: result.snapshot.coupon_name,
        discount_amount: result.discountAmount,
      },
      basket,
    };
  });
});
