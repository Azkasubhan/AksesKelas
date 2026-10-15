"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, FolderPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api-client";
import { createClassSchema } from "@/shared/schemas/auth-classes";
import { validateWithSchema } from "@/lib/validation";

export function CreateClassForm({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    const validation = validateWithSchema(createClassSchema, {
      name,
      description: description.trim() || undefined,
    });

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setGeneralError(validation.generalError);
      return;
    }

    setLoading(true);
    try {
      const created = await apiFetch<{ id: string }>("/classes", {
        method: "POST",
        body: { name, description: description.trim() || undefined },
        csrfToken,
      });
      router.push(`/guru/kelas/${created.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setGeneralError("Gagal membuat kelas. Silakan coba kembali.");
      }
      setLoading(false);
    }
  }

  return (
    <main id="konten-utama" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-12">
      <div className="card-lift relative overflow-hidden rounded-[24px] border border-white/80 bg-surface/95 p-7 shadow-[0_4px_24px_rgba(14,19,38,0.06),0_24px_48px_-16px_rgba(59,82,212,0.2)] backdrop-blur-md sm:p-9">
        {/* Subtle decorative mesh in top-right corner of card */}
        <div className="cover-dots absolute -right-6 -top-6 size-32 rounded-full bg-primary/10 pointer-events-none opacity-50" />

        <div className="relative z-10 mb-7">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Ruang Kelas Baru
          </span>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Buat Kelas
          </h1>
          <p className="mt-1.5 text-sm text-muted leading-relaxed">
            Isi nama kelas untuk mulai menambahkan materi belajar dan membagikan kode bergabung kepada murid.
          </p>
        </div>

        {generalError ? (
          <Alert tone="danger" className="mb-5" role="alert">
            {generalError}
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4" noValidate>
          <Field
            id="class-name"
            label="Nama Kelas"
            error={fieldErrors.name}
            hint="Contoh: IPA VIII A, Biologi X-1, atau Bahasa Indonesia VII"
          >
            {(props) => (
              <Input
                {...props}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="IPA VIII A"
                required
                autoFocus
              />
            )}
          </Field>

          <Field
            id="class-description"
            label="Deskripsi (Opsional)"
            error={fieldErrors.description}
            hint="Catatan pengantar atau semester aktif."
          >
            {(props) => (
              <Textarea
                {...props}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Semester Ganjil 2026/2027 — Pembelajaran IPA Terpadu"
                rows={3}
              />
            )}
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="mt-3 w-full font-semibold shadow-md cursor-pointer"
          >
            <GraduationCap className="size-4" aria-hidden="true" />
            <span>{loading ? "Menyimpan…" : "Simpan & Lanjutkan"}</span>
          </Button>
        </form>

        <div className="relative z-10 mt-8 border-t border-line/70 pt-6 text-center text-sm text-muted">
          <Link href="/guru" className="inline-flex items-center gap-1.5 text-muted hover:text-ink transition-colors font-medium">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Batal dan kembali ke daftar kelas</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
