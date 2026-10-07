try {
  process.loadEnvFile(".env");
} catch {
  // .env opsional
}

import path from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { getDb, getPool } from "../src/server/db/client";

/** Migration dijalankan sebagai langkah release tunggal, bukan tiap request. */
async function main() {
  await migrate(getDb(), { migrationsFolder: path.resolve("drizzle") });
  console.log("Migration selesai.");
  await getPool().end();
}

main().catch((err) => {
  console.error("Migration gagal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
