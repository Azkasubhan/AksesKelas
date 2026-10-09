"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { apiFetch, ApiError } from "@/lib/api-client";
import { createClassSchema } from "@/shared/schemas/auth-classes";
import { validateWithSchema } from "@/lib/validation";

export function CreateClassDialog({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Validasi skema di sisi klien
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
      await apiFetch<{ id: string }>("/classes", {
        method: "POST",
        body: { name, description: description || undefined },
        csrfToken,
      });
      setOpen(false);
      setName("");
      setDescription("");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setGeneralError("Gagal membuat kelas. Silakan coba kembali.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="md">
          <Plus className="size-4" aria-hidden="true" />
          <span>Buat Kelas</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        title="Buat Kelas Baru"
        description="Buat kelas untuk membagikan materi bacaan multi-modal yang dapat disesuaikan murid Anda."
      >
        {generalError ? (
          <Alert tone="danger" className="mb-4" role="alert">
            {generalError}
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                placeholder="Semester Ganjil 2026/2027 — Pembelajaran Sistem Biologi dan IPA Terpadu"
                rows={3}
              />
            )}
          </Field>

          <div className="mt-6 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={loading}>
              <GraduationCap className="size-4" aria-hidden="true" />
              <span>{loading ? "Menyimpan…" : "Simpan Kelas"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
