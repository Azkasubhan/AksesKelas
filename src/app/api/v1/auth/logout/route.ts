import { noContent, route } from "@/server/api";
import { destroyCurrentSession } from "@/server/auth/session";

export const runtime = "nodejs";

export const POST = route({ auth: "none", mutation: true }, async () => {
  await destroyCurrentSession();
  return noContent();
});
