import { describe, it, expect } from "vitest";
import { signupUser } from "@/server/services/auth.service";
import {
  createClass,
  getClassForUser,
  joinClass,
  deleteClass,
  listClassesForTeacher,
} from "@/server/services/classes.service";
import { createMaterial } from "@/server/services/materials.service";
import {
  getMaterialDraft,
  approveDraftSection,
  publishMaterial,
} from "@/server/services/drafts.service";
import { saveReadingProgress } from "@/server/services/preferences.service";
import { getStudentWorkspaceData } from "@/server/services/student-workspace.service";

describe("Teacher Delete Class Cascade Integration Flow", () => {
  const ts = Date.now();
  const teacherEmail = `guru_del_${ts}@sekolah.id`;
  const otherTeacherEmail = `guru_lain_${ts}@sekolah.id`;
  const studentEmail = `murid_del_${ts}@sekolah.id`;
  const password = "PasswordKuatSangatPanjang123";
  const dummyIp = `10.88.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;

  let teacherSession: { id: string; email: string; role: "teacher"; displayName: string };
  let otherTeacherSession: { id: string; email: string; role: "teacher"; displayName: string };
  let studentSession: { id: string; email: string; role: "student"; displayName: string };
  let classId: string;
  let materialId: string;

  it("sets up class with enrolled student, published material, and student progress", async () => {
    // 1. Signup Teacher
    const teacher = await signupUser(
      {
        displayName: "Pak Budi Guru",
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
      displayName: "Pak Budi Guru",
    };

    // 2. Signup Other Teacher
    const otherTeacher = await signupUser(
      {
        displayName: "Bu Cindy Guru",
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
      displayName: "Bu Cindy Guru",
    };

    // 3. Signup Student
    const student = await signupUser(
      {
        displayName: "Doni Murid",
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
      displayName: "Doni Murid",
    };

    // 4. Create Class
    const cls = await createClass(teacherSession, {
      name: "Biologi X-IPA 3",
      description: "Kelas Biologi Semester Genap",
    });
    classId = cls.id;

    const classDetail = await getClassForUser(teacherSession, classId);
    if (!classDetail.isOwner) throw new Error("Expected teacher to be owner");

    // 5. Student joins class
    await joinClass(studentSession, { code: classDetail.joinCode });

    // 6. Teacher creates material
    const mat = await createMaterial(teacherSession, classId, {
      title: "Ekosistem Hutan Hujan Tropis",
      subject: "Biologi",
      description: "Materi tentang ekosistem dan keanekaragaman hayati.",
      inputType: "text",
      consent: true,
      text: "Hutan hujan tropis memiliki keanekaragaman hayati yang sangat tinggi dengan berbagai spesies flora dan fauna.",
    });
    materialId = mat.id;

    // 7. Approve draft and publish
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

    // 8. Student saves reading progress
    await saveReadingProgress(studentSession.id, published.versionId, {
      lessonVersionId: published.versionId,
      scrollFraction: 0.5,
    });

    // Verify student sees the material and class
    const studentWs = await getStudentWorkspaceData(studentSession.id);
    expect(studentWs.materials.length).toBe(1);
    expect(studentWs.materials[0].title).toBe("Ekosistem Hutan Hujan Tropis");
  });

  it("prevents other teacher from deleting the class", async () => {
    await expect(deleteClass(otherTeacherSession, classId)).rejects.toThrow();
  });

  it("successfully cascades and permanently deletes the class with all dependencies", async () => {
    // Delete the class as the owner teacher
    await deleteClass(teacherSession, classId);

    // Verify class cannot be retrieved
    await expect(getClassForUser(teacherSession, classId)).rejects.toThrow();

    // Verify teacher's class list is empty
    const teacherClasses = await listClassesForTeacher(teacherSession.id);
    expect(teacherClasses.find((c) => c.id === classId)).toBeUndefined();

    // Verify student workspace no longer sees materials or class
    const studentWs = await getStudentWorkspaceData(studentSession.id);
    expect(studentWs.materials.length).toBe(0);
    expect(studentWs.totalMaterials).toBe(0);
  });
});
