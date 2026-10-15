import Link from "next/link";
import { Plus, ArrowRight, GraduationCap, BookOpen } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listClassesForStudent } from "@/server/services/classes.service";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Ruang Belajar — AksesKelas",
};

export default async function StudentHomePage() {
  const session = await requireRole("student");
  const studentClasses = await listClassesForStudent(session.user.id);
  const totalClasses = studentClasses.length;

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10 space-y-8">
        {/* Header Task-Oriented */}
        <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Ruang Belajar Siswa
            </span>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Halo, {session.user.displayName}
            </h1>
            <p className="mt-2 text-base text-muted">
              Pilih kelas untuk membaca materi pelajaran dengan format bacaan yang paling nyaman untuk Anda.
            </p>
          </div>
        </div>

        {/* 2. Daftar Kelas Siswa */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Kelas yang Anda Ikuti
              </h2>
              <p className="text-xs text-muted">
                Masuk ke kelas untuk membaca materi yang telah diterbitkan guru Anda.
              </p>
            </div>
            <span className="text-xs font-semibold text-muted bg-surface px-3 py-1 rounded-full border border-line">
              {totalClasses} Kelas
            </span>
          </div>

          {totalClasses === 0 ? (
            <div className="card-lift rounded-[20px] p-12 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-subtle to-primary-subtle/30 text-primary border border-primary-border/60 shadow-xs">
                <GraduationCap className="size-7" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-bold text-ink">
                Belum Terdaftar di Kelas Mana Pun
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
                Minta 12 karakter kode akses kelas kepada guru Anda, lalu klik tombol di bawah untuk mulai bergabung.
              </p>
              <div className="mt-6">
                <Button variant="primary" size="md" asChild className="h-11 px-5">
                  <Link href="/siswa/bergabung">
                    <Plus className="size-4" aria-hidden="true" />
                    <span>Masukkan Kode Bergabung</span>
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {studentClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="card-lift group relative flex flex-col justify-between overflow-hidden rounded-[18px] p-5 sm:p-6"
                >
                  {/* Subtle decorative cover bar */}
                  <div className="cover-dots absolute -right-4 -top-4 size-28 rounded-full bg-primary/10 pointer-events-none opacity-60 transition-transform duration-500 group-hover:scale-125" />

                  <div className="relative z-10 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-subtle to-primary-subtle/40 text-primary border border-primary-border/60 shadow-2xs">
                        <GraduationCap className="size-5" aria-hidden="true" />
                      </div>
                      <span className="inline-flex items-center rounded-md border border-line bg-surface-subtle/80 px-2 py-0.5 text-[11px] font-medium text-muted">
                        Pengajar: <strong className="ml-1 font-semibold text-ink">{cls.teacherName}</strong>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                        <Link href={`/siswa/kelas/${cls.id}`} className="focus-visible:outline-focus">
                          {cls.name}
                        </Link>
                      </h3>
                      {cls.description ? (
                        <p className="mt-1 text-sm text-muted line-clamp-2 leading-relaxed">
                          {cls.description}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs italic text-muted/80">
                          Tidak ada deskripsi tambahan
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 mt-6 flex items-center justify-between border-t border-line/70 pt-4">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <BookOpen className="size-3.5 text-muted" aria-hidden="true" />
                      <span>{cls.publishedCount} Materi Tersedia</span>
                      <span>•</span>
                      <span>Bergabung {formatDate(cls.joinedAt)}</span>
                    </div>

                    {cls.publishedCount > 0 ? (
                      <Button variant="primary" size="sm" asChild className="h-8.5 px-3.5 text-xs font-semibold cursor-pointer">
                        <Link href={`/siswa/kelas/${cls.id}`}>
                          <span>Baca</span>
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" asChild className="h-8.5 px-3.5 text-xs font-semibold cursor-pointer">
                        <Link href={`/siswa/kelas/${cls.id}`}>
                          <span>Buka</span>
                          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
