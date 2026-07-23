import { upsertLineAccount } from "@@/server/utils/lineAccounts";
import { requireCurrentUser } from "@@/server/utils/session";

type LineAccountBody = {
  line_provider_id?: string;
  line_user_id?: string;
  line_display_name?: string;
  line_picture_url?: string;
};

export default defineEventHandler(async (event) => {
  const currentUser = await requireCurrentUser(event);
  const body = await readBody<LineAccountBody>(event);

  const row = await upsertLineAccount({
    lineUser: currentUser.uuid,
    lineProviderId: String(body.line_provider_id || "").trim(),
    lineUserId: String(body.line_user_id || "").trim(),
    lineDisplayName: String(body.line_display_name || "").trim() || null,
    linePictureUrl: String(body.line_picture_url || "").trim() || null,
  });

  return { row };
});
