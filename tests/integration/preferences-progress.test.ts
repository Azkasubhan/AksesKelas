import { describe, it, expect } from "vitest";
import { signupUser } from "@/server/services/auth.service";
import {
  getUserPreferences,
  updateUserPreferences,
  getReadingProgress,
  saveReadingProgress,
} from "@/server/services/preferences.service";
import { updateReadingPreferencesSchema } from "@/shared/schemas/preferences";
import { createClass, getClassForUser, joinClass } from "@/server/services/classes.service";
import { createMaterial } from "@/server/services/materials.service";
import {
  getMaterialDraft,
  approveDraftSection,
  publishMaterial,
} from "@/server/services/drafts.service";

describe("Milestone 5 Integration: Student Preferences & Reading Progress Flow", () => {
  const ts = Date.now();
  const studentEmail = `student_${ts}@sekolah.id`;
  const teacherEmail = `teacher_${ts}@sekolah.id`;
  const password = "PasswordKuatSangatPanjang123";

  let studentId: string;
  let teacherId: string;
  let lessonVersionId: string;
  const dummyIp = `10.88.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;

  it("registers student and retrieves default reading preferences", async () => {
    const student = await signupUser(
      {
        displayName: "Raka Pratama",
        email: studentEmail,
        password,
        role: "student",
      },
      dummyIp,
    );
    studentId = student.id;

    const prefs = await getUserPreferences(studentId);
    expect(prefs).toBeDefined();
    expect(prefs.structure).toBe("standard");
    expect(prefs.easyRead).toBe(false);
    expect(prefs.fontSize).toBe(20);
    expect(prefs.theme).toBe("light");
  });

  it("updates reading preferences and persists in database", async () => {
    const updated = await updateUserPreferences(studentId, {
      structure: "focus",
      easyRead: true,
      fontSize: 24,
      theme: "sepia",
      speechRate: 1.25,
      listenEnabled: true,
    });

    expect(updated.easyRead).toBe(true);
    expect(updated.fontSize).toBe(24);
    expect(updated.theme).toBe("sepia");
    expect(updated.speechRate).toBe(1.25);
    expect(updated.listenEnabled).toBe(true);

    // Verify it persists on subsequent fetches
    const fetchedAgain = await getUserPreferences(studentId);
    expect(fetchedAgain.fontSize).toBe(24);
    expect(fetchedAgain.theme).toBe("sepia");
  });

  it("validates schema constraints on invalid font size and theme", () => {
    const invalidResult = updateReadingPreferencesSchema.safeParse({
      fontSize: 35, // Not in [18, 20, 22, 24, 28]
    });
    expect(invalidResult.success).toBe(false);

    const invalidTheme = updateReadingPreferencesSchema.safeParse({
      theme: "neon-cyan",
    });
    expect(invalidTheme.success).toBe(false);
  });

  it("saves and resumes reading progress for published lesson", async () => {
    // 1. Setup teacher and published material
    const teacher = await signupUser(
      {
        displayName: "Pak Budi",
        email: teacherEmail,
        password,
        role: "teacher",
      },
      dummyIp,
    );
    teacherId = teacher.id;

    const teacherSession = {
      id: teacherId,
      email: teacherEmail,
      displayName: "Pak Budi",
      role: "teacher" as const,
    };

    const cls = await createClass(teacherSession, {
      name: "Biologi VIII-A",
      description: "IPA",
    });

    const classDetail = await getClassForUser(teacherSession, cls.id);
    if (!classDetail.isOwner) throw new Error("Expected owner detail");

    await joinClass({
      id: studentId,
      email: studentEmail,
      displayName: "Raka Pratama",
      role: "student" as const,
    }, {
      code: classDetail.joinCode,
    });

    const mat = await createMaterial(teacherSession, cls.id, {
      title: "Sistem Peredaran Darah",
      subject: "IPA",
      description: "Materi tentang sistem sirkulasi darah manusia",
      inputType: "text",
      consent: true,
      text: "Jantung adalah organ penting yang memompa darah ke seluruh tubuh. Darah mengangkut oksigen dan nutrisi.",
    });

    // Approve draft sections
    const draft = await getMaterialDraft(teacherSession, mat.id);
    for (const sec of draft.content.sections) {
      await approveDraftSection(teacherSession, mat.id, sec.id, {
        expectedRevision: draft.revision,
        expectedSectionRevision: sec.revision,
      });
    }

    // Publish material
    const pub = await publishMaterial(teacherSession, mat.id, {
      draftId: mat.draftId!,
      expectedRevision: draft.revision,
    });
    lessonVersionId = pub.versionId;

    // 2. Initial progress should be null
    const initialProg = await getReadingProgress(studentId, lessonVersionId);
    expect(initialProg).toBeNull();

    // 3. Save progress on Card #2
    const saved = await saveReadingProgress(studentId, lessonVersionId, {
      lessonVersionId,
      cardId: "card-2",
      cardIndex: 1,
      scrollFraction: 0.5,
      isCompleted: false,
    });

    expect(saved.cardId).toBe("card-2");
    expect(saved.scrollFraction).toBe(0.5);
    expect(saved.completedAt).toBeNull();

    // 4. Student resumes reading
    const resumed = await getReadingProgress(studentId, lessonVersionId);
    expect(resumed).not.toBeNull();
    expect(resumed?.cardId).toBe("card-2");

    // 5. Complete lesson
    const finished = await saveReadingProgress(studentId, lessonVersionId, {
      lessonVersionId,
      cardId: "card-recap",
      cardIndex: 3,
      scrollFraction: 1,
      isCompleted: true,
    });
    expect(finished.completedAt).not.toBeNull();
  });
});
