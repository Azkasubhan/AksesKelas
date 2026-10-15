import Link from "next/link";
import { ArrowRight, BookOpen, Users, FolderPlus, Plus } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listClassesForTeacher } from "@/server/services/classes.service";
import { formatJoinCode } from "@/shared/schemas/auth-classes";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dasbor Guru — AksesKelas",
};

export default async function TeacherHomePage() {
  const session = await requireRole("teacher");
  const teacherClasses = await listClassesForTeacher(session.user.id);
  const totalClasses = teacherClasses.length;

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10 space-y-8">
        {/* Header Task-Oriented */}
        <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Ruang Pengajar
            </span>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              Selamat datang, {session.user.displayName}
            </h1>
            <p className="mt-2 text-base text-muted">
              Kelola kelas, bagikan materi bacaan multimoda, dan pantau penyampaian materi ke murid Anda.
            </p>
          </div>
        </div>

        {/* 2. Daftar Kelas Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Kelas yang Anda Ajar
              </h2>
              <p className="text-xs text-muted">
                Pilih kelas untuk mengelola materi bacaan atau melihat murid terdaftar.
              </p>
            </div>
            <span className="text-xs font-semibold text-muted bg-surface px-3 py-1 rounded-full border border-line">
              {totalClasses} Kelas
            </span>
          </div>

          {totalClasses === 0 ? (
            <div className="card-lift rounded-[20px] p-12 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-subtle to-primary-subtle/30 text-primary border border-primary-border/60 shadow-xs">
                <FolderPlus className="size-7" aria-hidden="true" />
              </div>
              <h3 className="mt-5 font-heading text-lg font-bold text-ink">
                Belum Ada Kelas yang Dibuat
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
                Buat kelas pertama Anda untuk mulai mengunggah file materi pelajaran (PDF atau teks) dan membagikan kode bergabung kepada para murid.
              </p>
              <div className="mt-6">
                <Button variant="primary" size="md" asChild className="h-11 px-5">
                  <Link href="/guru/kelas/baru">
                    <Plus className="size-4" aria-hidden="true" />
                    <span>Buat Kelas Sekarang</span>
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {teacherClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="card-lift group relative flex flex-col justify-between overflow-hidden rounded-[18px] p-5 sm:p-6"
                >
                  {/* Subtle decorative cover bar */}
                  <div className="cover-dots absolute -right-4 -top-4 size-28 rounded-full bg-primary/10 pointer-events-none opacity-60 transition-transform duration-500 group-hover:scale-125" />

                  <div className="relative z-10 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-subtle to-primary-subtle/40 text-primary border border-primary-border/60 shadow-2xs">
                        <BookOpen className="size-5" aria-hidden="true" />
                      </div>
                      <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface-subtle/70 px-2.5 py-1 text-xs">
                        <span className="text-[11px] font-medium text-muted">Kode:</span>
                        <span className="font-mono font-bold tracking-wider text-ink">
                          {formatJoinCode(cls.joinCode)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                        <Link href={`/guru/kelas/${cls.id}`} className="focus-visible:outline-focus">
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
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-muted" aria-hidden="true" />
                        <span>{cls.studentCount} Murid</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="size-3.5 text-muted" aria-hidden="true" />
                        <span>{cls.publishedCount} Materi</span>
                      </span>
                    </div>

                    <Button variant="secondary" size="sm" asChild className="h-8.5 px-3.5 text-xs font-semibold cursor-pointer">
                      <Link href={`/guru/kelas/${cls.id}`}>
                        <span>Buka</span>
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </Link>
                    </Button>
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
