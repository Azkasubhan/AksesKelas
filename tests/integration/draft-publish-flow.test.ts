import { describe, it, expect } from "vitest";
import { signupUser } from "@/server/services/auth.service";
import { createClass, joinClass, getClassForUser } from "@/server/services/classes.service";
import { createMaterial } from "@/server/services/materials.service";
import {
  getMaterialDraft,
  updateDraftSection,
  approveDraftSection,
  publishMaterial,
  unpublishMaterial,
  getPublishedLesson,
} from "@/server/services/drafts.service";
import { DEMO_MATERIAL_FIXTURE } from "../../fixtures/demo/sistem-pencernaan";

describe("PostgreSQL Integration: Milestone 2 Draft Review & Publish Vertical Slice", () => {
  const unique = `m2_${Date.now()}`;
  const teacherEmail = `${unique}_guru@sekolah.id`;
  const studentAEmail = `${unique}_siswaA@sekolah.id`;
  const studentBEmail = `${unique}_siswaB@sekolah.id`;
  const password = "PasswordKuatSangatPanjang123";

  let teacherUser: { id: string; email: string; displayName: string; role: "teacher" };
  let studentAUser: { id: string; email: string; displayName: string; role: "student" };
  let studentBUser: { id: string; email: string; displayName: string; role: "student" };

  let classId: string;
  let materialId: string;
  let draftId: string;
  let currentDraftRevision: number = 1;

  const testIp1 = `10.10.1.${Math.floor(Math.random() * 250) + 1}`;
  const testIp2 = `10.10.2.${Math.floor(Math.random() * 250) + 1}`;
  const testIp3 = `10.10.3.${Math.floor(Math.random() * 250) + 1}`;

  it("sets up teacher, enrolled student, and external student", async () => {
    const t = await signupUser(
      { displayName: "Guru IPA M2", email: teacherEmail, password, role: "teacher" },
      testIp1,
    );
    teacherUser = { id: t.id, email: t.email, displayName: t.displayName, role: "teacher" };

    const sA = await signupUser(
      { displayName: "Siswa Terdaftar", email: studentAEmail, password, role: "student" },
      testIp2,
    );
    studentAUser = { id: sA.id, email: sA.email, displayName: sA.displayName, role: "student" };

    const sB = await signupUser(
      { displayName: "Siswa Luar Kelas", email: studentBEmail, password, role: "student" },
      testIp3,
    );
    studentBUser = { id: sB.id, email: sB.email, displayName: sB.displayName, role: "student" };

    // Teacher creates class
    const cls = await createClass(teacherUser, {
      name: "Kelas IPA VIII Unggulan",
      description: "Kelas untuk demonstrasi milestone 2",
    });
    classId = cls.id;

    // Get joinCode from teacher view
    const teacherClassView = await getClassForUser(teacherUser, classId);
    expect("joinCode" in teacherClassView).toBe(true);
    const joinCode = (teacherClassView as { joinCode: string }).joinCode;

    // Student A joins class
    await joinClass(studentAUser, { code: joinCode });
  });

  it("teacher creates material with multi-modal initial adaptation draft", async () => {
    const mat = await createMaterial(teacherUser, classId, {
      title: DEMO_MATERIAL_FIXTURE.title,
      subject: DEMO_MATERIAL_FIXTURE.subject,
      description: DEMO_MATERIAL_FIXTURE.description,
      inputType: "text",
      text: DEMO_MATERIAL_FIXTURE.text,
      consent: true,
    });

    materialId = mat.id;
    draftId = mat.draftId!;
    expect(materialId).toBeDefined();
    expect(draftId).toBeDefined();

    const draft = await getMaterialDraft(teacherUser, materialId);
    expect(draft.id).toBe(draftId);
    expect(draft.content.sections.length).toBeGreaterThanOrEqual(2);
    expect(draft.isPublished).toBe(false);
  });

  it("teacher updates a section title and verifies revision increments", async () => {
    const draft = await getMaterialDraft(teacherUser, materialId);
    const targetSection = draft.content.sections[0];

    const updated = await updateDraftSection(teacherUser, materialId, targetSection.id, {
      expectedRevision: draft.revision,
      title: "Bagian 1: Kerongkongan dan Gerak Peristaltik (Revisi Guru)",
    });

    expect(updated.draftRevision).toBe(draft.revision + 1);
    currentDraftRevision = updated.draftRevision;

    const draftAfter = await getMaterialDraft(teacherUser, materialId);
    expect(draftAfter.content.sections[0].title).toContain("(Revisi Guru)");
    expect(draftAfter.content.sections[0].revision).toBe(targetSection.revision + 1);
  });

  it("prevents publishing when sections are not approved (human-in-the-loop guard)", async () => {
    await expect(
      publishMaterial(teacherUser, materialId, {
        draftId,
        expectedRevision: currentDraftRevision,
      }),
    ).rejects.toThrow("Materi belum dapat diterbitkan");
  });

  it("teacher approves all sections and publishes material to class", async () => {
    const draft = await getMaterialDraft(teacherUser, materialId);

    // Approve each section with its current revision
    for (const sec of draft.content.sections) {
      await approveDraftSection(teacherUser, materialId, sec.id, {
        expectedRevision: currentDraftRevision,
        expectedSectionRevision: sec.revision,
      });
    }

    // Now publishing must succeed
    const pub = await publishMaterial(teacherUser, materialId, {
      draftId,
      expectedRevision: currentDraftRevision,
    });

    expect(pub.versionId).toBeDefined();
    expect(pub.versionNumber).toBe(1);

    const draftAfter = await getMaterialDraft(teacherUser, materialId);
    expect(draftAfter.isPublished).toBe(true);
    expect(draftAfter.currentVersionId).toBe(pub.versionId);
  });

  it("enrolled student reads published lesson snapshot; non-enrolled student is rejected", async () => {
    // 1. Enrolled student A can read
    const lesson = await getPublishedLesson(studentAUser, materialId);
    expect(lesson.title).toBe(DEMO_MATERIAL_FIXTURE.title);
    expect(lesson.content.sections.length).toBeGreaterThanOrEqual(2);
    expect(lesson.versionNumber).toBe(1);

    // 2. Non-enrolled student B is rejected
    await expect(getPublishedLesson(studentBUser, materialId)).rejects.toThrow();
  });

  it("teacher unpublishes material, removing student access", async () => {
    await unpublishMaterial(teacherUser, materialId);

    const draftAfter = await getMaterialDraft(teacherUser, materialId);
    expect(draftAfter.isPublished).toBe(false);
    expect(draftAfter.currentVersionId).toBeNull();

    // Student A cannot access unpublished material anymore
    await expect(getPublishedLesson(studentAUser, materialId)).rejects.toThrow();
  });
});
