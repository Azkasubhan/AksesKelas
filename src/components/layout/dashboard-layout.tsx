"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  BookMarked,
  Sliders,
  Sparkles,
  GraduationCap,
  Users,
  LogOut,
  Menu,
  X,
  User,
  FolderPlus,
} from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api-client";
import type { SessionUser } from "@/server/auth/session";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  user: SessionUser;
  csrfToken?: string;
  children: React.ReactNode;
}

export function DashboardLayout({
  user,
  csrfToken,
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [currentHash, setCurrentHash] = React.useState("");

  // Sinkronkan hash URL untuk navigasi berbasis seksi di dashboard siswa
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentHash(window.location.hash);
      const onHashChange = () => setCurrentHash(window.location.hash);
      window.addEventListener("hashchange", onHashChange);
      return () => window.removeEventListener("hashchange", onHashChange);
    }
  }, [pathname]);

  // Tutup menu drawer saat rute berpindah
  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        csrfToken,
      });
    } catch {
      // Abaikan error jaringan saat logout
    }
    router.push("/login");
    router.refresh();
  }

  interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
  }

  interface NavGroup {
    label: string;
    items: NavItem[];
  }

  // Tentukan daftar menu navigasi terstruktur berdasarkan peran akun
  const navGroups: NavGroup[] =
    user.role === "teacher"
      ? [
          {
            label: "Menu Utama",
            items: [
              {
                href: "/guru",
                label: "Kelas Saya",
                icon: BookOpen,
                active:
                  pathname === "/guru" ||
                  (pathname.startsWith("/guru/kelas") && pathname !== "/guru/kelas/baru"),
              },
              {
                href: "/guru/kelas/baru",
                label: "Buat Kelas",
                icon: FolderPlus,
                active: pathname === "/guru/kelas/baru",
              },
            ],
          },
        ]
      : [
          {
            label: "Ruang Bacaku",
            items: [
              {
                href: "/siswa",
                label: "Beranda",
                icon: BookOpen,
                active: pathname === "/siswa" && (!currentHash || currentHash === "#"),
              },
              {
                href: "/siswa/bacaan",
                label: "Bacaan Saya",
                icon: BookMarked,
                active: pathname === "/siswa/bacaan",
              },
              {
                href: "/siswa/cara-membaca",
                label: "Cara Membaca Saya",
                icon: Sliders,
                active: pathname === "/siswa/cara-membaca",
              },
            ],
          },
          {
            label: "Kelas",
            items: [
              {
                href: "/siswa/kelas",
                label: "Kelas Saya",
                icon: GraduationCap,
                active:
                  pathname === "/siswa/kelas" ||
                  (pathname.startsWith("/siswa/kelas") && !pathname.includes("/bergabung")),
              },
              {
                href: "/siswa/bergabung",
                label: "Gabung Kelas",
                icon: Users,
                active: pathname === "/siswa/bergabung",
              },
            ],
          },
          {
            label: "Bantuan",
            items: [
              {
                href: "/siswa/jelajahi",
                label: "Jelajahi Cara Membaca",
                icon: Sparkles,
                active: pathname === "/siswa/jelajahi",
              },
            ],
          },
        ];

  const roleLabel = user.role === "teacher" ? "Guru Pengajar" : "Siswa";

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between">
      {/* Bagian Atas: Logo & Navigasi */}
      <div className="space-y-6">
        {/* Header Logo */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2">
          <Wordmark
            href={user.role === "teacher" ? "/guru" : "/siswa"}
            imageClassName="h-9 sm:h-10"
          />
        </div>

        {/* Kelompok Navigasi */}
        <div className="space-y-5">
          {navGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted/70">
                {group.label}
              </p>
              <nav aria-label={`Navigasi ${group.label}`} className="space-y-0.5 pt-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (item.href.includes("#")) {
                          const hash = item.href.slice(item.href.indexOf("#"));
                          setCurrentHash(hash);
                        } else {
                          setCurrentHash("");
                        }
                        setMobileOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-btn px-3 py-2 text-sm font-medium transition-colors",
                        item.active
                          ? "bg-surface-subtle text-ink font-bold border border-line-subtle shadow-2xs"
                          : "text-muted hover:text-ink hover:bg-surface-subtle/50",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          item.active ? "text-primary" : "text-muted",
                        )}
                        aria-hidden="true"
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Bagian Bawah: Profil Pengguna & Tombol Keluar */}
      <div className="space-y-3 border-t border-line/80 pt-4">
        {/* Info Pengguna */}
        <div className="flex items-center gap-3 rounded-btn bg-surface-subtle/60 px-3 py-2.5 border border-line-subtle shadow-2xs backdrop-blur-xs">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-muted border border-line shadow-xs">
            <User className="size-4.5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-ink leading-tight">
              {user.displayName}
            </p>
            <p className="truncate text-[11px] text-muted leading-tight mt-0.5">
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Tombol Keluar (Buka Popup Konfirmasi) */}
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="flex w-full items-center gap-2.5 rounded-btn px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-rose-600 focus-visible:outline-focus cursor-pointer"
          aria-label="Keluar dari akun"
        >
          <LogOut className="size-4 shrink-0 text-muted transition-colors group-hover:text-rose-600" aria-hidden="true" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="workspace relative flex min-h-dvh bg-canvas text-ink">
      {/* 1. Sidebar Tetap di Desktop (md+) */}
      <aside className="hidden w-64 shrink-0 border-r border-line/80 bg-surface/95 backdrop-blur-md md:block z-20 shadow-[1px_0_12px_rgba(19,23,21,0.02)]">
        <div className="sticky top-0 h-dvh p-5">
          {SidebarContent}
        </div>
      </aside>

      {/* 2. Topbar Navigasi untuk Mobile (< md) */}
      <div className="fixed top-0 inset-x-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-btn border border-line bg-surface text-muted hover:text-ink cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <Wordmark
            href={user.role === "teacher" ? "/guru" : "/siswa"}
            imageClassName="h-7 w-auto"
          />
        </div>

        <div className="flex size-8 items-center justify-center rounded-full bg-surface-subtle text-muted border border-line shadow-xs">
          <User className="size-4" aria-hidden="true" />
        </div>
      </div>

      {/* 3. Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="workspace fixed inset-y-0 left-0 w-72 bg-surface p-5 shadow-2xl transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-full">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute right-0 top-0 inline-flex size-8 items-center justify-center rounded-btn text-muted hover:bg-surface-subtle hover:text-ink cursor-pointer"
                aria-label="Tutup menu"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
              {SidebarContent}
            </div>
          </div>
        </div>
      )}

      {/* 4. Konten Utama Halaman */}
      <div className="relative flex min-w-0 flex-1 flex-col pt-14 md:pt-0">
        <div className="flex flex-1 flex-col">{children}</div>
      </div>

      {/* 5. Popup Dialog Konfirmasi Keluar */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent
          title="Konfirmasi Keluar"
          description="Apakah Anda yakin ingin keluar dari akun AksesKelas?"
          className="max-w-md"
        >
          <div className="space-y-4">

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={handleLogout}
                disabled={loggingOut}
                className="gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span>{loggingOut ? "Sedang keluar…" : "Ya, Keluar"}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
