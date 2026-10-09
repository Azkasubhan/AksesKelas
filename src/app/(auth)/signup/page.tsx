"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/badge";
import { Wordmark } from "@/components/layout/wordmark";
import { apiFetch, ApiError } from "@/lib/api-client";
import { safeNextPath } from "@/shared/paths";
import { signupSchema } from "@/shared/schemas/auth-classes";
import { validateWithSchema } from "@/lib/validation";

export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<"teacher" | "student">("teacher");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Validasi skema di sisi klien sebelum memanggil server
    const validation = validateWithSchema(signupSchema, {
      displayName,
      email,
      password,
      role,
    });

    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      setGeneralError(validation.generalError);
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch<{ role: "teacher" | "student"; redirectTo: string }>(
        "/auth/signup",
        {
          method: "POST",
          body: { displayName, email, password, role },
        },
      );
      const destination = safeNextPath(null, res.role);
      router.push(destination);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setGeneralError("Pendaftaran akun gagal. Silakan periksa kembali data Anda.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-line bg-canvas/80 px-6 py-4">
        <div className="mx-auto max-w-5xl">
          <Wordmark />
        </div>
      </header>

      <main id="konten-utama" className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-ink">
              Daftar Akun Baru
            </h1>
            <p className="mt-2 text-sm text-muted">
              Mulai membuat atau membaca materi pembelajaran yang dapat diakses dengan nyaman.
            </p>
          </div>

          {generalError ? (
            <Alert tone="danger" className="mb-5" role="alert">
              {generalError}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Pilihan Peran */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Peran Akun</span>
              <div
                className="grid grid-cols-2 gap-2 rounded-btn border border-line bg-surface-subtle p-1"
                role="radiogroup"
                aria-label="Pilih peran akun"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === "teacher"}
                  onClick={() => setRole("teacher")}
                  className={`flex flex-col items-center justify-center rounded-btn py-2 px-3 text-center transition-all ${
                    role === "teacher"
                      ? "bg-surface text-ink font-semibold shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <span className="text-sm font-medium">Guru</span>
                  <span className="text-[11px] text-muted">Kelola kelas & materi</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={role === "student"}
                  onClick={() => setRole("student")}
                  className={`flex flex-col items-center justify-center rounded-btn py-2 px-3 text-center transition-all ${
                    role === "student"
                      ? "bg-surface text-ink font-semibold shadow-xs"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  <span className="text-sm font-medium">Siswa</span>
                  <span className="text-[11px] text-muted">Baca materi kelas</span>
                </button>
              </div>
            </div>

            <Field
              id="signup-name"
              label="Nama Lengkap"
              error={fieldErrors.displayName}
            >
              {(props) => (
                <Input
                  {...props}
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={role === "teacher" ? "Ibu Rani, S.Pd." : "Raka Pratama"}
                  required
                />
              )}
            </Field>

            <Field
              id="signup-email"
              label="Alamat Email"
              error={fieldErrors.email}
            >
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sekolah.id"
                  required
                />
              )}
            </Field>

            <Field
              id="signup-password"
              label="Kata Sandi"
              error={fieldErrors.password}
              hint="Minimal 12 karakter."
            >
              {(props) => (
                <div className="relative">
                  <Input
                    {...props}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 12 karakter"
                    className="pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-btn p-1.5 text-muted hover:text-ink focus-visible:outline-focus"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              )}
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="mt-2 w-full font-medium"
            >
              <span>{loading ? "Membuat akun…" : "Daftar Akun"}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>

          <div className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
            Sudah memiliki akun?{" "}
            <Link href="/login" className="font-semibold text-ink underline underline-offset-4 hover:text-primary">
              Masuk di sini
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
