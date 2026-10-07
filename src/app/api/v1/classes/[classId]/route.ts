import { ok, parseJson, route } from "@/server/api";
import { getClassForUser, updateClass } from "@/server/services/classes.service";
import { updateClassSchema } from "@/shared/schemas/auth-classes";

export const runtime = "nodejs";

type P = { classId: string };

export const GET = route<P>({ auth: "any" }, async ({ session, params }) => {
  return ok(await getClassForUser(session!.user, params.classId));
});

export const PATCH = route<P>({ auth: "teacher", mutation: true }, async ({ req, session, params }) => {
  const body = await parseJson(req, updateClassSchema);
  await updateClass(session!.user, params.classId, body);
  return ok(await getClassForUser(session!.user, params.classId));
});
