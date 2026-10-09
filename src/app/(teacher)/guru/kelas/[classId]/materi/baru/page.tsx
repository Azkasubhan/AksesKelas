"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight,
  Upload,
  AlignLeft,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/badge";
import { PdfDropzone } from "@/components/ui/pdf-dropzone";
import { DEMO_MATERIAL_FIXTURE } from "fixtures/demo/sistem-pencernaan";
import { createMaterialSchema, MIN_TEXT_CHARS, MAX_TEXT_CHARS } from "@/shared/schemas/materials";
import { validateWithSchema } from "@/lib/validation";
import { apiFetch, ApiError, useCsrf } from "@/lib/api-client";

export default function NewMaterialPage() {
  const params = useParams();
  const classId = params.classId as string;
  const router = useRouter();
  const csrfToken = useCsrf();

  const [title, setTitle] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [inputType, setInputType] = React.useState<"text" | "pdf">("text");
  const [text, setText] = React.useState("");
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [consent, setConsent] = React.useState(false);

  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  function handleLoadDemoFixture() {
    setTitle(DEMO_MATERIAL_FIXTURE.title);
    setSubject(DEMO_MATERIAL_FIXTURE.subject);
    setDescription(DEMO_MATERIAL_FIXTURE.description);
    setInputType("text");
    setText(DEMO_MATERIAL_FIXTURE.text);
    setConsent(true);
    setGeneralError(null);
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Validasi skema di sisi klien
    const validation = validateWithSchema(createMaterialSchema, {
      title,
      subject,
      description: description.trim() || undefined,
      inputType,
      text: inputType === "text" ? text : undefined,
      consent,
    });

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setGeneralError(validation.generalError);
      return;
    }

    if (inputType === "pdf" && !pdfFile) {
      setFieldErrors((prev) => ({
        ...prev,
        pdf: "Silakan pilih atau seret berkas PDF materi Anda terlebih dahulu.",
      }));
      setGeneralError("Berkas PDF belum dipilih.");
      return;
    }

    setLoading(true);

    try {
      if (inputType === "pdf" && pdfFile) {
        // Unggah via Multipart
        const formData = new FormData();
        formData.append("title", title);
        formData.append("subject", subject);
        if (description.trim()) formData.append("description", description.trim());
        formData.append("inputType", "pdf");
        formData.append("consent", "true");
        formData.append("file", pdfFile);

        const res = await fetch(`/api/v1/classes/${classId}/materials`, {
          method: "POST",
          headers: {
            ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
          },
          body: formData,
        });

        const json = await res.json();
        if (!res.ok) {
          throw new ApiError(
            json?.error?.message || "Gagal mengunggah materi.",
            res.status,
            json?.error?.fieldErrors,
          );
        }

        router.push(`/guru/kelas/${classId}`);
        router.refresh();
      } else {
        // Unggah via JSON Teks
        await apiFetch(`/classes/${classId}/materials`, {
          method: "POST",
          body: {
            title,
            subject,
            description: description.trim() || undefined,
            inputType: "text",
            text,
            consent: true,
          },
          csrfToken,
        });

        router.push(`/guru/kelas/${classId}`);
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        setFieldErrors(err.fieldErrors || {});
      } else {
        setGeneralError("Terjadi kesalahan saat memproses materi. Silakan coba kembali.");
      }
    } finally {
      setLoading(false);
    }
  }

  const textLength = text.trim().length;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <main id="konten-utama" className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
        {/* Breadcrumb Navigasi */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted">
          <Link href="/guru" className="hover:text-ink hover:underline">
            Kelas Saya
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted/60" aria-hidden="true" />
          <Link href={`/guru/kelas/${classId}`} className="hover:text-ink hover:underline">
            Detail Kelas
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted/60" aria-hidden="true" />
          <span className="font-semibold text-ink" aria-current="page">
            Tambah Materi Baru
          </span>
        </nav>

        {/* Header Judul Halaman */}
        <div className="flex flex-col justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Penyusunan Materi Pembelajaran
            </span>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Tambah Materi Baru
            </h1>
            <p className="mt-2 text-sm text-muted max-w-xl">
              Unggah buku/lembar teks PDF atau tempel materi teks. Dokumen akan diekstrak menjadi blok sumber berurutan sebelum adaptasi multi-modal disusun.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleLoadDemoFixture}
            className="self-start gap-1.5 border-primary/30 text-primary bg-primary-subtle/50 hover:bg-primary-subtle"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            <span>Muat Contoh Demo IPA</span>
          </Button>
        </div>

        {generalError ? (
          <Alert tone="danger" className="mt-6" role="alert">
            {generalError}
          </Alert>
        ) : null}

        {/* Formulir Input Materi */}
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-6" noValidate>
          <div className="rounded-surface border border-line bg-surface p-6 sm:p-8 flex flex-col gap-5">
            <h2 className="font-heading text-lg font-bold text-ink">Informasi Materi</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="mat-title"
                label="Judul Materi"
                error={fieldErrors.title}
                hint="Contoh: Sistem Pencernaan Manusia: Organ dan Enzim"
              >
                {(props) => (
                  <Input
                    {...props}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Sistem Pencernaan Manusia"
                    required
                  />
                )}
              </Field>

              <Field
                id="mat-subject"
                label="Mata Pelajaran"
                error={fieldErrors.subject}
                hint="Contoh: IPA VIII, Biologi X, Bahasa Indonesia"
              >
                {(props) => (
                  <Input
                    {...props}
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="IPA Terpadu VIII"
                    required
                  />
                )}
              </Field>
            </div>

            <Field
              id="mat-desc"
              label="Deskripsi / Catatan Tambahan (Opsional)"
              error={fieldErrors.description}
              hint="Petunjuk khusus untuk murid saat membuka materi ini."
            >
              {(props) => (
                <Textarea
                  {...props}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Bab 4 materi pencernaan kimiawi dan mekanik pada lambung..."
                  rows={2}
                />
              )}
            </Field>
          </div>

          {/* Pemilihan Sumber Materi */}
          <div className="rounded-surface border border-line bg-surface p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-lg font-bold text-ink">Sumber Dokumen Materi</h2>
              <p className="text-xs text-muted">
                Pilih format sumber materi yang ingin diadaptasikan.
              </p>
            </div>

            {/* Pilihan Tab Input */}
            <div className="grid grid-cols-2 gap-3 p-1 rounded-btn bg-surface-subtle border border-line">
              <button
                type="button"
                onClick={() => setInputType("text")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-semibold transition-all ${
                  inputType === "text"
                    ? "bg-surface text-ink shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                <AlignLeft className="size-4" aria-hidden="true" />
                <span>Tempel Teks ({MIN_TEXT_CHARS}+ Karakter)</span>
              </button>

              <button
                type="button"
                onClick={() => setInputType("pdf")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-semibold transition-all ${
                  inputType === "pdf"
                    ? "bg-surface text-ink shadow-xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Upload className="size-4" aria-hidden="true" />
                <span>Unggah Dokumen PDF</span>
              </button>
            </div>

            {inputType === "text" ? (
              <Field
                id="mat-text"
                label="Isi Teks Materi Pembelajaran"
                error={fieldErrors.text}
                hint={`Teks akan dinormalisasi dan dipecah menjadi blok-blok rujukan. (${textLength} / ${MAX_TEXT_CHARS} karakter)`}
              >
                {(props) => (
                  <div>
                    <Textarea
                      {...props}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Tempelkan isi buku pelajaran atau lembar materi di sini (minimal 200 karakter)..."
                      rows={12}
                      className="font-sans leading-relaxed"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-muted">
                      <span>Minimal {MIN_TEXT_CHARS} karakter</span>
                      <span className={textLength >= MIN_TEXT_CHARS ? "text-emerald font-semibold" : "text-muted"}>
                        {textLength >= MIN_TEXT_CHARS ? "Panjang teks memenuhi syarat" : `Kurang ${MIN_TEXT_CHARS - textLength} karakter lagi`}
                      </span>
                    </div>
                  </div>
                )}
              </Field>
            ) : (
              <div className="flex flex-col gap-3">
                <PdfDropzone
                  onFileSelect={(file) => setPdfFile(file)}
                  selectedFile={pdfFile}
                  errorMessage={fieldErrors.pdf}
                />
                <div className="rounded-btn bg-surface-subtle p-3 text-xs text-muted leading-relaxed">
                  <p className="font-semibold text-ink">Catatan Ketentuan Berkas PDF:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Hanya menerima PDF berbasis teks (bukan hasil scan/foto murni tanpa lapisan OCR).</li>
                    <li>Maksimal 30 halaman dan ukuran berkas maksimal 20 MB.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Persetujuan Hak Cipta & Etika AI */}
          <div className="rounded-surface border border-line bg-surface p-6 flex flex-col gap-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="size-4 mt-0.5 rounded border-control text-primary focus:ring-focus cursor-pointer"
              />
              <div className="text-xs text-ink/85 leading-relaxed">
                <span className="font-semibold text-ink">Pernyataan Izin Penggunaan Materi:</span>
                <p className="mt-0.5 text-muted">
                  Saya menyatakan bahwa saya berhak menggunakan materi ajar ini dan menyetujui pemrosesan materi secara terstruktur untuk penyusunan adaptasi multi-modal. Hasil adaptasi akan berstatus draf sampai saya setujui secara manual.
                </p>
              </div>
            </label>
            {fieldErrors.consent ? (
              <p className="text-xs font-semibold text-danger">{fieldErrors.consent}</p>
            ) : null}
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pb-12">
            <Button variant="secondary" size="md" asChild>
              <Link href={`/guru/kelas/${classId}`}>Batal</Link>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading || (inputType === "text" && textLength < MIN_TEXT_CHARS)}
              className="gap-2"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              <span>{loading ? "Mengekstrak Sumber…" : "Simpan & Ekstrak Sumber"}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
