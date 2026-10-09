import { z } from "zod";

/**
 * Kontrak Adaptasi Draf dan Lesson Snapshot sesuai PRD Bagian 9.3 dan Bagian 11.
 */

export const sectionItemSchema = z.object({
  text: z.string().min(1, "Teks tidak boleh kosong"),
  sourceRefs: z.array(z.string()).default([]),
});
export type SectionItemDto = z.infer<typeof sectionItemSchema>;

export const sectionCardSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  kind: z.enum(["concept", "recap"]),
  title: z.string().max(120, "Judul kartu maksimal 120 karakter"),
  originalText: z.string().min(1, "Teks original kartu tidak boleh kosong"),
  easyText: z.string().min(1, "Teks Easy Read kartu tidak boleh kosong"),
  sourceRefs: z.array(z.string()).default([]),
});
export type SectionCardDto = z.infer<typeof sectionCardSchema>;

export const sectionGlossarySchema = z.object({
  term: z.string().min(1, "Istilah tidak boleh kosong"),
  definition: z.string().min(1, "Definisi tidak boleh kosong"),
  sourceRefs: z.array(z.string()).default([]),
});
export type SectionGlossaryDto = z.infer<typeof sectionGlossarySchema>;

export const sectionWarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  sourceRefs: z.array(z.string()).default([]),
});
export type SectionWarningDto = z.infer<typeof sectionWarningSchema>;

export const sectionSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  revision: z.number().int().positive().default(1),
  title: z.string().min(1).max(120, "Judul bagian maksimal 120 karakter"),
  sourceRefs: z.array(z.string()).min(1, "Bagian wajib memiliki rujukan blok sumber"),
  standard: z.array(sectionItemSchema),
  easyRead: z.array(sectionItemSchema).default([]),
  cards: z.array(sectionCardSchema).default([]),
  glossary: z.array(sectionGlossarySchema).default([]),
  warnings: z.array(sectionWarningSchema).default([]),
});
export type SectionDto = z.infer<typeof sectionSchema>;

export const approvalEntrySchema = z.object({
  sectionRevision: z.number().int().positive(),
  reviewedBy: z.string().min(1),
  reviewedAt: z.string().datetime(),
});
export type ApprovalEntryDto = z.infer<typeof approvalEntrySchema>;

export const draftContentSchema = z.object({
  schemaVersion: z.string().default("1.0"),
  sections: z.array(sectionSchema).min(1, "Draf materi minimal memiliki 1 bagian"),
});
export type DraftContentDto = z.infer<typeof draftContentSchema>;

export const lessonDraftDtoSchema = z.object({
  id: z.string(),
  materialId: z.string(),
  materialTitle: z.string(),
  materialSubject: z.string(),
  materialDescription: z.string().nullable(),
  classId: z.string(),
  className: z.string(),
  sourceRevisionId: z.string(),
  revision: z.number(),
  status: z.enum(["generating", "review", "ready", "failed"]),
  content: draftContentSchema,
  approvals: z.record(z.string(), approvalEntrySchema),
  promptVersion: z.string(),
  schemaVersion: z.string(),
  updatedAt: z.string(),
  isPublished: z.boolean(),
  currentVersionId: z.string().nullable(),
});
export type LessonDraftDto = z.infer<typeof lessonDraftDtoSchema>;

export const lessonSnapshotDtoSchema = z.object({
  id: z.string(),
  materialId: z.string(),
  versionNumber: z.number(),
  title: z.string(),
  subject: z.string(),
  description: z.string().nullable(),
  classId: z.string(),
  className: z.string(),
  teacherName: z.string(),
  content: draftContentSchema,
  publishedAt: z.string(),
});
export type LessonSnapshotDto = z.infer<typeof lessonSnapshotDtoSchema>;

// Input schemas for mutations
export const updateDraftSectionSchema = z.object({
  expectedRevision: z.number().int().positive("Revisi draf tidak valid"),
  title: z.string().min(1).max(120).optional(),
  easyRead: z.array(sectionItemSchema).optional(),
  cards: z.array(sectionCardSchema).optional(),
  glossary: z.array(sectionGlossarySchema).optional(),
});
export type UpdateDraftSectionInput = z.infer<typeof updateDraftSectionSchema>;

export const approveDraftSectionSchema = z.object({
  expectedRevision: z.number().int().positive("Revisi draf tidak valid"),
  expectedSectionRevision: z.number().int().positive("Revisi bagian tidak valid"),
});
export type ApproveDraftSectionInput = z.infer<typeof approveDraftSectionSchema>;

export const publishDraftSchema = z.object({
  draftId: z.string().uuid("ID draf tidak valid"),
  expectedRevision: z.number().int().positive("Revisi draf tidak valid"),
});
export type PublishDraftInput = z.infer<typeof publishDraftSchema>;
