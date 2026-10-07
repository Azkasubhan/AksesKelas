import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "../env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { __akPool?: Pool };

function createPool(): Pool {
  const env = getEnv();
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
  });
  pool.on("error", (err) => {
    // Jangan log connection string.
    console.error("[db] pool error:", err.message);
  });
  return pool;
}

export function getPool(): Pool {
  if (!globalForDb.__akPool) globalForDb.__akPool = createPool();
  return globalForDb.__akPool;
}

let _db: ReturnType<typeof makeDb> | null = null;
function makeDb() {
  return drizzle(getPool(), { schema });
}

/** Klien Drizzle (lazy, satu pool per proses; dipakai ulang saat HMR). */
export function getDb() {
  if (!_db) _db = makeDb();
  return _db;
}

export type Db = ReturnType<typeof getDb>;
export { schema };
