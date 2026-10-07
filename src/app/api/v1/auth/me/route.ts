import { ok, route } from "@/server/api";
import { getPreferencesFor } from "@/server/services/auth.service";

export const runtime = "nodejs";

export const GET = route({ auth: "any" }, async ({ session }) => {
  const s = session!;
  return ok({
    user: {
      id: s.user.id,
      displayName: s.user.displayName,
      email: s.user.email,
      role: s.user.role,
    },
    preferences: await getPreferencesFor(s.user.id),
    csrfToken: s.csrfToken,
  });
});
