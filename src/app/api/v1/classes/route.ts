import { ok, parseJson, route } from "@/server/api";
import { createClass, listClassesForStudent, listClassesForTeacher } from "@/server/services/classes.service";
import { createClassSchema } from "@/shared/schemas/auth-classes";

export const runtime = "nodejs";

export const GET = route({ auth: "any" }, async ({ session }) => {
  const user = session!.user;
  const data =
    user.role === "teacher"
      ? await listClassesForTeacher(user.id)
      : await listClassesForStudent(user.id);
  return ok(data);
});

export const POST = route({ auth: "teacher", mutation: true }, async ({ req, session }) => {
  const body = await parseJson(req, createClassSchema);
  const created = await createClass(session!.user, body);
  return ok(created, 201);
});
