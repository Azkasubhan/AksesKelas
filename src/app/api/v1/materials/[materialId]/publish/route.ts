import { ok, parseJson, route } from "@/server/api";
import { publishMaterial } from "@/server/services/drafts.service";
import { publishDraftSchema } from "@/shared/schemas/drafts-reader";

export const runtime = "nodejs";

type P = { materialId: string };

export const POST = route<P>(
  { auth: "teacher", mutation: true },
  async ({ req, session, params }) => {
    const body = await parseJson(req, publishDraftSchema);
    const result = await publishMaterial(session!.user, params.materialId, body);
    return ok(result);
  },
);
