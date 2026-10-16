import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  Plus,
  Sliders,
} from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listClassesForStudent } from "@/server/services/classes.service";
import { getUserPreferences } from "@/server/services/preferences.service";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Ruang Bacaku — AksesKelas",
};

export default async function StudentHomePage() {
  const session = await requireRole("student");

  // Ambil preferensi pengguna dan daftar kelas terdaftar
  const [preferences, studentClasses] = await Promise.all([
    getUserPreferences(session.user.id),
    listClassesForStudent(session.user.id),
  ]);

  // Format ringkasan preferensi membaca siswa dari database aktual
  const structureLabel = preferences.structure === "focus" ? "Focus Cards" : "Standard Reading";
  const easyReadLabel = preferences.easyRead ? "Easy Read" : "Bahasa Asli";
  const fontSizeLabel = `Teks ${preferences.fontSize} px`;

  const preferenceSummaryText = `${structureLabel} · ${easyReadLabel} · ${fontSizeLabel}`;

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10 space-y-10">
        {/* ========================================================= */}
        {/* SAMBUTAN PERSONAL & RINGKASAN PREFERENSI MEMBACA          */}
        {/* ========================================================= */}
        <div className="space-y-4 border-b border-line pb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Ruang Bacaku
            </span>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Halo, {session.user.displayName}!
            </h1>
            <p className="mt-1.5 text-base text-muted">
              Mari lanjutkan membaca dengan cara yang paling nyaman untukmu.
            </p>
          </div>

          {/* Kartu Ringkasan Preferensi Membaca Aktif Siswa */}
          <div className="flex flex-col gap-3 rounded-[16px] border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary border border-primary/20">
                <Sliders className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Cara Membaca Saya
                </p>
                <p className="font-heading text-sm sm:text-base font-bold text-ink">
                  {preferenceSummaryText}
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              asChild
              className="h-9 px-4 text-xs font-semibold cursor-pointer shrink-0"
            >
              <Link href="/siswa/cara-membaca">
                <Sliders className="size-3.5" aria-hidden="true" />
                <span>Sesuaikan Cara Membaca</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* KELAS SAYA                                                */}
        {/* ========================================================= */}
        <section id="kelas-saya" aria-labelledby="section-classes-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="section-classes-heading" className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Kelas Saya
              </h2>
              <p className="text-xs sm:text-sm text-muted">
                Jalur distribusi materi dari guru ke ruang belajarmu.
              </p>
            </div>

            <Button variant="secondary" size="sm" asChild className="h-8.5 px-3 text-xs font-semibold cursor-pointer">
              <Link href="/siswa/bergabung">
                <Plus className="size-3.5" aria-hidden="true" />
                <span>Gabung Kelas</span>
              </Link>
            </Button>
          </div>

          {studentClasses.length === 0 ? (
            <div className="rounded-[18px] border border-line bg-surface p-8 text-center shadow-xs">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary-subtle text-primary border border-primary/20">
                <GraduationCap className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mt-3.5 font-heading text-base font-bold text-ink">
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
                  className="group relative flex flex-col justify-between rounded-[16px] border border-line bg-surface p-5 shadow-xs transition-colors hover:border-line-subtle"
                >
                  <div className="space-y-2">
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
                        <p className="mt-0.5 text-xs text-muted line-clamp-1">
                          {cls.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
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
        </section>
      </main>
    </DashboardLayout>
  );
}
