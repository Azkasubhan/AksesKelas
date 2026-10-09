import { ok, parseJson, route } from "@/server/api";
import { confirmSourceRevision } from "@/server/services/materials.service";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  sourceRevisionId: z.string().uuid().optional(),
});

type P = { materialId: string };

export const POST = route<P>(
  { auth: "teacher", mutation: true },
  async ({ req, session, params }) => {
    let sourceRevisionId: string | undefined;
    try {
      const body = await parseJson(req, schema);
      sourceRevisionId = body.sourceRevisionId;
    } catch {
      // Body opsional
    }

    const result = await confirmSourceRevision(
      session!.user,
      params.materialId,
      sourceRevisionId,
    );
    return ok(result);
  },
);
