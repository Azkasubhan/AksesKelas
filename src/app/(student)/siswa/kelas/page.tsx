import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Plus, User } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listClassesForStudent } from "@/server/services/classes.service";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Kelas Saya — AksesKelas",
};

export default async function KelasSayaPage() {
  const session = await requireRole("student");
  const studentClasses = await listClassesForStudent(session.user.id);

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10 space-y-8">
        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Kelas Saya
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted leading-relaxed">
              Jalur distribusi materi dari guru ke ruang belajarmu.
            </p>
          </div>

          <Button variant="primary" size="sm" asChild className="h-9 px-4 text-xs font-semibold shrink-0 cursor-pointer shadow-xs">
            <Link href="/siswa/bergabung">
              <Plus className="size-3.5" aria-hidden="true" />
              <span>Gabung Kelas Baru</span>
            </Link>
          </Button>
        </div>

        {/* Daftar Kelas yang Diikuti Siswa */}
        {studentClasses.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-10 text-center shadow-xs">
            <h3 className="font-heading text-lg font-bold text-ink">
              Belum Terdaftar di Kelas Mana Pun
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              Minta 12 karakter kode akses kelas kepada guru Anda, lalu klik tombol di bawah untuk bergabung.
            </p>
            <div className="mt-5">
              <Button variant="primary" size="sm" asChild className="h-9 px-4 font-semibold cursor-pointer">
                <Link href="/siswa/bergabung">
                  <Plus className="size-3.5" aria-hidden="true" />
                  <span>Masukkan Kode Kelas</span>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {studentClasses.map((cls) => (
              <div
                key={cls.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-shadow duration-200 hover:shadow-md"
              >
                {/* Header gambar gelombang (Gaya Google Classroom selaras dengan guru) */}
                <div className="relative shrink-0" style={{ height: 136 }}>
                  <Image
                    src="/class-header-wave.jpg"
                    alt=""
                    fill
                    sizes="(min-width: 640px) 440px, 100vw"
                    className="object-fill"
                    aria-hidden="true"
                  />
                  <div className="relative z-10 px-5 pt-4">
                    <h3
                      className="truncate font-heading text-xl font-bold leading-tight"
                      style={{ color: "#ffffff", maxWidth: "62%" }}
                    >
                      <Link
                        href={`/siswa/kelas/${cls.id}`}
                        className="hover:underline focus-visible:outline-focus"
                        style={{ color: "#ffffff" }}
                      >
                        {cls.name}
                      </Link>
                    </h3>
                    {cls.description ? (
                      <p
                        className="mt-0.5 truncate text-sm"
                        style={{ color: "#dbe7ff", maxWidth: "46%" }}
                      >
                        {cls.description}
                      </p>
                    ) : null}
                    <p
                      className="mt-3 truncate text-xs font-medium"
                      style={{ color: "#c3d4fb", maxWidth: "34%" }}
                    >
                      {cls.teacherName}
                    </p>
                  </div>
                </div>

                {/* Avatar guru: ikon akun, menimpa tepi bawah header */}
                <div
                  className="absolute z-20 flex items-center justify-center rounded-full bg-surface-subtle text-muted ring-4 ring-surface"
                  style={{ right: 16, top: 100, width: 68, height: 68 }}
                >
                  <User className="size-8" aria-hidden="true" />
                </div>

                {/* Badan kartu */}
                <div className="flex min-h-[72px] flex-col justify-end gap-3 px-5 pb-4 pt-5">
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1.5 font-medium">
                      <BookOpen className="size-3.5 text-muted" aria-hidden="true" />
                      <span>{cls.publishedCount} Materi Tersedia</span>
                    </span>
                  </div>
                </div>

                {/* Footer aksi */}
                <div className="flex items-center justify-end border-t border-line/70 px-4 py-2.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    asChild
                    className="h-8.5 px-3.5 text-xs font-semibold cursor-pointer group-hover:border-primary-border group-hover:text-primary"
                  >
                    <Link href={`/siswa/kelas/${cls.id}`}>
                      <span>Buka Kelas</span>
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

