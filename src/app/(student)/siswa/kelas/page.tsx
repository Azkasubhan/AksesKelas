import Link from "next/link";
import { ArrowRight, GraduationCap, Plus } from "lucide-react";
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
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Kelas & Distribusi Materi
            </span>
            <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Kelas Saya
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted leading-relaxed">
              Jalur distribusi materi dari guru ke ruang belajarmu.
            </p>
          </div>

          <Button variant="primary" size="sm" asChild className="h-9 px-4 text-xs font-semibold shrink-0 cursor-pointer">
            <Link href="/siswa/bergabung">
              <Plus className="size-3.5" aria-hidden="true" />
              <span>Gabung Kelas Baru</span>
            </Link>
          </Button>
        </div>

        {/* Daftar Kelas yang Diikuti Siswa */}
        {studentClasses.length === 0 ? (
          <div className="rounded-[18px] border border-line bg-surface p-10 text-center shadow-xs">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary-subtle text-primary border border-primary/20">
              <GraduationCap className="size-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-heading text-base font-bold text-ink">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {studentClasses.map((cls) => (
              <div
                key={cls.id}
                className="group relative flex flex-col justify-between rounded-[16px] border border-line bg-surface p-5 sm:p-6 shadow-xs transition-colors hover:border-line-subtle"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-subtle text-primary border border-line">
                      <GraduationCap className="size-4.5" aria-hidden="true" />
                    </div>
                    <span className="text-[11px] font-medium text-muted">
                      Pengajar: <strong className="font-semibold text-ink">{cls.teacherName}</strong>
                    </span>
                  </div>

                  <div>
                    <h3 className="font-heading text-base font-bold text-ink transition-colors group-hover:text-primary">
                      <Link href={`/siswa/kelas/${cls.id}`} className="focus-visible:outline-focus">
                        {cls.name}
                      </Link>
                    </h3>
                    {cls.description && (
                      <p className="mt-1 text-xs text-muted line-clamp-2 leading-relaxed">
                        {cls.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3.5">
                  <span className="text-xs text-muted">
                    {cls.publishedCount} Materi Tersedia
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    asChild
                    className="h-8 px-3 text-xs font-semibold cursor-pointer"
                  >
                    <Link href={`/siswa/kelas/${cls.id}`}>
                      <span>Buka Kelas</span>
                      <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
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
