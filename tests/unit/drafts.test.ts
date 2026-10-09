import { describe, it, expect } from "vitest";
import { buildInitialAdaptation } from "@/server/extraction/adaptation-fixture";
import {
  draftContentSchema,
  publishDraftSchema,
  approveDraftSectionSchema,
  updateDraftSectionSchema,
} from "@/shared/schemas/drafts-reader";

describe("Adaptation schemas and fixture generator", () => {
  it("builds valid initial adaptation sections from source blocks", () => {
    const blocks = [
      { id: "b1", ordinal: 0, text: "Paragraf 1 tentang mulut dan esofagus." },
      { id: "b2", ordinal: 1, text: "Paragraf 2 tentang gerak peristaltik." },
      { id: "b3", ordinal: 2, text: "Paragraf 3 tentang organ lambung." },
      { id: "b4", ordinal: 3, text: "Paragraf 4 tentang enzim pepsin." },
    ];

    const content = buildInitialAdaptation("Sistem Pencernaan", blocks);
    expect(content.schemaVersion).toBe("1.0");
    expect(content.sections.length).toBeGreaterThanOrEqual(2);

    // Verifikasi skema Zod lulus
    const parsed = draftContentSchema.safeParse(content);
    expect(parsed.success).toBe(true);

    // Verifikasi tiap bagian memiliki kartu berpasangan (originalText & easyText)
    for (const sec of content.sections) {
      expect(sec.cards.length).toBeGreaterThan(0);
      for (const card of sec.cards) {
        expect(card.originalText.length).toBeGreaterThan(0);
        expect(card.easyText.length).toBeGreaterThan(0);
      }
    }
  });

  it("validates updateDraftSection schema", () => {
    const res = updateDraftSectionSchema.safeParse({
      expectedRevision: 1,
      title: "Judul Bagian yang Diedit Guru",
    });
    expect(res.success).toBe(true);
  });

  it("validates approveDraftSection schema", () => {
    const res = approveDraftSectionSchema.safeParse({
      expectedRevision: 1,
      expectedSectionRevision: 2,
    });
    expect(res.success).toBe(true);
  });

  it("validates publishDraft schema with uuid", () => {
    const res = publishDraftSchema.safeParse({
      draftId: "123e4567-e89b-12d3-a456-426614174000",
      expectedRevision: 1,
    });
    expect(res.success).toBe(true);
  });
});
