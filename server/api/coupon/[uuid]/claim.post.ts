import { assertCouponUuid } from "@@/server/utils/couponRules";
import { requireCurrentUser } from "@@/server/utils/session";
import { couponTransaction } from "@@/server/utils/couponApi";
import { grantCoupon } from "@@/server/utils/coupons";
export default defineEventHandler(async (event) => {
  const user = await requireCurrentUser(event),
    uuid = assertCouponUuid(getRouterParam(event, "uuid"));
  return couponTransaction((client) =>
    grantCoupon(client, uuid, user.uuid, "claim", user.uuid),
  );
});
