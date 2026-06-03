import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function useDb() {
  const config = useRuntimeConfig();

  if (!pool) {
    pool = new Pool({
      host: config.dbHost,
      port: Number(config.dbPort || 5432),
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      ssl: config.dbSsl === "true" ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}
