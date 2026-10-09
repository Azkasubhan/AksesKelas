import { ok, parseJson, route } from "@/server/api";
import { Errors } from "@/server/errors";
import {
  createMaterial,
  listMaterialsForClass,
} from "@/server/services/materials.service";
import { createMaterialSchema } from "@/shared/schemas/materials";

export const runtime = "nodejs";

type P = { classId: string };

export const GET = route<P>(
  { auth: "any" },
  async ({ session, params }) => {
    const data = await listMaterialsForClass(
      session!.user.id,
      session!.user.role,
      params.classId,
    );
    return ok(data);
  },
);

export const POST = route<P>(
  { auth: "teacher", mutation: true },
  async ({ req, session, params }) => {
    const classId = params.classId;
    const contentType = req.headers.get("content-type") || "";

    // A. Dukungan Unggah Berkas Multipart (untuk PDF)
    if (contentType.includes("multipart/form-data")) {
      let formData: FormData;
      try {
        formData = await req.formData();
      } catch {
        throw Errors.badRequest("Gagal memproses form-data unggahan berkas.");
      }

      const title = formData.get("title")?.toString() || "";
      const subject = formData.get("subject")?.toString() || "";
      const description = formData.get("description")?.toString() || undefined;
      const inputType = formData.get("inputType")?.toString() || "pdf";
      const text = formData.get("text")?.toString() || undefined;
      const consentRaw = formData.get("consent");
      const consent = consentRaw === "true" || consentRaw === "1";

      const parsedInput = createMaterialSchema.safeParse({
        title,
        subject,
        description,
        inputType,
        text,
        consent,
      });

      if (!parsedInput.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsedInput.error.issues) {
          const key = issue.path.join(".");
          fieldErrors[key] = issue.message;
        }
        throw Errors.validation(fieldErrors);
      }

      const file = formData.get("file") as File | null;
      let fileBuffer: Buffer | undefined;
      let filename: string | undefined;

      if (parsedInput.data.inputType === "pdf") {
        if (!file || typeof file === "string" || file.size === 0) {
          throw Errors.badRequest("Berkas PDF wajib diunggah.");
        }
        filename = file.name;
        fileBuffer = Buffer.from(await file.arrayBuffer());
      }

      const created = await createMaterial(session!.user, classId, parsedInput.data, {
        fileBuffer,
        originalFilename: filename,
      });

      return ok(created, 201);
    }

    // B. Dukungan JSON (untuk teks tempel atau fixture)
    const body = await parseJson(req, createMaterialSchema);
    const created = await createMaterial(session!.user, classId, body);
    return ok(created, 201);
  },
);
