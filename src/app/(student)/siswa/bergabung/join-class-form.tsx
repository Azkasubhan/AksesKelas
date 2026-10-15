"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/api-client";
import { joinClassSchema } from "@/shared/schemas/auth-classes";
import { validateWithSchema } from "@/lib/validation";

export function JoinClassForm({ csrfToken }: { csrfToken: string }) {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    // Normalisasi: buang spasi dan tanda hubung
    const cleaned = code.replace(/[\s-]/g, "").toUpperCase();

    const validation = validateWithSchema(joinClassSchema, { code: cleaned });
    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      if (validation.generalError) {
        toast.warning(validation.generalError);
      }
      return;
    }

    setLoading(true);

    try {
      const result = await apiFetch<{ class: { id: string; name: string } }>("/classes/join", {
        method: "POST",
        body: { code: cleaned },
        csrfToken,
      });

      toast.success(`Berhasil bergabung ke kelas ${result.class.name}! Mengalihkan ke ruang kelas…`);
      setTimeout(() => {
        router.push(`/siswa/kelas/${result.class.id}`);
        router.refresh();
      }, 1000);
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        toast.error(err.message);
      } else {
        toast.error("Gagal bergabung ke kelas. Silakan periksa kembali kode Anda.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main id="konten-utama" className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-12">
      <div className="relative overflow-hidden rounded-[24px] border border-line bg-surface p-7 shadow-[0_4px_24px_rgba(19,23,21,0.06),0_20px_40px_-16px_rgba(19,23,21,0.08)] sm:p-9">

        <div className="relative z-10 mb-7">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Pendaftaran Kelas
          </span>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Bergabung ke Kelas
          </h1>
          <p className="mt-1.5 text-sm text-muted leading-relaxed">
            Masukkan 12 karakter kode akses yang diberikan oleh guru Anda untuk mulai membaca materi belajar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-4" noValidate>
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
                className="font-mono text-lg uppercase tracking-widest text-center h-13 shadow-xs"
                required
                autoFocus
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
            <Users className="size-4" aria-hidden="true" />
            <span>{loading ? "Memverifikasi kode…" : "Bergabung ke Kelas"}</span>
          </Button>
        </form>

        <div className="relative z-10 mt-8 border-t border-line/70 pt-6 text-center text-sm text-muted">
          <Link href="/siswa" className="inline-flex items-center gap-1.5 text-muted hover:text-ink transition-colors font-medium">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            <span>Batal dan kembali ke ruang belajar</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
