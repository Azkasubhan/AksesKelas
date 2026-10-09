import { ok, parseJson, route } from "@/server/api";
import { updateDraftSection } from "@/server/services/drafts.service";
import { updateDraftSectionSchema } from "@/shared/schemas/drafts-reader";

export const runtime = "nodejs";

type P = { materialId: string; sectionId: string };

export const PATCH = route<P>(
  { auth: "teacher", mutation: true },
  async ({ req, session, params }) => {
    const body = await parseJson(req, updateDraftSectionSchema);
    const result = await updateDraftSection(
      session!.user,
      params.materialId,
      params.sectionId,
      body,
    );
    return ok(result);
  },
);
