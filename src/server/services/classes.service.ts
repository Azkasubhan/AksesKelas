import "server-only";
import { randomInt, randomUUID } from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db/client";
import { classMemberships, classes, users } from "../db/schema";
import { AppError, Errors } from "../errors";
import { consumeRateLimit, LIMITS } from "../auth/rate-limit";
import type { SessionUser } from "../auth/session";
import { isUniqueViolation } from "./auth.service";
import {
  createClassSchema,
  joinClassSchema,
  updateClassSchema,
  formatJoinCode,
  type CreateClassInput,
  type JoinClassInput,
} from "@/shared/schemas/auth-classes";

export { formatJoinCode };

/** Alfabet base32 Crockford (tanpa I, L, O, U) agar kode mudah dibaca. */
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 12; // 60 bit entropi; PRD mensyaratkan minimal 10 karakter.

export function generateJoinCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

const uuidSchema = z.uuid();
function assertUuid(id: string) {
  if (!uuidSchema.safeParse(id).success) throw Errors.notFound();
}

const publishedCountSql = sql<number>`(
  select count(*)::int from materials mt
  where mt.class_id = ${classes.id}
    and mt.current_version_id is not null
    and mt.archived_at is null
)`;
const studentCountSql = sql<number>`(
  select count(*)::int from class_memberships m where m.class_id = ${classes.id}
)`;

export async function createClass(teacher: SessionUser, input: CreateClassInput) {
  if (teacher.role !== "teacher") throw Errors.forbidden();
  const data = createClassSchema.parse(input);
  const db = getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = randomUUID();
    try {
      await db.insert(classes).values({
        id,
        teacherId: teacher.id,
        name: data.name,
        description: data.description ?? null,
        joinCode: generateJoinCode(),
      });
      return { id };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  throw new AppError("INTERNAL_ERROR", 500, "Kelas belum berhasil dibuat. Coba lagi.");
}

export async function listClassesForTeacher(teacherId: string) {
  return getDb()
    .select({
      id: classes.id,
      name: classes.name,
      description: classes.description,
      joinCode: classes.joinCode,
      createdAt: classes.createdAt,
      studentCount: studentCountSql,
      publishedCount: publishedCountSql,
    })
    .from(classes)
    .where(eq(classes.teacherId, teacherId))
    .orderBy(desc(classes.createdAt));
}

export async function listClassesForStudent(studentId: string) {
  return getDb()
    .select({
      id: classes.id,
      name: classes.name,
      description: classes.description,
      teacherName: users.displayName,
      joinedAt: classMemberships.joinedAt,
      publishedCount: publishedCountSql,
    })
    .from(classMemberships)
    .innerJoin(classes, eq(classes.id, classMemberships.classId))
    .innerJoin(users, eq(users.id, classes.teacherId))
    .where(eq(classMemberships.studentId, studentId))
    .orderBy(desc(classMemberships.joinedAt));
}

/** Detail kelas: pemilik mendapat kode join; anggota siswa tidak. Selain itu 404. */
export async function getClassForUser(user: SessionUser, classId: string) {
  assertUuid(classId);
  const db = getDb();
  if (user.role === "teacher") {
    const [row] = await db
      .select({
        id: classes.id,
        name: classes.name,
        description: classes.description,
        joinCode: classes.joinCode,
        createdAt: classes.createdAt,
        studentCount: studentCountSql,
        publishedCount: publishedCountSql,
      })
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.teacherId, user.id)))
      .limit(1);
    if (!row) throw Errors.notFound();
    return { ...row, isOwner: true as const };
  }
  const [row] = await db
    .select({
      id: classes.id,
      name: classes.name,
      description: classes.description,
      teacherName: users.displayName,
      createdAt: classes.createdAt,
      publishedCount: publishedCountSql,
    })
    .from(classMemberships)
    .innerJoin(classes, eq(classes.id, classMemberships.classId))
    .innerJoin(users, eq(users.id, classes.teacherId))
    .where(and(eq(classMemberships.classId, classId), eq(classMemberships.studentId, user.id)))
    .limit(1);
  if (!row) throw Errors.notFound();
  return { ...row, isOwner: false as const };
}

async function assertOwner(teacher: SessionUser, classId: string) {
  if (teacher.role !== "teacher") throw Errors.forbidden();
  assertUuid(classId);
  const [row] = await getDb()
    .select({ id: classes.id })
    .from(classes)
    .where(and(eq(classes.id, classId), eq(classes.teacherId, teacher.id)))
    .limit(1);
  if (!row) throw Errors.notFound();
}

export async function updateClass(teacher: SessionUser, classId: string, input: unknown) {
  await assertOwner(teacher, classId);
  const data = updateClassSchema.parse(input);
  const patch: Partial<typeof classes.$inferInsert> = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.description !== undefined) patch.description = data.description;
  if (Object.keys(patch).length === 0) return;
  await getDb().update(classes).set(patch).where(eq(classes.id, classId));
}

export async function rotateJoinCode(teacher: SessionUser, classId: string) {
  await assertOwner(teacher, classId);
  const db = getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateJoinCode();
    try {
      await db.update(classes).set({ joinCode: code }).where(eq(classes.id, classId));
      return { joinCode: code };
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
    }
  }
  throw new AppError("INTERNAL_ERROR", 500, "Kode belum berhasil diganti. Coba lagi.");
}

/**
 * Siswa bergabung via kode. Idempotent (ON CONFLICT DO NOTHING). Kode yang tidak
 * dikenal tidak membocorkan data kelas apa pun; percobaan dibatasi per akun.
 */
export async function joinClass(student: SessionUser, input: JoinClassInput) {
  if (student.role !== "student") throw Errors.forbidden();
  const { code } = joinClassSchema.parse(input);
  await consumeRateLimit(`join:${student.id}`, LIMITS.join.limit, LIMITS.join.windowSeconds);

  const db = getDb();
  const [cls] = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.joinCode, code))
    .limit(1);
  if (!cls) {
    throw new AppError(
      "INVALID_JOIN_CODE",
      404,
      "Kode kelas tidak ditemukan. Periksa lagi atau minta kode terbaru dari gurumu.",
      { code: "Kode kelas tidak ditemukan" },
    );
  }
  await db
    .insert(classMemberships)
    .values({ classId: cls.id, studentId: student.id })
    .onConflictDoNothing();
  return { id: cls.id, name: cls.name };
}

export async function listMembers(teacher: SessionUser, classId: string) {
  await assertOwner(teacher, classId);
  return getDb()
    .select({
      id: users.id,
      displayName: users.displayName,
      joinedAt: classMemberships.joinedAt,
    })
    .from(classMemberships)
    .innerJoin(users, eq(users.id, classMemberships.studentId))
    .where(eq(classMemberships.classId, classId))
    .orderBy(asc(users.displayName));
}
