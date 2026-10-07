"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Alert } from "@/components/ui/badge";
import { Wordmark } from "@/components/layout/wordmark";
import { apiFetch, ApiError } from "@/lib/api-client";
import { safeNextPath } from "@/shared/paths";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);
    setFieldErrors({});

    try {
      const res = await apiFetch<{ role: "teacher" | "student"; redirectTo: string }>(
        "/auth/login",
        {
          method: "POST",
          body: { email, password },
        },
      );
      const destination = safeNextPath(nextParam, res.role);
      router.push(destination);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setGeneralError(err.message);
        setFieldErrors(err.fieldErrors);
      } else {
        setGeneralError("Gagal menghubungi server. Silakan coba kembali beberapa saat lagi.");
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
          {/* Header Kartu Masuk */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-ink">
              Masuk ke AksesKelas
            </h1>
            <p className="mt-2 text-sm text-muted">
              Masukkan alamat email dan kata sandi akun Anda untuk mengakses materi pelajaran.
            </p>
          </div>

          {generalError ? (
            <Alert tone="danger" className="mb-5" role="alert">
              {generalError}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Field
              id="login-email"
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
              id="login-password"
              label="Kata Sandi"
              error={fieldErrors.password}
            >
              {(props) => (
                <div className="relative">
                  <Input
                    {...props}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
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
              <span>{loading ? "Sedang memverifikasi…" : "Masuk"}</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </form>

          <div className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
            Belum memiliki akun?{" "}
            <Link href="/signup" className="font-semibold text-ink underline underline-offset-4 hover:text-primary">
              Daftar sekarang
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <LoginForm />
    </React.Suspense>
  );
}
