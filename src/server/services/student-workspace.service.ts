import "server-only";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { getDb } from "@/server/db/client";
import {
  classes,
  classMemberships,
  materials,
  lessonVersions,
  readingProgress,
  users,
} from "@/server/db/schema";
import type { DraftContentDto, SectionCardDto } from "@/shared/schemas/drafts-reader";

export interface StudentMaterialItem {
  id: string; // material ID
  title: string;
  subject: string;
  description: string | null;
  classId: string;
  className: string;
  teacherName: string;
  currentVersionId: string;
  publishedAt: string;
  totalSections: number;
  totalCards: number;
  status: "belum_dibaca" | "sedang_dibaca" | "selesai";
  progressPositionText: string | null;
  lastAccessedAt: string | null;
}

export interface ContinueReadingItem {
  materialId: string;
  classId: string;
  className: string;
  teacherName: string;
  title: string;
  subject: string;
  structure: "focus" | "standard";
  positionText: string;
  lastAccessedAt: string;
}

export interface StudentWorkspaceData {
  materials: StudentMaterialItem[];
  continueReading: ContinueReadingItem | null;
  totalMaterials: number;
  completedMaterialsCount: number;
  inProgressMaterialsCount: number;
  unreadMaterialsCount: number;
}

export async function getStudentWorkspaceData(
  studentId: string,
  preferredStructure: "focus" | "standard" = "focus",
): Promise<StudentWorkspaceData> {
  const db = getDb();

  // 1. Dapatkan daftar kelas yang diikuti siswa
  const memberships = await db
    .select({ classId: classMemberships.classId })
    .from(classMemberships)
    .where(eq(classMemberships.studentId, studentId));

  if (memberships.length === 0) {
    return {
      materials: [],
      continueReading: null,
      totalMaterials: 0,
      completedMaterialsCount: 0,
      inProgressMaterialsCount: 0,
      unreadMaterialsCount: 0,
    };
  }

  const classIds = memberships.map((m) => m.classId);

  // 2. Query materi yang sudah diterbitkan dari seluruh kelas yang diikuti
  const rows = await db
    .select({
      materialId: materials.id,
      materialTitle: materials.title,
      materialSubject: materials.subject,
      materialDescription: materials.description,
      classId: materials.classId,
      className: classes.name,
      teacherName: users.displayName,
      currentVersionId: materials.currentVersionId,
      publishedAt: lessonVersions.publishedAt,
      content: lessonVersions.content,
      // Field progres membaca
      progressStartedAt: readingProgress.startedAt,
      progressCompletedAt: readingProgress.completedAt,
      progressUpdatedAt: readingProgress.updatedAt,
      progressSectionId: readingProgress.sectionId,
      progressCardId: readingProgress.cardId,
      completedSectionIds: readingProgress.completedSectionIds,
      scrollFraction: readingProgress.scrollFraction,
    })
    .from(materials)
    .innerJoin(classes, eq(classes.id, materials.classId))
    .innerJoin(users, eq(users.id, classes.teacherId))
    .innerJoin(lessonVersions, eq(lessonVersions.id, materials.currentVersionId))
    .leftJoin(
      readingProgress,
      and(
        eq(readingProgress.studentId, studentId),
        eq(readingProgress.lessonVersionId, materials.currentVersionId),
      ),
    )
    .where(
      and(
        inArray(materials.classId, classIds),
        isNull(materials.archivedAt),
      ),
    )
    .orderBy(desc(materials.createdAt));

  const items: StudentMaterialItem[] = [];
  const inProgressList: Array<{
    item: StudentMaterialItem;
    updatedAt: Date;
    positionText: string;
    structure: "focus" | "standard";
  }> = [];

  let completedCount = 0;
  let inProgressCount = 0;
  let unreadCount = 0;

  for (const row of rows) {
    if (!row.currentVersionId) continue;

    const content = (row.content as unknown as DraftContentDto) || { sections: [] };
    const sections = content.sections || [];
    const totalSections = sections.length;

    const allCards: SectionCardDto[] = [];
    sections.forEach((s) => {
      if (s.cards) allCards.push(...s.cards);
    });
    const totalCards = allCards.length;

    let status: "belum_dibaca" | "sedang_dibaca" | "selesai" = "belum_dibaca";
    let positionText: string | null = null;

    if (row.progressCompletedAt) {
      status = "selesai";
      completedCount++;
      positionText = "Selesai dibaca";
    } else if (row.progressStartedAt) {
      status = "sedang_dibaca";
      inProgressCount++;

      // Tentukan posisi bacaan terakhir
      if (row.progressCardId && totalCards > 0) {
        const cardIndex = allCards.findIndex((c) => c.id === row.progressCardId);
        const resolvedCardNum = cardIndex >= 0 ? cardIndex + 1 : 1;
        positionText = `Kartu ${resolvedCardNum} dari ${totalCards}`;
      } else if (totalSections > 0) {
        const compIds = Array.isArray(row.completedSectionIds)
          ? (row.completedSectionIds as string[])
          : [];
        const compCount = compIds.length;
        positionText =
          compCount > 0
            ? `${compCount} dari ${totalSections} Bagian Selesai`
            : `Bagian 1 dari ${totalSections}`;
      }
    } else {
      status = "belum_dibaca";
      unreadCount++;
      positionText = totalCards > 0 ? `${totalCards} Kartu Fokus` : `${totalSections} Bagian`;
    }

    const materialItem: StudentMaterialItem = {
      id: row.materialId,
      title: row.materialTitle,
      subject: row.materialSubject,
      description: row.materialDescription,
      classId: row.classId,
      className: row.className,
      teacherName: row.teacherName,
      currentVersionId: row.currentVersionId,
      publishedAt: row.publishedAt.toISOString(),
      totalSections,
      totalCards,
      status,
      progressPositionText: positionText,
      lastAccessedAt: row.progressUpdatedAt ? row.progressUpdatedAt.toISOString() : null,
    };

    items.push(materialItem);

    if (status === "sedang_dibaca" && row.progressUpdatedAt) {
      inProgressList.push({
        item: materialItem,
        updatedAt: row.progressUpdatedAt,
        positionText: positionText || (totalCards > 0 ? `1 dari ${totalCards} Kartu` : "Materi sedang dibaca"),
        structure: row.progressCardId ? "focus" : preferredStructure,
      });
    }
  }

  // Pilih bacaan yang paling baru diakses dan belum selesai
  inProgressList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const mostRecent = inProgressList[0];

  const continueReading: ContinueReadingItem | null = mostRecent
    ? {
        materialId: mostRecent.item.id,
        classId: mostRecent.item.classId,
        className: mostRecent.item.className,
        teacherName: mostRecent.item.teacherName,
        title: mostRecent.item.title,
        subject: mostRecent.item.subject,
        structure: mostRecent.structure,
        positionText: mostRecent.positionText,
        lastAccessedAt: mostRecent.updatedAt.toISOString(),
      }
    : null;

  return {
    materials: items,
    continueReading,
    totalMaterials: items.length,
    completedMaterialsCount: completedCount,
    inProgressMaterialsCount: inProgressCount,
    unreadMaterialsCount: unreadCount,
  };
}
