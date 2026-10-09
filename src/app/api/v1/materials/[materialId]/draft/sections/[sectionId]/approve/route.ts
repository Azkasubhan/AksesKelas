import { ok, parseJson, route } from "@/server/api";
import { approveDraftSection } from "@/server/services/drafts.service";
import { approveDraftSectionSchema } from "@/shared/schemas/drafts-reader";

export const runtime = "nodejs";

type P = { materialId: string; sectionId: string };

export const POST = route<P>(
  { auth: "teacher", mutation: true },
  async ({ req, session, params }) => {
    const body = await parseJson(req, approveDraftSectionSchema);
    const result = await approveDraftSection(
      session!.user,
      params.materialId,
      params.sectionId,
      body,
    );
    return ok(result);
  },
);
