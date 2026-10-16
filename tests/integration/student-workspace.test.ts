import { describe, it, expect } from "vitest";
import { signupUser } from "@/server/services/auth.service";
import { createClass, getClassForUser, joinClass } from "@/server/services/classes.service";
import { createMaterial } from "@/server/services/materials.service";
import {
  getMaterialDraft,
  approveDraftSection,
  publishMaterial,
} from "@/server/services/drafts.service";
import { saveReadingProgress } from "@/server/services/preferences.service";
import { getStudentWorkspaceData } from "@/server/services/student-workspace.service";

describe("Student Workspace (Ruang Bacaku) Integration Flow", () => {
  const ts = Date.now();
  const studentEmail = `student_ws_${ts}@sekolah.id`;
  const teacherEmail = `teacher_ws_${ts}@sekolah.id`;
  const password = "PasswordKuatSangatPanjang123";
  const dummyIp = `10.99.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`;

  let studentId: string;
  let teacherId: string;
  let teacherSession: { id: string; email: string; role: "teacher"; displayName: string };
  let studentSession: { id: string; email: string; role: "student"; displayName: string };
  let classId: string;
  let materialId: string;
  let lessonVersionId: string;

  it("returns empty workspace when student has not joined any classes", async () => {
    const student = await signupUser(
      {
        displayName: "Alya Ruang",
        email: studentEmail,
        password,
        role: "student",
      },
      dummyIp,
    );
    studentId = student.id;
    studentSession = {
      id: student.id,
      email: studentEmail,
      role: "student",
      displayName: "Alya Ruang",
    };

    const workspace = await getStudentWorkspaceData(studentId);
    expect(workspace.materials).toEqual([]);
    expect(workspace.continueReading).toBeNull();
    expect(workspace.totalMaterials).toBe(0);
  });

  it("sets up teacher, class, and published material", async () => {
    const teacher = await signupUser(
      {
        displayName: "Ibu Rahmawati",
        email: teacherEmail,
        password,
        role: "teacher",
      },
      dummyIp,
    );
    teacherId = teacher.id;
    teacherSession = {
      id: teacher.id,
      email: teacherEmail,
      role: "teacher",
      displayName: "Ibu Rahmawati",
    };

    const createdClass = await createClass(teacherSession, {
      name: "Biologi VIII C",
      description: "Kelas Biologi Semester Genap",
    });
    classId = createdClass.id;

    const classDetail = await getClassForUser(teacherSession, classId);
    const joinCode = (classDetail as { joinCode: string }).joinCode;

    // Siswa bergabung ke kelas
    await joinClass(studentSession, { code: joinCode });

    // Guru membuat materi dan menerbitkannya
    const material = await createMaterial(teacherSession, classId, {
      title: "Sistem Peredaran Darah",
      subject: "IPA Biologi",
      description: "Materi tentang sel darah dan jantung manusia.",
      inputType: "text",
      consent: true,
      text: "Darah manusia terdiri dari plasma darah dan sel-sel darah. Sel darah merah atau eritrosit berfungsi mengikat oksigen dari paru-paru ke seluruh jaringan tubuh dengan bantuan hemoglobin. Jantung manusia memiliki empat ruang yaitu serambi kanan, serambi kiri, bilik kanan, dan bilik kiri.",
    });
    materialId = material.id;

    const draft = await getMaterialDraft(teacherSession, materialId);
    for (const sec of draft.content.sections) {
      await approveDraftSection(teacherSession, materialId, sec.id, {
        expectedRevision: draft.revision,
        expectedSectionRevision: sec.revision,
      });
    }

    const published = await publishMaterial(teacherSession, materialId, {
      draftId: material.draftId!,
      expectedRevision: draft.revision,
    });
    lessonVersionId = published.versionId;
    expect(lessonVersionId).toBeDefined();
  });

  it("reflects published material as 'belum_dibaca' in student workspace", async () => {
    const workspace = await getStudentWorkspaceData(studentId);
    expect(workspace.totalMaterials).toBe(1);
    expect(workspace.materials[0]?.id).toBe(materialId);
    expect(workspace.materials[0]?.title).toBe("Sistem Peredaran Darah");
    expect(workspace.materials[0]?.status).toBe("belum_dibaca");
    expect(workspace.continueReading).toBeNull();
  });

  it("reflects in-progress reading in 'Lanjutkan Bacaanmu'", async () => {
    // Siswa mulai membaca kartu pertama
    await saveReadingProgress(studentId, lessonVersionId, {
      lessonVersionId,
      cardId: "card_sample_id",
      cardIndex: 0,
      scrollFraction: 0.3,
    });

    const workspace = await getStudentWorkspaceData(studentId);
    expect(workspace.inProgressMaterialsCount).toBe(1);
    expect(workspace.materials[0]?.status).toBe("sedang_dibaca");
    expect(workspace.continueReading).not.toBeNull();
    expect(workspace.continueReading?.materialId).toBe(materialId);
    expect(workspace.continueReading?.title).toBe("Sistem Peredaran Darah");
    expect(workspace.continueReading?.className).toBe("Biologi VIII C");
  });

  it("marks material as 'selesai' when student completes reading", async () => {
    await saveReadingProgress(studentId, lessonVersionId, {
      lessonVersionId,
      isCompleted: true,
      scrollFraction: 1,
    });

    const workspace = await getStudentWorkspaceData(studentId);
    expect(workspace.completedMaterialsCount).toBe(1);
    expect(workspace.inProgressMaterialsCount).toBe(0);
    expect(workspace.materials[0]?.status).toBe("selesai");
    // Karena sudah selesai dan tidak ada materi lain yang sedang dibaca, continueReading kembali null
    expect(workspace.continueReading).toBeNull();
  });
});
