import { readFile, writeFile } from "node:fs/promises";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error("Usage: node scripts/generate-product-inserts.mjs <input> <output>");
}

const input = await readFile(inputPath, "utf8");
const fields = ["product_supplier", "product_category", "created_by"];
const constants = Object.fromEntries(
  fields.map((field) => {
    const match = input.match(new RegExp(`^${field}\\s*=\\s*(.+?)\\s*$`, "m"));
    if (!match) throw new Error(`Missing ${field}`);
    return [field, match[1]];
  }),
);

const jsonStart = input.indexOf("[");
const jsonEnd = input.lastIndexOf("]");
if (jsonStart === -1 || jsonEnd < jsonStart) throw new Error("Missing JSON array");

const products = JSON.parse(input.slice(jsonStart, jsonEnd + 1));
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;

const inserts = products.map((product) => {
  const required = [
    "product_name",

    "product_selling_price",
    "product_cost_price",
  ];
  for (const field of required) {
    if (product[field] === undefined || product[field] === null) {
      throw new Error(`Missing ${field} for ${JSON.stringify(product)}`);
    }
  }

  return [
    "INSERT INTO tb_master_products (",
    "  product_supplier,",
    "  product_category,",
    "  created_by,",
    "  product_name,",
    "  product_code,",
    "  product_selling_price,",
    "  product_cost_price",
    ") VALUES (",
    `  ${quote(constants.product_supplier)},`,
    `  ${quote(constants.product_category)},`,
    `  ${quote(constants.created_by)},`,
    `  ${quote(product.product_name)},`,
    `  ${quote(product.product_code ?? product.code)},`,
    `  ${Number(product.product_selling_price)},`,
    `  ${Number(product.product_cost_price)}`,
    ");",
  ].join("\n");
});

const output = [
  "BEGIN;",
  "",
  ...inserts.flatMap((insert) => [insert, ""]),
  "COMMIT;",
  "",
].join("\n");

await writeFile(outputPath, output, "utf8");
console.log(`Generated ${products.length} INSERT statements in ${outputPath}`);
