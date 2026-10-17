import { describe, it, expect } from "vitest";
import { signupUser } from "@/server/services/auth.service";
import {
  createClass,
  getClassForUser,
  joinClass,
} from "@/server/services/classes.service";
import {
  createMaterial,
  deleteMaterial,
  listMaterialsForClass,
} from "@/server/services/materials.service";
import {
  getMaterialDraft,
  approveDraftSection,
  publishMaterial,
} from "@/server/services/drafts.service";
import { saveReadingProgress } from "@/server/services/preferences.service";
import { getStudentWorkspaceData } from "@/server/services/student-workspace.service";

describe("Teacher Delete Material Cascade Integration Flow", () => {
  const ts = Date.now();
  const teacherEmail = `guru_matdel_${ts}@sekolah.id`;
  const otherTeacherEmail = `guru_matlain_${ts}@sekolah.id`;
  const studentEmail = `murid_matdel_${ts}@sekolah.id`;
  const password = "PasswordKuatSangatPanjang123";
  const dummyIp = `10.88.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;

  let teacherSession: { id: string; email: string; role: "teacher"; displayName: string };
  let otherTeacherSession: { id: string; email: string; role: "teacher"; displayName: string };
  let studentSession: { id: string; email: string; role: "student"; displayName: string };
  let classId: string;
  let materialId: string;

  it("sets up class, material, publish, and student reading progress", async () => {
    // 1. Signup Teacher
    const teacher = await signupUser(
      {
        displayName: "Bu Sarah Guru",
        email: teacherEmail,
        password,
        role: "teacher",
      },
      dummyIp,
    );
    teacherSession = {
      id: teacher.id,
      email: teacherEmail,
      role: "teacher",
      displayName: "Bu Sarah Guru",
    };

    // 2. Signup Other Teacher
    const otherTeacher = await signupUser(
      {
        displayName: "Pak Joko Guru",
        email: otherTeacherEmail,
        password,
        role: "teacher",
      },
      dummyIp,
    );
    otherTeacherSession = {
      id: otherTeacher.id,
      email: otherTeacherEmail,
      role: "teacher",
      displayName: "Pak Joko Guru",
    };

    // 3. Signup Student
    const student = await signupUser(
      {
        displayName: "Rian Murid",
        email: studentEmail,
        password,
        role: "student",
      },
      dummyIp,
    );
    studentSession = {
      id: student.id,
      email: studentEmail,
      role: "student",
      displayName: "Rian Murid",
    };

    // 4. Create Class
    const cls = await createClass(teacherSession, {
      name: "Fisika X-1",
      description: "Kelas Fisika Dasar",
    });
    classId = cls.id;

    const classDetail = await getClassForUser(teacherSession, classId);
    if (!classDetail.isOwner) throw new Error("Expected teacher to be owner");
    await joinClass(studentSession, { code: classDetail.joinCode });

    // 5. Create Material
    const mat = await createMaterial(teacherSession, classId, {
      title: "Hukum Newton tentang Gerak",
      subject: "Fisika",
      description: "Materi tentang hukum I, II, dan III Newton.",
      inputType: "text",
      consent: true,
      text: "Hukum pertama Newton menyatakan bahwa benda yang diam akan tetap diam kecuali ada gaya luar yang bekerja padanya.",
    });
    materialId = mat.id;

    // 6. Approve and Publish
    const draft = await getMaterialDraft(teacherSession, materialId);
    for (const sec of draft.content.sections) {
      await approveDraftSection(teacherSession, materialId, sec.id, {
        expectedRevision: draft.revision,
        expectedSectionRevision: sec.revision,
      });
    }
    const published = await publishMaterial(teacherSession, materialId, {
      draftId: mat.draftId!,
      expectedRevision: draft.revision,
    });

    // 7. Student reads
    await saveReadingProgress(studentSession.id, published.versionId, {
      lessonVersionId: published.versionId,
      scrollFraction: 0.3,
    });

    const materials = await listMaterialsForClass(teacherSession.id, "teacher", classId);
    expect(materials.length).toBe(1);
    expect(materials[0].title).toBe("Hukum Newton tentang Gerak");
  });

  it("prevents other teacher or student from deleting the material", async () => {
    // Other teacher
    await expect(deleteMaterial(otherTeacherSession, materialId)).rejects.toThrow();

    // Student role
    await expect(deleteMaterial(studentSession as any, materialId)).rejects.toThrow();
  });

  it("successfully deletes material and cascades drafts, versions, and progress while keeping the class", async () => {
    // Owner teacher deletes material
    const res = await deleteMaterial(teacherSession, materialId);
    expect(res.classId).toBe(classId);
    expect(res.title).toBe("Hukum Newton tentang Gerak");

    // Class still exists
    const cls = await getClassForUser(teacherSession, classId);
    expect(cls.name).toBe("Fisika X-1");

    // Materials in class is now 0
    const materials = await listMaterialsForClass(teacherSession.id, "teacher", classId);
    expect(materials.length).toBe(0);

    // Student workspace has 0 materials
    const studentWs = await getStudentWorkspaceData(studentSession.id);
    expect(studentWs.materials.length).toBe(0);

    // Attempting to get draft throws notFound
    await expect(getMaterialDraft(teacherSession, materialId)).rejects.toThrow();
  });
});
