import { useDb } from "@@/server/utils/db";

const TABLE_NAME = "tb_user_line_accounts";

export type LineAccountInput = {
  lineUser: string;
  lineProviderId: string;
  lineUserId: string;
  lineDisplayName?: string | null;
  linePictureUrl?: string | null;
};

function assertLineAccountInput(input: LineAccountInput) {
  if (
    !input.lineUser ||
    !input.lineProviderId ||
    !/^U[0-9a-f]{32}$/i.test(input.lineUserId)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid LINE account information",
    });
  }
}

export async function upsertLineAccount(input: LineAccountInput) {
  assertLineAccountInput(input);

  const db = useDb();
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const linkedAccount = await client.query(
      `SELECT line_user
       FROM ${TABLE_NAME}
       WHERE line_provider_id = $1
         AND line_user_id = $2
         AND deleted_at IS NULL
       FOR UPDATE`,
      [input.lineProviderId, input.lineUserId],
    );

    if (
      linkedAccount.rows[0] &&
      linkedAccount.rows[0].line_user !== input.lineUser
    ) {
      throw createError({
        statusCode: 409,
        statusMessage: "This LINE account is already connected to another user",
      });
    }

    const currentAccount = await client.query(
      `SELECT uuid
       FROM ${TABLE_NAME}
       WHERE line_user = $1
         AND line_provider_id = $2
         AND deleted_at IS NULL
       FOR UPDATE`,
      [input.lineUser, input.lineProviderId],
    );

    let result;

    if (currentAccount.rows[0]) {
      result = await client.query(
        `UPDATE ${TABLE_NAME}
         SET line_user_id = $1,
             line_display_name = $2,
             line_picture_url = $3,
             line_connected_at = now(),
             line_disconnected_at = NULL,
             line_is_connected = TRUE,
             updated_by = $4,
             updated_at = now(),
             deleted_by = NULL,
             deleted_at = NULL
         WHERE uuid = $5
         RETURNING *`,
        [
          input.lineUserId,
          input.lineDisplayName || null,
          input.linePictureUrl || null,
          input.lineUser,
          currentAccount.rows[0].uuid,
        ],
      );
    } else {
      result = await client.query(
        `INSERT INTO ${TABLE_NAME}
          (line_user, line_provider_id, line_user_id, line_display_name, line_picture_url, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          input.lineUser,
          input.lineProviderId,
          input.lineUserId,
          input.lineDisplayName || null,
          input.linePictureUrl || null,
          input.lineUser,
        ],
      );
    }

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
