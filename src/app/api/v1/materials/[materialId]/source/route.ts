import { ok, route } from "@/server/api";
import { getMaterialSource } from "@/server/services/materials.service";

export const runtime = "nodejs";

type P = { materialId: string };

export const GET = route<P>(
  { auth: "teacher" },
  async ({ session, params }) => {
    const sourceData = await getMaterialSource(session!.user, params.materialId);
    return ok(sourceData);
  },
);
