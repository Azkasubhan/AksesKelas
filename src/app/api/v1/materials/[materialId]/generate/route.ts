import { ok, parseJson, route } from "@/server/api";
import { triggerMaterialGeneration } from "@/server/services/ai-jobs.service";
import { z } from "zod";

export const runtime = "nodejs";

const generateSchema = z.object({
  sourceRevisionId: z.string().uuid().optional(),
  idempotencyKey: z.string().optional(),
});

type P = { materialId: string };

export const POST = route<P>(
  { auth: "teacher", mutation: true },
  async ({ req, session, params }) => {
    let sourceRevisionId: string | undefined;
    let idempotencyKey: string | undefined = req.headers.get("idempotency-key") || undefined;

    try {
      const body = await parseJson(req, generateSchema);
      sourceRevisionId = body.sourceRevisionId;
      if (body.idempotencyKey) idempotencyKey = body.idempotencyKey;
    } catch {
      // Body opsional
    }

    const result = await triggerMaterialGeneration(
      session!.user,
      params.materialId,
      { sourceRevisionId, idempotencyKey },
    );

    // Return 202 Accepted sesuai PRD Bagian 11
    return ok(result, 202);
  },
);
