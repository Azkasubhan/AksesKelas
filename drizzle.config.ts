try {
  process.loadEnvFile(".env");
} catch {
  // .env opsional; variabel dapat datang dari environment proses.
}

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
