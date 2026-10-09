import { z } from "zod";

/** Batasan input sumber materi sesuai PRD FR-03 */
export const MIN_TEXT_CHARS = 200;
export const MAX_TEXT_CHARS = 60000;
export const MAX_PDF_PAGES = 30;

export const createMaterialSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Judul materi minimal 3 karakter")
      .max(120, "Judul materi maksimal 120 karakter"),
    subject: z
      .string()
      .trim()
      .min(2, "Mata pelajaran minimal 2 karakter")
      .max(60, "Mata pelajaran maksimal 60 karakter"),
    description: z
      .string()
      .trim()
      .max(500, "Deskripsi materi maksimal 500 karakter")
      .optional()
      .transform((v) => (v ? v : undefined)),
    inputType: z.enum(["pdf", "text"], {
      error: "Pilih metode masukan (PDF atau teks tempel)",
    }),
    text: z.string().optional(),
    consent: z.literal(true, {
      error: "Anda wajib mencentang konfirmasi izin penggunaan sumber materi",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.inputType === "text") {
      const cleanText = data.text?.trim() ?? "";
      if (cleanText.length < MIN_TEXT_CHARS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Teks materi terlalu pendek (saat ini ${cleanText.length} karakter). Minimal ${MIN_TEXT_CHARS} karakter untuk menghasilkan adaptasi baca yang bermakna.`,
          path: ["text"],
        });
      } else if (cleanText.length > MAX_TEXT_CHARS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Teks materi melebihi batas maksimal ${MAX_TEXT_CHARS} karakter (saat ini ${cleanText.length} karakter).`,
          path: ["text"],
        });
      }
    }
  });

export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;

/** Skema respons blok sumber */
export const sourceBlockSchema = z.object({
  id: z.string().uuid(),
  ordinal: z.number().int().nonnegative(),
  pageNumber: z.number().int().positive().nullable(),
  text: z.string().min(1),
});

export type SourceBlockDto = z.infer<typeof sourceBlockSchema>;

/** Skema revisi sumber */
export const sourceRevisionDetailSchema = z.object({
  id: z.string().uuid(),
  materialId: z.string().uuid(),
  revisionNumber: z.number().int().positive(),
  inputType: z.enum(["pdf", "text"]),
  originalFilename: z.string().nullable(),
  pageCount: z.number().int().positive().nullable(),
  extractionStatus: z.enum(["queued", "extracting", "ready", "failed"]),
  confirmedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  blocks: z.array(sourceBlockSchema),
});

export type SourceRevisionDetailDto = z.infer<typeof sourceRevisionDetailSchema>;

/** Skema ringkasan materi untuk daftar kelas */
export const materialSummarySchema = z.object({
  id: z.string().uuid(),
  classId: z.string().uuid(),
  title: z.string(),
  subject: z.string(),
  description: z.string().nullable(),
  isPublished: z.boolean(),
  currentVersionId: z.string().uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  draftId: z.string().uuid().nullable(),
  draftStatus: z.enum(["generating", "review", "ready", "failed"]).nullable(),
  sourceRevisionId: z.string().uuid().nullable(),
  blockCount: z.number().int().nonnegative(),
});

export type MaterialSummaryDto = z.infer<typeof materialSummarySchema>;
