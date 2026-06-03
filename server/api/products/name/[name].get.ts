import { useDb } from "@@/server/utils/db";

export default defineEventHandler(async (event) => {
  const db = useDb();
  const rawName = getRouterParam(event, "name");

  function safeDecode(input: string) {
    try {
      return decodeURIComponent(input);
    } catch (e) {
      // Replace lone '%' characters (not followed by two hex digits) with '%25'
      // so decodeURIComponent won't throw on malformed sequences like '10%%20'
      const sanitized = input.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
      try {
        return decodeURIComponent(sanitized);
      } catch (e2) {
        // If still failing, return the original input as a fallback
        return input;
      }
    }
  }

  const name = typeof rawName === "string"
    ? safeDecode(rawName.replace(/\+/g, " "))
    : rawName;

  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: "Product name is required",
    });
  }

  const result = await db.query(
    `SELECT 
      product.*,
      user_c.username AS created_username,
      user_u.username AS updated_username
    FROM tb_all_products_demo AS product
    LEFT JOIN tb_users AS user_c ON user_c.uuid::text = product.created_by
    LEFT JOIN tb_users AS user_u ON user_u.uuid::text = product.updated_by
    LEFT JOIN tb_users AS user_d ON user_d.uuid::text = product.deleted_by
    WHERE product.demo_name = $1`,
    [name],
  );

  return {
    rows: result.rows,
    debug: `SELECT 
      product.*,
      user_c.username AS created_username,
      user_u.username AS updated_username
    FROM tb_all_products_demo AS product
    LEFT JOIN tb_users AS user_c ON user_c.uuid::text = product.created_by
    LEFT JOIN tb_users AS user_u ON user_u.uuid::text = product.updated_by
    LEFT JOIN tb_users AS user_d ON user_d.uuid::text = product.deleted_by
    WHERE product.demo_name = ${name}`,
  };
});
