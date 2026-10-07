"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/badge";
import { apiFetch, ApiError } from "@/lib/api-client";

export default function StudentJoinClassPage() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [successClass, setSuccessClass] = React.useState<{ id: string; name: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      const res = await apiFetch<{ id: string; name: string }>("/classes/join", {
        method: "POST",
        body: { code },
      });
      setSuccessClass(res);
      setTimeout(() => {
        router.push("/siswa");
        router.refresh();
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setGeneralError("Gagal bergabung ke kelas. Silakan periksa kembali kode Anda.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="border-b border-line bg-canvas/80 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/siswa"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink"
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            <span>Kembali ke Beranda Siswa</span>
          </Link>
          <span className="font-heading text-sm font-bold tracking-tight text-ink">AksesKelas</span>
        </div>
      </header>

      <main id="konten-utama" className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Pendaftaran Kelas
            </span>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-ink">
              Bergabung ke Kelas
            </h1>
            <p className="mt-2 text-sm text-muted">
              Masukkan 12 karakter kode akses yang diberikan oleh guru Anda untuk mulai membaca materi.
            </p>
          </div>

          {generalError ? (
            <Alert tone="danger" className="mb-5" role="alert">
              {generalError}
            </Alert>
          ) : null}

          {successClass ? (
            <Alert tone="success" className="mb-5" role="status">
              Berhasil bergabung ke kelas <strong>{successClass.name}</strong>! Mengalihkan ke beranda…
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field
              id="join-code"
              label="Kode Akses Kelas"
              error={fieldErrors.code}
              hint="Format 12 karakter (contoh: ZDNQ-GEZH-31JA). Tanda hubung boleh diabaikan."
            >
              {(props) => (
                <Input
                  {...props}
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCD-EFGH-JKMN"
                  className="font-mono text-lg uppercase tracking-widest text-center"
                  required
                />
              )}
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading || !!successClass}
              className="mt-2 w-full font-medium"
            >
              <Users className="size-4" aria-hidden="true" />
              <span>{loading ? "Memverifikasi kode…" : "Bergabung ke Kelas"}</span>
            </Button>
          </form>

          <div className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
            <Link href="/siswa" className="hover:text-ink underline underline-offset-4">
              Batal dan kembali ke ruang belajar
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
