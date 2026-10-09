import { noContent, route } from "@/server/api";
import { unpublishMaterial } from "@/server/services/drafts.service";

export const runtime = "nodejs";

type P = { materialId: string };

export const POST = route<P>(
  { auth: "teacher", mutation: true },
  async ({ session, params }) => {
    await unpublishMaterial(session!.user, params.materialId);
    return noContent();
  },
);
