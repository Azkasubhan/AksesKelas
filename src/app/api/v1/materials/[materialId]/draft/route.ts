import { ok, route } from "@/server/api";
import { getMaterialDraft } from "@/server/services/drafts.service";

export const runtime = "nodejs";

type P = { materialId: string };

export const GET = route<P>(
  { auth: "teacher" },
  async ({ session, params }) => {
    const draft = await getMaterialDraft(session!.user, params.materialId);
    return ok(draft);
  },
);
