import Link from "next/link";
import { ArrowRight, BookOpen, Users, FolderPlus } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listClassesForTeacher } from "@/server/services/classes.service";
import { formatJoinCode } from "@/shared/schemas/auth-classes";
import { AppHeader } from "@/components/layout/app-header";
import { CreateClassDialog } from "@/components/teacher/create-class-dialog";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dasbor Guru — AksesKelas",
};

export default async function TeacherHomePage() {
  const session = await requireRole("teacher");
  const teacherClasses = await listClassesForTeacher(session.user.id);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <AppHeader user={session.user} csrfToken={session.csrfToken} />

      <main id="konten-utama" className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
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

          <div className="shrink-0">
            <CreateClassDialog csrfToken={session.csrfToken} />
          </div>
        </div>

        {/* Daftar Kelas */}
        <div className="mt-10">
          <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
            <h2 className="font-heading text-xl font-bold tracking-tight text-ink">
              Kelas yang Anda Ajar ({teacherClasses.length})
            </h2>
          </div>

          {teacherClasses.length === 0 ? (
            <div className="mt-10 rounded-surface border border-line bg-surface p-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-btn bg-surface-subtle text-muted">
                <FolderPlus className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink">
                Belum Ada Kelas yang Dibuat
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
                Buat kelas pertama Anda untuk mulai mengunggah file materi pelajaran (PDF atau teks) dan membagikan kode bergabung kepada para murid.
              </p>
              <div className="mt-6">
                <CreateClassDialog csrfToken={session.csrfToken} />
              </div>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-line rounded-surface border border-line bg-surface">
              {teacherClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-surface-subtle/50 sm:flex-row sm:items-center sm:p-6"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/guru/kelas/${cls.id}`}
                        className="font-heading text-lg font-bold text-ink transition-colors hover:text-primary hover:underline"
                      >
                        {cls.name}
                      </Link>
                      <span className="font-mono text-xs font-semibold tracking-wider text-muted">
                        Kode: {formatJoinCode(cls.joinCode)}
                      </span>
                    </div>

                    {cls.description ? (
                      <p className="text-sm text-muted line-clamp-1">
                        {cls.description}
                      </p>
                    ) : null}

                    <div className="flex items-center gap-4 text-xs text-muted pt-1">
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3.5" aria-hidden="true" />
                        {cls.studentCount} Murid Terdaftar
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="size-3.5" aria-hidden="true" />
                        {cls.publishedCount} Materi Terbit
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/guru/kelas/${cls.id}`}>
                        <span>Buka Kelas</span>
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
