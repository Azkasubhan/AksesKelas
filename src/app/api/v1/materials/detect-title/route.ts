import { ok, route } from "@/server/api";
import { Errors } from "@/server/errors";
import { extractText, getDocumentProxy } from "unpdf";
import { detectTitleAndSubject } from "@/shared/utils/title-detector";

export const runtime = "nodejs";

export const POST = route(
  { auth: "teacher", mutation: true },
  async ({ req }) => {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      throw Errors.badRequest("Format data berkas tidak valid.");
    }

    const file = formData.get("file") as File | null;
    if (!file || typeof file === "string" || file.size === 0) {
      throw Errors.badRequest("Berkas PDF tidak ditemukan.");
    }

    try {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const pdfDoc = await getDocumentProxy(buffer);

      if (pdfDoc.numPages <= 0) {
        return ok({ title: null, subject: null });
      }

      // Ekstraksi halaman pertama untuk deteksi judul & mapel
      const { text: pagesText } = await extractText(pdfDoc, { mergePages: false });
      const firstPage = pagesText[0] || "";

      const detection = detectTitleAndSubject(firstPage);

      return ok({
        title: detection.title,
        subject: detection.subject,
      });
    } catch (err) {
      // Jika berkas scan atau tidak dapat dibaca, kembalikan null tanpa memblokir form
      return ok({ title: null, subject: null });
    }
  },
);
