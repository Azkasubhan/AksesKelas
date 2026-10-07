import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/server/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness minimal; readiness DB tidak membocorkan detail koneksi. */
export async function GET() {
  let database: "ok" | "unavailable" = "ok";
  try {
    await getDb().execute(sql`select 1`);
  } catch {
    database = "unavailable";
  }
  return NextResponse.json(
    { data: { status: database === "ok" ? "ok" : "degraded", database } },
    { status: database === "ok" ? 200 : 503, headers: { "Cache-Control": "private, no-store" } },
  );
}
