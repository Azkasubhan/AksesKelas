import { ok, route } from "@/server/api";
import { getPublishedLesson } from "@/server/services/drafts.service";

export const runtime = "nodejs";

type P = { materialId: string };

export const GET = route<P>(
  { auth: "any" },
  async ({ session, params }) => {
    const lesson = await getPublishedLesson(session!.user, params.materialId);
    return ok(lesson);
  },
);
