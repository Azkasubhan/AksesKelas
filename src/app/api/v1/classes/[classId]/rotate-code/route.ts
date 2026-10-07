import { ok, route } from "@/server/api";
import { rotateJoinCode } from "@/server/services/classes.service";

export const runtime = "nodejs";

export const POST = route<{ classId: string }>(
  { auth: "teacher", mutation: true },
  async ({ session, params }) => ok(await rotateJoinCode(session!.user, params.classId)),
);
