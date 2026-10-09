import { z } from "zod";

/**
 * Kontrak Preferensi Membaca sesuai PRD Bagian 11 & Bagian 13.
 */

export const readingPreferencesSchema = z.object({
  structure: z.enum(["standard", "focus"]).default("standard"),
  easyRead: z.boolean().default(false),
  fontFamily: z.enum(["inter", "system", "atkinson"]).default("inter"),
  fontSize: z
    .number()
    .refine((val) => [18, 20, 22, 24, 28].includes(val), {
      message: "Ukuran huruf harus salah satu dari: 18, 20, 22, 24, 28",
    })
    .default(20),
  lineHeight: z.coerce.number().refine((val) => [1.5, 1.7, 2.0].includes(val), {
    message: "Kerapatan baris harus salah satu dari: 1.5, 1.7, 2.0",
  }).default(1.7),
  letterSpacing: z.coerce.number().refine((val) => [0, 0.02, 0.04].includes(val), {
    message: "Jarak huruf harus salah satu dari: 0, 0.02, 0.04",
  }).default(0),
  lineWidth: z.number().refine((val) => [45, 60, 75].includes(val), {
    message: "Lebar baris harus salah satu dari: 45, 60, 75",
  }).default(60),
  theme: z.enum(["light", "sepia", "high-contrast"]).default("light"),
  motion: z.enum(["system", "off"]).default("system"),
  listenEnabled: z.boolean().default(false),
  speechRate: z.coerce.number().min(0.75).max(1.5).default(1),
  voiceUri: z.string().nullable().optional(),
});

export type ReadingPreferencesDto = z.infer<typeof readingPreferencesSchema>;

export const updateReadingPreferencesSchema = readingPreferencesSchema.partial();
export type UpdateReadingPreferencesInput = z.infer<typeof updateReadingPreferencesSchema>;

/**
 * Kontrak Progres Membaca Siswa
 */

export const readingProgressSchema = z.object({
  lessonVersionId: z.string().uuid("ID versi materi tidak valid"),
  sectionId: z.string().nullable().optional(),
  cardId: z.string().nullable().optional(),
  cardIndex: z.number().int().min(0).optional().default(0),
  scrollFraction: z.coerce.number().min(0).max(1).optional().default(0),
  completedSectionIds: z.array(z.string()).default([]),
  startedAt: z.string().optional(),
  completedAt: z.string().nullable().optional(),
  updatedAt: z.string().optional(),
});

export type ReadingProgressDto = z.infer<typeof readingProgressSchema>;

export const updateReadingProgressSchema = z.object({
  lessonVersionId: z.string().uuid("ID versi materi tidak valid"),
  sectionId: z.string().nullable().optional(),
  cardId: z.string().nullable().optional(),
  cardIndex: z.number().int().min(0).optional(),
  scrollFraction: z.coerce.number().min(0).max(1).optional(),
  completedSectionIds: z.array(z.string()).optional(),
  isCompleted: z.boolean().optional(),
});

export type UpdateReadingProgressInput = z.infer<typeof updateReadingProgressSchema>;
