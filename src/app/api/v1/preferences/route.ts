import { ok, parseJson, route } from "@/server/api";
import { getUserPreferences, updateUserPreferences } from "@/server/services/preferences.service";
import { updateReadingPreferencesSchema } from "@/shared/schemas/preferences";

export const runtime = "nodejs";

export const GET = route({ auth: "any" }, async ({ session }) => {
  const user = session!.user;
  const preferences = await getUserPreferences(user.id);
  return ok(preferences);
});

export const PATCH = route({ auth: "any", mutation: true }, async ({ req, session }) => {
  const user = session!.user;
  const body = await parseJson(req, updateReadingPreferencesSchema);
  const updated = await updateUserPreferences(user.id, body);
  return ok(updated);
});
