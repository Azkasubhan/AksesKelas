import { ok, route } from "@/server/api";
import { deleteMaterial } from "@/server/services/materials.service";

export const runtime = "nodejs";

type P = { materialId: string };

export const DELETE = route<P>(
  { auth: "teacher", mutation: true },
  async ({ session, params }) => {
    const result = await deleteMaterial(session!.user, params.materialId);
    return ok({ deleted: true, ...result });
  },
);
