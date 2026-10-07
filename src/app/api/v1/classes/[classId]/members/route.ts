import { ok, route } from "@/server/api";
import { listMembers } from "@/server/services/classes.service";

export const runtime = "nodejs";

export const GET = route<{ classId: string }>(
  { auth: "teacher" },
  async ({ session, params }) => ok(await listMembers(session!.user, params.classId)),
);
