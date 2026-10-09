import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import {
  classes,
  materials,
  sourceRevisions,
  sourceBlocks,
  lessonDrafts,
  processingJobs,
  auditEvents,
} from "@/server/db/schema";
import { Errors } from "@/server/errors";
import { consumeRateLimit } from "@/server/auth/rate-limit";
import { getEnv } from "@/server/env";
import type { SessionUser } from "@/server/auth/session";
import { runFullAdaptation } from "@/server/ai/gemini-adapter";

export interface JobStatusDto {
  id: string;
  materialId: string;
  kind: string;
  status: "queued" | "running" | "retry_wait" | "succeeded" | "failed";
  stage: string;
  completedUnits: number;
  totalUnits: number | null;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Memicu eksekusi job pembuatan/adaptasi materi oleh AI (PRD Bagian 9 & Bagian 11).
 * Mengimplementasikan batas rate limit 5 generasi/jam/guru dan pencatatan riwayat job.
 */
export async function triggerMaterialGeneration(
  user: SessionUser,
  materialId: string,
  options?: {
    sourceRevisionId?: string;
    idempotencyKey?: string;
  },
): Promise<{ jobId: string; status: "succeeded" | "failed"; draftRevision: number }> {
  const db = getDb();
  const env = getEnv();

  // 1. Otorisasi guru pemilik materi
  const [mat] = await db
    .select({
      id: materials.id,
      title: materials.title,
      classId: materials.classId,
      createdBy: materials.createdBy,
    })
    .from(materials)
    .where(eq(materials.id, materialId))
    .limit(1);

  if (!mat || mat.createdBy !== user.id) {
    throw Errors.notFound("Materi tidak ditemukan atau Anda bukan pemilik materi ini.");
  }

  // 2. Pembatasan laju (Rate Limiting: 5 request per jam per guru)
  await consumeRateLimit(
    `ai_gen:${user.id}`,
    env.AI_GENERATIONS_PER_HOUR,
    3600,
  );

  // 3. Ambil revisi sumber yang dimaksud atau revisi aktif terbaru
  let sourceRevId = options?.sourceRevisionId;
  if (!sourceRevId) {
    const [rev] = await db
      .select({ id: sourceRevisions.id })
      .from(sourceRevisions)
      .where(eq(sourceRevisions.materialId, materialId))
      .orderBy(desc(sourceRevisions.revisionNumber))
      .limit(1);
    if (!rev) throw Errors.notFound("Revisi sumber belum tersedia.");
    sourceRevId = rev.id;
  }

  // 4. Ambil blok sumber
  const blocks = await db
    .select({
      id: sourceBlocks.id,
      ordinal: sourceBlocks.ordinal,
      text: sourceBlocks.text,
    })
    .from(sourceBlocks)
    .where(eq(sourceBlocks.sourceRevisionId, sourceRevId))
    .orderBy(sourceBlocks.ordinal);

  if (blocks.length === 0) {
    throw Errors.unprocessable("Tidak ada blok teks pada revisi sumber ini.");
  }

  // 5. Catat Job di processing_jobs
  const jobId = randomUUID();
  const idempotencyKey = options?.idempotencyKey || `gen_${jobId}`;
  const now = new Date();

  await db.insert(processingJobs).values({
    id: jobId,
    materialId,
    sourceRevisionId: sourceRevId,
    requestedBy: user.id,
    kind: "adapt",
    status: "running",
    idempotencyKey,
    requestHash: randomUUID(),
    payload: { title: mat.title, blockCount: blocks.length },
    stage: "adapting",
    completedUnits: 0,
    totalUnits: blocks.length,
    attempts: 1,
    createdAt: now,
    updatedAt: now,
  });

  // 6. Jalankan Pipeline Adaptasi (Dual Mode: Live Gemini atau Fixture Terstruktur)
  try {
    const { content, modelId, promptVersion } = await runFullAdaptation(mat.title, blocks);

    // Ambil draf yang ada untuk increment revisi
    const [existingDraft] = await db
      .select({ id: lessonDrafts.id, revision: lessonDrafts.revision })
      .from(lessonDrafts)
      .where(eq(lessonDrafts.materialId, materialId))
      .limit(1);

    const newRevision = (existingDraft?.revision ?? 0) + 1;
    const draftId = existingDraft?.id ?? randomUUID();

    if (existingDraft) {
      await db
        .update(lessonDrafts)
        .set({
          sourceRevisionId: sourceRevId,
          revision: newRevision,
          status: "review",
          content,
          approvals: {}, // Reset persetujuan saat materi digenerate ulang
          modelId,
          promptVersion,
          updatedAt: new Date(),
        })
        .where(eq(lessonDrafts.id, existingDraft.id));
    } else {
      await db.insert(lessonDrafts).values({
        id: draftId,
        materialId,
        sourceRevisionId: sourceRevId,
        revision: 1,
        status: "review",
        content,
        approvals: {},
        modelId,
        promptVersion,
        schemaVersion: "1.0",
        updatedAt: new Date(),
      });
    }

    // Perbarui status job menjadi succeeded
    await db
      .update(processingJobs)
      .set({
        status: "succeeded",
        stage: "complete",
        completedUnits: blocks.length,
        updatedAt: new Date(),
      })
      .where(eq(processingJobs.id, jobId));

    // Audit Event
    await db.insert(auditEvents).values({
      id: randomUUID(),
      actorId: user.id,
      materialId,
      eventType: "material_generated",
      metadata: { jobId, modelId, promptVersion, draftRevision: newRevision },
      createdAt: new Date(),
    });

    return {
      jobId,
      status: "succeeded",
      draftRevision: newRevision,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Generation failed";
    await db
      .update(processingJobs)
      .set({
        status: "failed",
        stage: "error",
        errorCode: errorMessage.substring(0, 100),
        updatedAt: new Date(),
      })
      .where(eq(processingJobs.id, jobId));

    throw Errors.unprocessable(`Proses adaptasi gagal: ${errorMessage}`);
  }
}

/**
 * Mengambil status pekerjaan AI yang sedang atau telah berjalan (PRD Bagian 11).
 */
export async function getProcessingJob(
  user: SessionUser,
  jobId: string,
): Promise<JobStatusDto> {
  const db = getDb();

  const [job] = await db
    .select({
      id: processingJobs.id,
      materialId: processingJobs.materialId,
      requestedBy: processingJobs.requestedBy,
      kind: processingJobs.kind,
      status: processingJobs.status,
      stage: processingJobs.stage,
      completedUnits: processingJobs.completedUnits,
      totalUnits: processingJobs.totalUnits,
      errorCode: processingJobs.errorCode,
      createdAt: processingJobs.createdAt,
      updatedAt: processingJobs.updatedAt,
    })
    .from(processingJobs)
    .where(eq(processingJobs.id, jobId))
    .limit(1);

  if (!job || job.requestedBy !== user.id) {
    throw Errors.notFound("Pekerjaan pemrosesan tidak ditemukan.");
  }

  return {
    id: job.id,
    materialId: job.materialId,
    kind: job.kind,
    status: job.status as JobStatusDto["status"],
    stage: job.stage,
    completedUnits: job.completedUnits,
    totalUnits: job.totalUnits,
    errorCode: job.errorCode,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}
