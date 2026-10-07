import { ok, parseJson, route } from "@/server/api";
import { joinClass } from "@/server/services/classes.service";
import { joinClassSchema } from "@/shared/schemas/auth-classes";

export const runtime = "nodejs";

export const POST = route({ auth: "student", mutation: true }, async ({ req, session }) => {
  const body = await parseJson(req, joinClassSchema);
  const joined = await joinClass(session!.user, body);
  return ok(joined);
});
