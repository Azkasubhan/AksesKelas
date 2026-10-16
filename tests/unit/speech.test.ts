import { describe, expect, it } from "vitest";
import {
  detectLanguage,
  getBestVoiceForLanguage,
  getLanguageLabel,
} from "@/lib/speech";

describe("Speech Synthesis Language Detection", () => {
  it("correctly identifies Indonesian educational text", () => {
    const text =
      "Setelah makanan dikunyah secara mekanis dan bercampur enzim ptialin di dalam rongga mulut, makanan membentuk gumpalan lunak yang disebut bolus.";
    expect(detectLanguage(text)).toBe("id-ID");
  });

  it("correctly identifies Indonesian lesson title and short phrases", () => {
    expect(detectLanguage("Sistem Pencernaan dan Organ Tubuh Manusia")).toBe("id-ID");
    expect(detectLanguage("Perjalanan Makanan: Kerongkongan & Gerak Peristaltik")).toBe("id-ID");
  });

  it("correctly identifies English educational text", () => {
    const text =
      "Photosynthesis is the process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.";
    expect(detectLanguage(text)).toBe("en-US");
  });

  it("correctly identifies English lesson title and phrases", () => {
    expect(detectLanguage("The Human Digestive System and Vital Organs")).toBe("en-US");
    expect(detectLanguage("How plants grow: Sunlight, Water, and Soil")).toBe("en-US");
  });

  it("defaults to id-ID for empty or ambiguous text", () => {
    expect(detectLanguage("")).toBe("id-ID");
    expect(detectLanguage("12345 67890")).toBe("id-ID");
  });

  it("selects appropriate voice for Indonesian language", () => {
    const mockVoices = [
      {
        default: false,
        lang: "en-US",
        localService: true,
        name: "Samantha",
        voiceURI: "samantha",
      },
      {
        default: false,
        lang: "id-ID",
        localService: true,
        name: "Damayanti",
        voiceURI: "damayanti",
      },
    ] as SpeechSynthesisVoice[];

    const chosenVoice = getBestVoiceForLanguage(mockVoices, "id-ID");
    expect(chosenVoice?.name).toBe("Damayanti");
    expect(chosenVoice?.lang).toBe("id-ID");
  });

  it("selects appropriate voice for English language", () => {
    const mockVoices = [
      {
        default: false,
        lang: "id-ID",
        localService: true,
        name: "Damayanti",
        voiceURI: "damayanti",
      },
      {
        default: false,
        lang: "en-US",
        localService: true,
        name: "Samantha",
        voiceURI: "samantha",
      },
    ] as SpeechSynthesisVoice[];

    const chosenVoice = getBestVoiceForLanguage(mockVoices, "en-US");
    expect(chosenVoice?.name).toBe("Samantha");
    expect(chosenVoice?.lang).toBe("en-US");
  });

  it("returns human friendly label and flag for detected language", () => {
    expect(getLanguageLabel("id-ID").flag).toBe("🇮🇩");
    expect(getLanguageLabel("id-ID").shortName).toBe("Indonesia");
    expect(getLanguageLabel("en-US").flag).toBe("🇬🇧");
    expect(getLanguageLabel("en-US").shortName).toBe("English");
  });
});
