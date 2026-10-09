import { describe, it, expect } from "vitest";
import { signupUser } from "@/server/services/auth.service";
import { createClass, getClassForUser } from "@/server/services/classes.service";
import { createMaterial, confirmSourceRevision } from "@/server/services/materials.service";
import { triggerMaterialGeneration, getProcessingJob } from "@/server/services/ai-jobs.service";
import { getMaterialDraft } from "@/server/services/drafts.service";
import { DEMO_MATERIAL_FIXTURE } from "../../fixtures/demo/sistem-pencernaan";

describe("PostgreSQL Integration: Milestone 4 AI Adaptation Pipeline & Jobs", () => {
  const unique = `ai_${Date.now()}`;
  const teacherEmail = `${unique}_guru@sekolah.id`;
  const password = "PasswordKuatSangatPanjang123";
  const testIp = `10.30.1.${Math.floor(Math.random() * 250) + 1}`;

  let teacherUser: { id: string; email: string; displayName: string; role: "teacher" };
  let classId: string;
  let materialId: string;
  let sourceRevisionId: string;

  it("sets up teacher, class, and material with source blocks", async () => {
    const t = await signupUser(
      { displayName: "Guru IPA AI Test", email: teacherEmail, password, role: "teacher" },
      testIp,
    );
    teacherUser = { id: t.id, email: t.email, displayName: t.displayName, role: "teacher" };

    const cls = await createClass(teacherUser, {
      name: "Kelas IPA AI Pipeline",
      description: "Kelas untuk pengujian pipeline Gemini",
    });
    classId = cls.id;

    const mat = await createMaterial(teacherUser, classId, {
      title: DEMO_MATERIAL_FIXTURE.title,
      subject: DEMO_MATERIAL_FIXTURE.subject,
      description: DEMO_MATERIAL_FIXTURE.description,
      inputType: "text",
      text: DEMO_MATERIAL_FIXTURE.text,
      consent: true,
    });
    materialId = mat.id;
    sourceRevisionId = mat.sourceRevisionId!;
  });

  it("teacher confirms source revision extraction fidelity", async () => {
    const conf = await confirmSourceRevision(teacherUser, materialId, sourceRevisionId);
    expect(conf.confirmedAt).toBeDefined();
  });

  it("triggers AI material generation job, records job history, and increments draft revision", async () => {
    const res = await triggerMaterialGeneration(teacherUser, materialId, {
      sourceRevisionId,
      idempotencyKey: `idemp_${Date.now()}`,
    });

    expect(res.jobId).toBeDefined();
    expect(res.status).toBe("succeeded");
    expect(res.draftRevision).toBeGreaterThanOrEqual(1);

    // Verify job tracking in processing_jobs
    const job = await getProcessingJob(teacherUser, res.jobId);
    expect(job.status).toBe("succeeded");
    expect(job.kind).toBe("adapt");
    expect(job.completedUnits).toBeGreaterThan(0);

    // Verify updated draft
    const draft = await getMaterialDraft(teacherUser, materialId);
    expect(draft.revision).toBe(res.draftRevision);
    expect(draft.content.sections.length).toBeGreaterThanOrEqual(2);
    expect(draft.content.sections[0].cards.length).toBeGreaterThan(0);
  });
});
