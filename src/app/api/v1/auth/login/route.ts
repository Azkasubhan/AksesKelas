import { clientIp, ok, parseJson, route } from "@/server/api";
import { createSession } from "@/server/auth/session";
import { authenticateUser } from "@/server/services/auth.service";
import { loginSchema } from "@/shared/schemas/auth-classes";
import { homeFor } from "@/shared/paths";

export const runtime = "nodejs";

export const POST = route({ auth: "none", mutation: true }, async ({ req }) => {
  const body = await parseJson(req, loginSchema);
  const user = await authenticateUser(body, clientIp(req));
  await createSession(user.id);
  return ok({ role: user.role, redirectTo: homeFor(user.role) });
});
