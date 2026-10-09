import { eq, and } from "drizzle-orm";
import { getDb } from "../db/client";
import { readingPreferences, readingProgress } from "../db/schema";
import type {
  ReadingPreferencesDto,
  UpdateReadingPreferencesInput,
  ReadingProgressDto,
  UpdateReadingProgressInput,
} from "@/shared/schemas/preferences";
import {
  readingPreferencesSchema,
  updateReadingPreferencesSchema,
  updateReadingProgressSchema,
} from "@/shared/schemas/preferences";

function formatPreferencesRow(row: typeof readingPreferences.$inferSelect): ReadingPreferencesDto {
  return {
    structure: row.structure as "standard" | "focus",
    easyRead: row.easyRead,
    fontFamily: row.fontFamily as "inter" | "system" | "atkinson",
    fontSize: row.fontSize,
    lineHeight: Number(row.lineHeight),
    letterSpacing: Number(row.letterSpacing),
    lineWidth: row.lineWidth,
    theme: row.theme as "light" | "sepia" | "high-contrast",
    motion: row.motion as "system" | "off",
    listenEnabled: row.listenEnabled,
    speechRate: Number(row.speechRate),
    voiceUri: row.voiceUri,
  };
}

export async function getUserPreferences(userId: string): Promise<ReadingPreferencesDto> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(readingPreferences)
    .where(eq(readingPreferences.userId, userId))
    .limit(1);

  if (existing) {
    return formatPreferencesRow(existing);
  }

  // Insert default row jika belum ada
  const defaultValues = {
    userId,
    structure: "standard",
    easyRead: false,
    fontFamily: "inter",
    fontSize: 20,
    lineHeight: "1.7",
    letterSpacing: "0",
    lineWidth: 60,
    theme: "light",
    motion: "system",
    listenEnabled: false,
    speechRate: "1",
    voiceUri: null,
  };

  await db
    .insert(readingPreferences)
    .values(defaultValues)
    .onConflictDoNothing();

  const [inserted] = await db
    .select()
    .from(readingPreferences)
    .where(eq(readingPreferences.userId, userId))
    .limit(1);

  if (inserted) {
    return formatPreferencesRow(inserted);
  }

  return readingPreferencesSchema.parse({});
}

export async function updateUserPreferences(
  userId: string,
  input: UpdateReadingPreferencesInput,
): Promise<ReadingPreferencesDto> {
  const data = updateReadingPreferencesSchema.parse(input);
  const db = getDb();

  const updateValues: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.structure !== undefined) updateValues.structure = data.structure;
  if (data.easyRead !== undefined) updateValues.easyRead = data.easyRead;
  if (data.fontFamily !== undefined) updateValues.fontFamily = data.fontFamily;
  if (data.fontSize !== undefined) updateValues.fontSize = data.fontSize;
  if (data.lineHeight !== undefined) updateValues.lineHeight = String(data.lineHeight);
  if (data.letterSpacing !== undefined) updateValues.letterSpacing = String(data.letterSpacing);
  if (data.lineWidth !== undefined) updateValues.lineWidth = data.lineWidth;
  if (data.theme !== undefined) updateValues.theme = data.theme;
  if (data.motion !== undefined) updateValues.motion = data.motion;
  if (data.listenEnabled !== undefined) updateValues.listenEnabled = data.listenEnabled;
  if (data.speechRate !== undefined) updateValues.speechRate = String(data.speechRate);
  if (data.voiceUri !== undefined) updateValues.voiceUri = data.voiceUri;

  await db
    .insert(readingPreferences)
    .values({
      userId,
      structure: data.structure ?? "focus",
      easyRead: data.easyRead ?? false,
      fontFamily: data.fontFamily ?? "inter",
      fontSize: data.fontSize ?? 20,
      lineHeight: String(data.lineHeight ?? 1.7),
      letterSpacing: String(data.letterSpacing ?? 0),
      lineWidth: data.lineWidth ?? 60,
      theme: data.theme ?? "light",
      motion: data.motion ?? "system",
      listenEnabled: data.listenEnabled ?? false,
      speechRate: String(data.speechRate ?? 1),
      voiceUri: data.voiceUri ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: readingPreferences.userId,
      set: updateValues,
    });

  return getUserPreferences(userId);
}

export async function getReadingProgress(
  studentId: string,
  lessonVersionId: string,
): Promise<ReadingProgressDto | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(readingProgress)
    .where(
      and(
        eq(readingProgress.studentId, studentId),
        eq(readingProgress.lessonVersionId, lessonVersionId),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    lessonVersionId: row.lessonVersionId,
    sectionId: row.sectionId,
    cardId: row.cardId,
    cardIndex: 0,
    scrollFraction: row.scrollFraction ? Number(row.scrollFraction) : 0,
    completedSectionIds: (row.completedSectionIds as string[]) || [],
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveReadingProgress(
  studentId: string,
  lessonVersionId: string,
  input: UpdateReadingProgressInput,
): Promise<ReadingProgressDto> {
  const data = updateReadingProgressSchema.parse(input);
  const db = getDb();

  const now = new Date();
  const scroll = data.scrollFraction !== undefined ? String(Math.max(0, Math.min(1, data.scrollFraction))) : null;

  const updateSet: Record<string, unknown> = {
    updatedAt: now,
  };
  if (data.sectionId !== undefined) updateSet.sectionId = data.sectionId;
  if (data.cardId !== undefined) updateSet.cardId = data.cardId;
  if (scroll !== null) updateSet.scrollFraction = scroll;
  if (data.completedSectionIds !== undefined) updateSet.completedSectionIds = data.completedSectionIds;
  if (data.isCompleted) updateSet.completedAt = now;

  await db
    .insert(readingProgress)
    .values({
      studentId,
      lessonVersionId,
      sectionId: data.sectionId ?? null,
      cardId: data.cardId ?? null,
      scrollFraction: scroll,
      completedSectionIds: data.completedSectionIds ?? [],
      startedAt: now,
      completedAt: data.isCompleted ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [readingProgress.studentId, readingProgress.lessonVersionId],
      set: updateSet,
    });

  const saved = await getReadingProgress(studentId, lessonVersionId);
  return saved!;
}
