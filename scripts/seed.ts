try {
  process.loadEnvFile(".env");
} catch {
  // .env opsional
}

import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, getPool } from "../src/server/db/client";
import { classMemberships, classes, readingPreferences, users } from "../src/server/db/schema";
import { hashPassword } from "../src/server/auth/password";
import { generateJoinCode, formatJoinCode } from "../src/server/services/classes.service";

/**
 * Seed idempotent (PRD FR-09): Bu Rani, Raka/Sinta/Budi, kelas IPA VIII A.
 * Kredensial dibaca dari environment; tidak ada password di kode.
 * Materi "Sistem Pencernaan" ditambahkan pada Milestone 2.
 */
const seedEnv = z
  .object({
    SEED_TEACHER_EMAIL: z.email(),
    SEED_TEACHER_PASSWORD: z.string().min(12),
    SEED_STUDENT_EMAIL_DOMAIN: z.string().min(3),
    SEED_STUDENT_PASSWORD: z.string().min(12),
  })
  .parse(process.env);

type Seed = {
  email: string;
  displayName: string;
  role: "teacher" | "student";
  password: string;
  prefs?: Partial<typeof readingPreferences.$inferInsert>;
};

const people: Seed[] = [
  {
    email: seedEnv.SEED_TEACHER_EMAIL,
    displayName: "Bu Rani",
    role: "teacher",
    password: seedEnv.SEED_TEACHER_PASSWORD,
  },
  {
    email: `raka@${seedEnv.SEED_STUDENT_EMAIL_DOMAIN}`,
    displayName: "Raka",
    role: "student",
    password: seedEnv.SEED_STUDENT_PASSWORD,
    prefs: { structure: "focus", easyRead: true, fontSize: 24, listenEnabled: true },
  },
  {
    email: `sinta@${seedEnv.SEED_STUDENT_EMAIL_DOMAIN}`,
    displayName: "Sinta",
    role: "student",
    password: seedEnv.SEED_STUDENT_PASSWORD,
    prefs: { structure: "focus", easyRead: false, fontSize: 28 },
  },
  {
    email: `budi@${seedEnv.SEED_STUDENT_EMAIL_DOMAIN}`,
    displayName: "Budi",
    role: "student",
    password: seedEnv.SEED_STUDENT_PASSWORD,
    prefs: { structure: "standard", easyRead: false, fontSize: 20 },
  },
];

async function main() {
  const db = getDb();
  const ids = new Map<string, string>();

  for (const p of people) {
    const email = p.email.toLowerCase();
    const passwordHash = await hashPassword(p.password);
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(sql`lower(${users.email})`, email))
      .limit(1);

    let id = existing?.id;
    if (id) {
      await db
        .update(users)
        .set({ displayName: p.displayName, role: p.role, passwordHash })
        .where(eq(users.id, id));
    } else {
      id = randomUUID();
      await db.insert(users).values({
        id,
        email,
        displayName: p.displayName,
        role: p.role,
        passwordHash,
      });
    }
    ids.set(p.displayName, id);

    await db
      .insert(readingPreferences)
      .values({ userId: id, ...p.prefs })
      .onConflictDoUpdate({
        target: readingPreferences.userId,
        set: { ...p.prefs, updatedAt: new Date() },
      });
  }

  const teacherId = ids.get("Bu Rani")!;
  const [existingClass] = await db
    .select({ id: classes.id, joinCode: classes.joinCode })
    .from(classes)
    .where(and(eq(classes.teacherId, teacherId), eq(classes.name, "IPA VIII A")))
    .limit(1);

  let classId = existingClass?.id;
  let joinCode = existingClass?.joinCode;
  if (!classId) {
    classId = randomUUID();
    joinCode = generateJoinCode();
    await db.insert(classes).values({
      id: classId,
      teacherId,
      name: "IPA VIII A",
      description: "Kelas demo AksesKelas: materi Sistem Pencernaan.",
      joinCode,
    });
  }

  for (const name of ["Raka", "Sinta", "Budi"]) {
    await db
      .insert(classMemberships)
      .values({ classId, studentId: ids.get(name)! })
      .onConflictDoNothing();
  }

  console.log("Seed selesai.");
  console.log(`  Guru   : ${seedEnv.SEED_TEACHER_EMAIL}`);
  console.log(`  Siswa  : raka@, sinta@, budi@${seedEnv.SEED_STUDENT_EMAIL_DOMAIN}`);
  console.log(`  Kelas  : IPA VIII A (kode join ${formatJoinCode(joinCode!)})`);
  console.log("  Password dibaca dari .env (SEED_*_PASSWORD).");
  await getPool().end();
}

main().catch((err) => {
  console.error("Seed gagal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
