"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, FolderPlus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/api-client";
import { createClassSchema } from "@/shared/schemas/auth-classes";
import { validateWithSchema } from "@/lib/validation";

export function CreateClassForm({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    const validation = validateWithSchema(createClassSchema, {
      name,
      description: description.trim() || undefined,
    });

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      if (validation.generalError) {
        toast.warning(validation.generalError);
      }
      return;
    }

    setLoading(true);
    try {
      const created = await apiFetch<{ id: string }>("/classes", {
        method: "POST",
        body: { name, description: description.trim() || undefined },
        csrfToken,
      });
      toast.success("Ruang kelas berhasil dibuat!");
      router.push(`/guru/kelas/${created.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        toast.error(err.message);
      } else {
        toast.error("Gagal membuat kelas. Silakan coba kembali.");
      }
      setLoading(false);
    }
  }

  return (
    <main id="konten-utama" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-12">
      <div className="relative overflow-hidden rounded-[24px] border border-line bg-surface p-7 shadow-[0_4px_24px_rgba(19,23,21,0.06),0_20px_40px_-16px_rgba(19,23,21,0.08)] sm:p-9">

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
