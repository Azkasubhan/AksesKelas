try {
  process.loadEnvFile(".env");
} catch {
  // fallback for CI if needed
  process.env.APP_URL = "http://localhost:3000";
  process.env.DATABASE_URL = "postgresql://akseskelas:akseskelas_dev_local@localhost:5432/akseskelas";
  process.env.CSRF_SECRET = "fallback-test-secret-at-least-16-chars";
}

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./node_modules/server-only/empty.js"),
    },
  },
});
