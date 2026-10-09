import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, isNull, desc } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import {
  classes,
  classMemberships,
  materials,
  sourceRevisions,
  sourceBlocks,
  lessonDrafts,
  auditEvents,
} from "@/server/db/schema";
import { Errors } from "@/server/errors";
import {
  extractPdfSource,
  extractTextSource,
  type ExtractionResult,
} from "@/server/extraction/source-blocks";
import { buildInitialAdaptation } from "@/server/extraction/adaptation-fixture";
import type { SessionUser } from "@/server/auth/session";
import type {
  CreateMaterialInput,
  MaterialSummaryDto,
  SourceRevisionDetailDto,
} from "@/shared/schemas/materials";

/**
 * Membuat materi baru beserta ekstraksi source blocks berurutan dalam satu transaksi atomik.
 * Sesuai PRD FR-03 & J1.
 */
export async function createMaterial(
  user: SessionUser,
  classId: string,
  input: CreateMaterialInput,
  options?: {
    fileBuffer?: Buffer | Uint8Array;
    originalFilename?: string;
  },
): Promise<MaterialSummaryDto> {
  const db = getDb();

  // 1. Verifikasi otorisasi: hanya guru pemilik kelas yang dapat membuat materi
  if (user.role !== "teacher") {
    throw Errors.forbidden("Hanya guru pengajar yang dapat menambahkan materi.");
  }

  const [cls] = await db
    .select({ id: classes.id, teacherId: classes.teacherId })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, user.id)))
    .limit(1);

  if (!cls) {
    throw Errors.notFound("Kelas tidak ditemukan atau Anda bukan pemilik kelas ini.");
  }

  // 2. Ekstraksi teks sumber
  let extraction: ExtractionResult;
  let filename: string | null = null;

  if (input.inputType === "pdf") {
    if (!options?.fileBuffer || options.fileBuffer.length === 0) {
      throw Errors.badRequest("Berkas PDF tidak disertakan atau kosong.");
    }
    extraction = await extractPdfSource(options.fileBuffer);
    filename = options.originalFilename ?? "materi.pdf";
  } else {
    if (!input.text || input.text.trim().length === 0) {
      throw Errors.badRequest("Teks materi wajib diisi.");
    }
    extraction = extractTextSource(input.text);
  }

  if (extraction.blocks.length === 0) {
    throw Errors.unprocessable(
      "Tidak ada blok teks yang dapat diekstraksi dari materi ini. Silakan periksa kembali berkas atau teks Anda.",
    );
  }

  // 3. Transaksi Database: Masukkan material, source_revision, source_blocks, dan inisialisasi draft
  const materialId = randomUUID();
  const sourceRevisionId = randomUUID();
  const draftId = randomUUID();
  const now = new Date();

  const summary = await db.transaction(async (tx) => {
    // 3a. Insert materials
    await tx.insert(materials).values({
      id: materialId,
      classId,
      createdBy: user.id,
      title: input.title,
      subject: input.subject,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    });

    // 3b. Insert source_revisions
    await tx.insert(sourceRevisions).values({
      id: sourceRevisionId,
      materialId,
      revisionNumber: 1,
      inputType: input.inputType,
      originalFilename: filename,
      sha256: extraction.sha256,
      pageCount: extraction.pageCount,
      extractionStatus: "ready",
      confirmedAt: now, // Otomatis terkonfirmasi pada draft awal
      createdAt: now,
    });

    // 3c. Insert source_blocks dalam urutan ordinal
    const blockValues = extraction.blocks.map((b, index) => ({
      id: randomUUID(),
      sourceRevisionId,
      ordinal: index,
      pageNumber: b.pageNumber,
      text: b.text,
    }));

    await tx.insert(sourceBlocks).values(blockValues);

    // 3d. Inisialisasi draft awal multi-modal (status: review)
    const initialDraftContent = buildInitialAdaptation(input.title, blockValues);
    await tx.insert(lessonDrafts).values({
      id: draftId,
      materialId,
      sourceRevisionId,
      revision: 1,
      status: "review",
      content: initialDraftContent,
      approvals: {},
      promptVersion: "1.0",
      schemaVersion: "1.0",
      updatedAt: now,
    });

    // 3e. Audit Event
    await tx.insert(auditEvents).values({
      id: randomUUID(),
      actorId: user.id,
      materialId,
      eventType: "material_created",
      metadata: {
        classId,
        inputType: input.inputType,
        blockCount: blockValues.length,
        pageCount: extraction.pageCount,
      },
      createdAt: now,
    });

    return {
      id: materialId,
      classId,
      title: input.title,
      subject: input.subject,
      description: input.description ?? null,
      isPublished: false,
      currentVersionId: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      draftId,
      draftStatus: "review" as const,
      sourceRevisionId,
      blockCount: blockValues.length,
    };
  });

  return summary;
}

/**
 * Daftar materi untuk suatu kelas.
 * - Guru pemilik: melihat semua materi (draf maupun terbit).
 * - Siswa anggota: HANYA melihat materi yang sudah diterbitkan (`currentVersionId` not null).
 */
export async function listMaterialsForClass(
  userId: string,
  role: "teacher" | "student",
  classId: string,
): Promise<MaterialSummaryDto[]> {
  const db = getDb();

  if (role === "teacher") {
    // Verifikasi kelas milik guru
    const [cls] = await db
      .select({ id: classes.id })
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.teacherId, userId)))
      .limit(1);

    if (!cls) {
      throw Errors.notFound("Kelas tidak ditemukan atau Anda bukan pemilik kelas ini.");
    }

    const rows = await db
      .select({
        id: materials.id,
        classId: materials.classId,
        title: materials.title,
        subject: materials.subject,
        description: materials.description,
        currentVersionId: materials.currentVersionId,
        createdAt: materials.createdAt,
        updatedAt: materials.updatedAt,
        draftId: lessonDrafts.id,
        draftStatus: lessonDrafts.status,
        sourceRevisionId: lessonDrafts.sourceRevisionId,
      })
      .from(materials)
      .leftJoin(lessonDrafts, eq(lessonDrafts.materialId, materials.id))
      .where(and(eq(materials.classId, classId), isNull(materials.archivedAt)))
      .orderBy(desc(materials.createdAt));

    return rows.map((r) => ({
      id: r.id,
      classId: r.classId,
      title: r.title,
      subject: r.subject,
      description: r.description,
      isPublished: r.currentVersionId !== null,
      currentVersionId: r.currentVersionId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      draftId: r.draftId,
      draftStatus: (r.draftStatus as "generating" | "review" | "ready" | "failed") || null,
      sourceRevisionId: r.sourceRevisionId,
      blockCount: 0,
    }));
  }

  // Siswa: verifikasi keanggotaan kelas
  const [membership] = await db
    .select({ classId: classMemberships.classId })
    .from(classMemberships)
    .where(and(eq(classMemberships.classId, classId), eq(classMemberships.studentId, userId)))
    .limit(1);

  if (!membership) {
    throw Errors.notFound("Kelas tidak ditemukan atau Anda belum bergabung dengan kelas ini.");
  }

  // Siswa HANYA membaca materi yang memiliki current_version_id aktif dan tidak diarsip
  const rows = await db
    .select({
      id: materials.id,
      classId: materials.classId,
      title: materials.title,
      subject: materials.subject,
      description: materials.description,
      currentVersionId: materials.currentVersionId,
      createdAt: materials.createdAt,
      updatedAt: materials.updatedAt,
    })
    .from(materials)
    .where(
      and(
        eq(materials.classId, classId),
        isNull(materials.archivedAt),
        // Siswa hanya melihat materi yang sudah diterbitkan
      ),
    )
    .orderBy(desc(materials.createdAt));

  // Filter hanya yang memiliki versi terbit
  return rows
    .filter((r) => r.currentVersionId !== null)
    .map((r) => ({
      id: r.id,
      classId: r.classId,
      title: r.title,
      subject: r.subject,
      description: r.description,
      isPublished: true,
      currentVersionId: r.currentVersionId,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      draftId: null,
      draftStatus: null,
      sourceRevisionId: null,
      blockCount: 0,
    }));
}

/**
 * Mengambil revisi dan blok sumber untuk ditinjau guru.
 */
export async function getMaterialSource(
  user: SessionUser,
  materialId: string,
): Promise<SourceRevisionDetailDto> {
  const db = getDb();

  // 1. Otorisasi guru pemilik materi
  const [m] = await db
    .select({ id: materials.id, createdBy: materials.createdBy })
    .from(materials)
    .where(eq(materials.id, materialId))
    .limit(1);

  if (!m || m.createdBy !== user.id) {
    throw Errors.notFound("Materi tidak ditemukan atau Anda bukan pemilik materi ini.");
  }

  // 2. Ambil revisi sumber terbaru
  const [rev] = await db
    .select()
    .from(sourceRevisions)
    .where(eq(sourceRevisions.materialId, materialId))
    .orderBy(desc(sourceRevisions.revisionNumber))
    .limit(1);

  if (!rev) {
    throw Errors.notFound("Revisi sumber untuk materi ini belum tersedia.");
  }

  // 3. Ambil semua blok sumber berurutan
  const blocks = await db
    .select({
      id: sourceBlocks.id,
      ordinal: sourceBlocks.ordinal,
      pageNumber: sourceBlocks.pageNumber,
      text: sourceBlocks.text,
    })
    .from(sourceBlocks)
    .where(eq(sourceBlocks.sourceRevisionId, rev.id))
    .orderBy(sourceBlocks.ordinal);

  return {
    id: rev.id,
    materialId: rev.materialId,
    revisionNumber: rev.revisionNumber,
    inputType: rev.inputType as "pdf" | "text",
    originalFilename: rev.originalFilename,
    pageCount: rev.pageCount,
    extractionStatus: rev.extractionStatus as "queued" | "extracting" | "ready" | "failed",
    confirmedAt: rev.confirmedAt?.toISOString() ?? null,
    createdAt: rev.createdAt.toISOString(),
    blocks,
  };
}

/**
 * Guru mengonfirmasi kelayakan blok sumber sebelum diproses (PRD Bagian 9 & Bagian 11).
 */
export async function confirmSourceRevision(
  user: SessionUser,
  materialId: string,
  sourceRevisionId?: string,
): Promise<{ confirmedAt: string }> {
  const db = getDb();
  const [mat] = await db
    .select({ id: materials.id, createdBy: materials.createdBy })
    .from(materials)
    .where(eq(materials.id, materialId))
    .limit(1);

  if (!mat || mat.createdBy !== user.id) {
    throw Errors.notFound("Materi tidak ditemukan atau Anda bukan pemilik materi ini.");
  }

  const now = new Date();
  if (sourceRevisionId) {
    await db
      .update(sourceRevisions)
      .set({ confirmedAt: now })
      .where(and(eq(sourceRevisions.id, sourceRevisionId), eq(sourceRevisions.materialId, materialId)));
  } else {
    await db
      .update(sourceRevisions)
      .set({ confirmedAt: now })
      .where(eq(sourceRevisions.materialId, materialId));
  }

  return { confirmedAt: now.toISOString() };
}

