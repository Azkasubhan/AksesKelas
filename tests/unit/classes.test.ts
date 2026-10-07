import { describe, it, expect } from "vitest";
import { generateJoinCode, formatJoinCode } from "@/server/services/classes.service";
import { joinClassSchema, createClassSchema } from "@/shared/schemas/auth-classes";

describe("Classes service utilities", () => {
  it("generates 12-char Crockford Base32 join codes without ambiguous letters", () => {
    const code = generateJoinCode();
    expect(code).toHaveLength(12);
    // Base32 Crockford without I, L, O, U
    expect(code).toMatch(/^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{12}$/);
    expect(code).not.toMatch(/[ILOU]/);
  });

  it("formats join code with clean hyphen grouping", () => {
    const code = "0123456789AB";
    expect(formatJoinCode(code)).toBe("0123-4567-89AB");
  });

  it("normalizes student join code input (removes spaces, hyphens, uppercases)", () => {
    const parsed = joinClassSchema.parse({ code: " 0123 - 4567 - 89ab " });
    expect(parsed.code).toBe("0123456789AB");
  });

  it("validates create class schema", () => {
    const res = createClassSchema.safeParse({
      name: "IPA VIII A",
      description: "Deskripsi pembelajaran",
    });
    expect(res.success).toBe(true);
  });
});
