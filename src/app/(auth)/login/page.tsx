"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { toast } from "@/components/ui/toast";
import { apiFetch, ApiError } from "@/lib/api-client";
import { safeNextPath } from "@/shared/paths";
import { loginSchema } from "@/shared/schemas/auth-classes";
import { validateWithSchema } from "@/lib/validation";
import { AuthCardLayout } from "@/components/auth/auth-card-layout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    // Validasi skema di sisi klien
    const validation = validateWithSchema(loginSchema, { email, password });
    if (!validation.success) {
      setFieldErrors(validation.fieldErrors);
      if (validation.generalError) {
        toast.warning(validation.generalError);
      }
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch<{ role: "teacher" | "student"; redirectTo: string }>(
        "/auth/login",
        {
          method: "POST",
          body: { email, password },
        },
      );
      toast.success("Berhasil masuk! Mengalihkan ke dasbor…");
      const destination = safeNextPath(nextParam, res.role);
      router.push(destination);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        toast.error(err.message);
      } else {
        toast.error("Gagal menghubungi server. Silakan coba kembali beberapa saat lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCardLayout
      title="Masuk ke AksesKelas"
      description="Masukkan alamat email dan kata sandi akun Anda untuk mengakses materi pelajaran."
      footerText={
        <>
          Belum memiliki akun?{" "}
          <Link
            href="/signup"
            className="font-semibold text-ink underline underline-offset-4 hover:text-primary"
          >
            Daftar sekarang
          </Link>
        </>
      }
    >

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <Field id="login-email" label="Alamat Email" error={fieldErrors.email}>
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

        <Field id="login-password" label="Kata Sandi" error={fieldErrors.password}>
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
          className="mt-3 w-full font-medium shadow-xs"
        >
          <span>{loading ? "Sedang memverifikasi…" : "Masuk"}</span>
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      </form>
    </AuthCardLayout>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <LoginForm />
    </React.Suspense>
  );
}
