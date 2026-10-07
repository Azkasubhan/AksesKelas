"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, BookOpen, Users } from "lucide-react";
import { Wordmark } from "./wordmark";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import type { SessionUser } from "@/server/auth/session";

interface AppHeaderProps {
  user?: SessionUser | null;
  csrfToken?: string;
}

export function AppHeader({ user, csrfToken }: AppHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        csrfToken,
      });
    } catch {
      // Fallback
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 w-full bg-white/45 backdrop-blur-md border-b border-transparent shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-8">
          <Wordmark href={user ? (user.role === "teacher" ? "/guru" : "/siswa") : "/"} />

          {/* Navigation link for logged-in users */}
          {user ? (
            <nav aria-label="Navigasi Utama" className="hidden items-center gap-1 sm:flex">
              {user.role === "teacher" ? (
                <Link
                  href="/guru"
                  className="inline-flex h-8 items-center gap-1.5 rounded-btn px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle"
                >
                  <BookOpen className="size-3.5 text-muted" aria-hidden="true" />
                  Kelas Saya
                </Link>
              ) : (
                <>
                  <Link
                    href="/siswa"
                    className="inline-flex h-8 items-center gap-1.5 rounded-btn px-3 text-sm font-medium text-ink transition-colors hover:bg-surface-subtle"
                  >
                    <BookOpen className="size-3.5 text-muted" aria-hidden="true" />
                    Materi Belajar
                  </Link>
                  <Link
                    href="/siswa/bergabung"
                    className="inline-flex h-8 items-center gap-1.5 rounded-btn px-3 text-sm font-medium text-muted transition-colors hover:bg-surface-subtle hover:text-ink"
                  >
                    <Users className="size-3.5" aria-hidden="true" />
                    Gabung Kelas
                  </Link>
                </>
              )}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold leading-none text-ink">
                  {user.displayName}
                </p>
                <p className="mt-0.5 text-[11px] leading-none text-muted">
                  {user.role === "teacher" ? "Guru Pengajar" : "Siswa"}
                </p>
              </div>

              <span className="h-4 w-px bg-line hidden sm:block" aria-hidden="true" />

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-8 items-center gap-1.5 rounded-btn px-2.5 text-xs font-medium text-muted transition-colors hover:bg-surface-subtle hover:text-danger focus-visible:outline-focus"
                aria-label="Keluar dari akun"
              >
                <LogOut className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login" className="text-sm font-medium text-ink hover:text-primary">
                  Masuk
                </Link>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <Link href="/signup" className="text-sm font-medium">
                  Daftar Akun
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
