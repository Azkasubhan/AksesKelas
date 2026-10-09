import { ok, parseJson, route } from "@/server/api";
import { getPublishedLesson } from "@/server/services/drafts.service";
import { getReadingProgress, saveReadingProgress } from "@/server/services/preferences.service";
import { updateReadingProgressSchema } from "@/shared/schemas/preferences";

export const runtime = "nodejs";

type P = { materialId: string };

export const GET = route<P>(
  { auth: "any" },
  async ({ session, params }) => {
    const user = session!.user;
    const lesson = await getPublishedLesson(user, params.materialId);
    const progress = await getReadingProgress(user.id, lesson.id);
    return ok(progress);
  },
);

export const PUT = route<P>(
  { auth: "any", mutation: true },
  async ({ req, session, params }) => {
    const user = session!.user;
    const lesson = await getPublishedLesson(user, params.materialId);
    const body = await parseJson(req, updateReadingProgressSchema);
    const saved = await saveReadingProgress(user.id, lesson.id, body);
    return ok(saved);
  },
);
