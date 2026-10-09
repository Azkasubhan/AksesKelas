import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, desc } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import {
  classes,
  classMemberships,
  materials,
  lessonDrafts,
  lessonVersions,
  sourceBlocks,
  users,
  auditEvents,
} from "@/server/db/schema";
import { Errors } from "@/server/errors";
import { buildInitialAdaptation } from "@/server/extraction/adaptation-fixture";
import type { SessionUser } from "@/server/auth/session";
import type {
  LessonDraftDto,
  LessonSnapshotDto,
  DraftContentDto,
  SectionDto,
  UpdateDraftSectionInput,
  ApproveDraftSectionInput,
  PublishDraftInput,
} from "@/shared/schemas/drafts-reader";

/**
 * Mengambil draf materi untuk ditinjau oleh guru pemilik (PRD Bagian 11).
 */
export async function getMaterialDraft(
  user: SessionUser,
  materialId: string,
): Promise<LessonDraftDto> {
  const db = getDb();

  // 1. Verifikasi materi & kelas milik guru
  const [mat] = await db
    .select({
      id: materials.id,
      title: materials.title,
      subject: materials.subject,
      description: materials.description,
      classId: materials.classId,
      createdBy: materials.createdBy,
      currentVersionId: materials.currentVersionId,
      className: classes.name,
      teacherId: classes.teacherId,
    })
    .from(materials)
    .innerJoin(classes, eq(classes.id, materials.classId))
    .where(eq(materials.id, materialId))
    .limit(1);

  if (!mat || mat.createdBy !== user.id) {
    throw Errors.notFound("Materi tidak ditemukan atau Anda bukan pemilik materi ini.");
  }

  // 2. Ambil draf terbaru
  const [draft] = await db
    .select()
    .from(lessonDrafts)
    .where(eq(lessonDrafts.materialId, materialId))
    .orderBy(desc(lessonDrafts.updatedAt))
    .limit(1);

  if (!draft) {
    throw Errors.notFound("Draf adaptasi materi belum tersedia.");
  }

  let content = draft.content as unknown as DraftContentDto;
  if (!content.sections || content.sections.length === 0 || !content.sections[0].cards || content.sections[0].cards.length === 0) {
    const blocks = await db
      .select({
        id: sourceBlocks.id,
        ordinal: sourceBlocks.ordinal,
        text: sourceBlocks.text,
      })
      .from(sourceBlocks)
      .where(eq(sourceBlocks.sourceRevisionId, draft.sourceRevisionId))
      .orderBy(sourceBlocks.ordinal);

    if (blocks.length > 0) {
      content = buildInitialAdaptation(mat.title, blocks);
      await db
        .update(lessonDrafts)
        .set({ content, updatedAt: new Date() })
        .where(eq(lessonDrafts.id, draft.id));
    }
  }

  const approvals = (draft.approvals ?? {}) as unknown as LessonDraftDto["approvals"];

  return {
    id: draft.id,
    materialId: mat.id,
    materialTitle: mat.title,
    materialSubject: mat.subject,
    materialDescription: mat.description,
    classId: mat.classId,
    className: mat.className,
    sourceRevisionId: draft.sourceRevisionId,
    revision: draft.revision,
    status: draft.status as "generating" | "review" | "ready" | "failed",
    content,
    approvals,
    promptVersion: draft.promptVersion,
    schemaVersion: draft.schemaVersion,
    updatedAt: draft.updatedAt.toISOString(),
    isPublished: mat.currentVersionId !== null,
    currentVersionId: mat.currentVersionId,
  };
}

/**
 * Memperbarui bagian tertentu pada draf materi (PRD Bagian 11).
 * Menggunakan revisi atomik; edit bagian secara otomatis mereset status persetujuan bagian tersebut.
 */
export async function updateDraftSection(
  user: SessionUser,
  materialId: string,
  sectionId: string,
  input: UpdateDraftSectionInput,
): Promise<{ draftRevision: number; sectionRevision: number }> {
  const db = getDb();

  return await db.transaction(async (tx) => {
    // 1. Verifikasi kepemilikan dan draf aktif
    const [mat] = await tx
      .select({ id: materials.id, createdBy: materials.createdBy })
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (!mat || mat.createdBy !== user.id) {
      throw Errors.notFound("Materi tidak ditemukan atau Anda bukan pemilik materi ini.");
    }

    const [draft] = await tx
      .select()
      .from(lessonDrafts)
      .where(eq(lessonDrafts.materialId, materialId))
      .limit(1);

    if (!draft) throw Errors.notFound("Draf tidak ditemukan.");

    // Guard optimistic locking
    if (draft.revision !== input.expectedRevision) {
      throw Errors.badRequest(
        "Draf telah diperbarui di sesi lain. Muat ulang halaman untuk melihat versi terbaru.",
      );
    }

    const content = draft.content as unknown as DraftContentDto;
    const sectionIndex = content.sections.findIndex((s) => s.id === sectionId);
    if (sectionIndex === -1) {
      throw Errors.notFound("Bagian materi yang dimaksud tidak ditemukan.");
    }

    const targetSection = content.sections[sectionIndex];
    const newSectionRevision = (targetSection.revision ?? 1) + 1;

    // Perbarui isi bagian
    const updatedSection: SectionDto = {
      ...targetSection,
      revision: newSectionRevision,
      title: input.title ?? targetSection.title,
      easyRead: input.easyRead ?? targetSection.easyRead,
      cards: input.cards ?? targetSection.cards,
      glossary: input.glossary ?? targetSection.glossary,
    };

    content.sections[sectionIndex] = updatedSection;

    // PRD Guard: Reset persetujuan untuk bagian yang diedit
    const approvals = { ...(draft.approvals as Record<string, unknown>) };
    delete approvals[sectionId];

    const newDraftRevision = draft.revision + 1;
    const now = new Date();

    await tx
      .update(lessonDrafts)
      .set({
        revision: newDraftRevision,
        content,
        approvals,
        updatedAt: now,
      })
      .where(eq(lessonDrafts.id, draft.id));

    // Audit log
    await tx.insert(auditEvents).values({
      id: randomUUID(),
      actorId: user.id,
      materialId,
      eventType: "draft_section_updated",
      metadata: {
        sectionId,
        newDraftRevision,
        newSectionRevision,
      },
      createdAt: now,
    });

    return {
      draftRevision: newDraftRevision,
      sectionRevision: newSectionRevision,
    };
  });
}

/**
 * Menyetujui satu bagian dari draf (PRD Bagian 11 & J2).
 */
export async function approveDraftSection(
  user: SessionUser,
  materialId: string,
  sectionId: string,
  input: ApproveDraftSectionInput,
): Promise<{ draftRevision: number; sectionId: string; approvedAt: string }> {
  const db = getDb();

  return await db.transaction(async (tx) => {
    const [mat] = await tx
      .select({ id: materials.id, createdBy: materials.createdBy })
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (!mat || mat.createdBy !== user.id) {
      throw Errors.notFound("Materi tidak ditemukan atau Anda bukan pemilik materi ini.");
    }

    const [draft] = await tx
      .select()
      .from(lessonDrafts)
      .where(eq(lessonDrafts.materialId, materialId))
      .limit(1);

    if (!draft) throw Errors.notFound("Draf tidak ditemukan.");

    if (draft.revision !== input.expectedRevision) {
      throw Errors.badRequest(
        "Revisi draf telah berubah. Muat ulang halaman lalu coba lagi.",
      );
    }

    const content = draft.content as unknown as DraftContentDto;
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) {
      throw Errors.notFound("Bagian materi tidak ditemukan.");
    }

    if (section.revision !== input.expectedSectionRevision) {
      throw Errors.badRequest(
        "Revisi bagian materi tidak cocok dengan yang Anda setujui. Muat ulang untuk melihat perubahan terbaru.",
      );
    }

    const now = new Date();
    const approvedAtIso = now.toISOString();

    const approvals = {
      ...(draft.approvals as Record<string, unknown>),
      [sectionId]: {
        sectionRevision: section.revision,
        reviewedBy: user.id,
        reviewedAt: approvedAtIso,
      },
    };

    // Bila seluruh bagian sudah disetujui, tandai draf berstatus 'ready'
    const allApproved = content.sections.every((s) => {
      const app = approvals[s.id] as { sectionRevision: number } | undefined;
      return app && app.sectionRevision === s.revision;
    });

    const newStatus = allApproved ? "ready" : "review";

    await tx
      .update(lessonDrafts)
      .set({
        approvals,
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(lessonDrafts.id, draft.id));

    // Audit log
    await tx.insert(auditEvents).values({
      id: randomUUID(),
      actorId: user.id,
      materialId,
      eventType: "draft_section_approved",
      metadata: {
        sectionId,
        sectionRevision: section.revision,
        allApproved,
      },
      createdAt: now,
    });

    return {
      draftRevision: draft.revision,
      sectionId,
      approvedAt: approvedAtIso,
    };
  });
}

/**
 * Menerbitkan materi ke snapshot permanen lesson_versions (PRD Bagian 11 & J2).
 * Syarat mutlak: Seluruh bagian wajib disetujui guru (human-in-the-loop).
 */
export async function publishMaterial(
  user: SessionUser,
  materialId: string,
  input: PublishDraftInput,
): Promise<{ versionId: string; versionNumber: number; publishedAt: string }> {
  const db = getDb();

  return await db.transaction(async (tx) => {
    // 1. Verifikasi materi & pemilik
    const [mat] = await tx
      .select({
        id: materials.id,
        title: materials.title,
        createdBy: materials.createdBy,
        currentVersionId: materials.currentVersionId,
      })
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (!mat || mat.createdBy !== user.id) {
      throw Errors.notFound("Materi tidak ditemukan atau Anda bukan pemilik materi ini.");
    }

    // 2. Ambil draf
    const [draft] = await tx
      .select()
      .from(lessonDrafts)
      .where(and(eq(lessonDrafts.id, input.draftId), eq(lessonDrafts.materialId, materialId)))
      .limit(1);

    if (!draft) {
      throw Errors.notFound("Draf tidak ditemukan.");
    }

    if (draft.revision !== input.expectedRevision) {
      throw Errors.badRequest(
        "Revisi draf telah berubah. Silakan tinjau kembali sebelum menerbitkan.",
      );
    }

    const content = draft.content as unknown as DraftContentDto;
    const approvals = (draft.approvals ?? {}) as Record<
      string,
      { sectionRevision: number } | undefined
    >;

    // 3. Verifikasi Human-in-the-Loop: SEMUA bagian harus disetujui pada revisi yang sama
    const unapprovedSections = content.sections.filter((s) => {
      const app = approvals[s.id];
      return !app || app.sectionRevision !== s.revision;
    });

    if (unapprovedSections.length > 0) {
      throw Errors.unprocessable(
        `Materi belum dapat diterbitkan. Terdapat ${unapprovedSections.length} bagian yang belum Anda setujui.`,
      );
    }

    // 4. Cari nomor versi publikasi berikutnya
    const [latestVersion] = await tx
      .select({ versionNumber: lessonVersions.versionNumber })
      .from(lessonVersions)
      .where(eq(lessonVersions.materialId, materialId))
      .orderBy(desc(lessonVersions.versionNumber))
      .limit(1);

    const nextVersionNumber = (latestVersion?.versionNumber ?? 0) + 1;
    const versionId = randomUUID();
    const now = new Date();

    // 5. Buat snapshot tidak dapat diubah (immutable snapshot)
    await tx.insert(lessonVersions).values({
      id: versionId,
      materialId,
      sourceRevisionId: draft.sourceRevisionId,
      draftId: draft.id,
      draftRevision: draft.revision,
      versionNumber: nextVersionNumber,
      content: draft.content,
      schemaVersion: "1.0",
      approvedBy: user.id,
      publishedAt: now,
    });

    // 6. Tautkan versi aktif ke materials
    await tx
      .update(materials)
      .set({
        currentVersionId: versionId,
        updatedAt: now,
      })
      .where(eq(materials.id, materialId));

    // 7. Audit log penerbitan
    await tx.insert(auditEvents).values({
      id: randomUUID(),
      actorId: user.id,
      materialId,
      eventType: "material_published",
      metadata: {
        versionId,
        versionNumber: nextVersionNumber,
        draftRevision: draft.revision,
      },
      createdAt: now,
    });

    return {
      versionId,
      versionNumber: nextVersionNumber,
      publishedAt: now.toISOString(),
    };
  });
}

/**
 * Membatalkan penerbitan materi (unpublish) agar ditarik dari tampilan siswa (PRD Bagian 11).
 */
export async function unpublishMaterial(
  user: SessionUser,
  materialId: string,
): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    const [mat] = await tx
      .select({ id: materials.id, createdBy: materials.createdBy })
      .from(materials)
      .where(eq(materials.id, materialId))
      .limit(1);

    if (!mat || mat.createdBy !== user.id) {
      throw Errors.notFound("Materi tidak ditemukan atau Anda bukan pemilik materi ini.");
    }

    const now = new Date();
    await tx
      .update(materials)
      .set({
        currentVersionId: null,
        updatedAt: now,
      })
      .where(eq(materials.id, materialId));

    await tx.insert(auditEvents).values({
      id: randomUUID(),
      actorId: user.id,
      materialId,
      eventType: "material_unpublished",
      metadata: {},
      createdAt: now,
    });
  });
}

/**
 * Mengambil snapshot materi yang terbit untuk ditampilkan di Reader Siswa (PRD Bagian 11 & J3).
 * Siswa hanya dapat membaca jika terdaftar sebagai anggota kelas.
 */
export async function getPublishedLesson(
  user: SessionUser,
  materialId: string,
): Promise<LessonSnapshotDto> {
  const db = getDb();

  // 1. Ambil data materi dan kelas
  const [mat] = await db
    .select({
      id: materials.id,
      title: materials.title,
      subject: materials.subject,
      description: materials.description,
      classId: materials.classId,
      currentVersionId: materials.currentVersionId,
      className: classes.name,
      teacherId: classes.teacherId,
      teacherName: users.displayName,
    })
    .from(materials)
    .innerJoin(classes, eq(classes.id, materials.classId))
    .innerJoin(users, eq(users.id, classes.teacherId))
    .where(eq(materials.id, materialId))
    .limit(1);

  if (!mat) {
    throw Errors.notFound("Materi tidak ditemukan.");
  }

  // 2. Otorisasi: Guru pemilik ATAU Siswa anggota kelas
  if (user.role === "teacher") {
    if (mat.teacherId !== user.id) {
      throw Errors.notFound("Materi tidak ditemukan atau bukan milik Anda.");
    }
  } else {
    const [membership] = await db
      .select({ classId: classMemberships.classId })
      .from(classMemberships)
      .where(
        and(
          eq(classMemberships.classId, mat.classId),
          eq(classMemberships.studentId, user.id),
        ),
      )
      .limit(1);

    if (!membership) {
      throw Errors.notFound("Anda belum terdaftar sebagai anggota kelas ini.");
    }
  }

  // 3. Pastikan materi sudah diterbitkan
  if (!mat.currentVersionId) {
    throw Errors.notFound("Materi ini belum diterbitkan oleh guru.");
  }

  // 4. Ambil snapshot versi terbit
  const [version] = await db
    .select()
    .from(lessonVersions)
    .where(eq(lessonVersions.id, mat.currentVersionId))
    .limit(1);

  if (!version) {
    throw Errors.notFound("Versi materi terbit tidak ditemukan.");
  }

  return {
    id: version.id,
    materialId: mat.id,
    versionNumber: version.versionNumber,
    title: mat.title,
    subject: mat.subject,
    description: mat.description,
    classId: mat.classId,
    className: mat.className,
    teacherName: mat.teacherName,
    content: version.content as unknown as DraftContentDto,
    publishedAt: version.publishedAt.toISOString(),
  };
}
