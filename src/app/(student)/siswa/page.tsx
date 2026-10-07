import Link from "next/link";
import { Plus, ArrowRight, GraduationCap } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listClassesForStudent } from "@/server/services/classes.service";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Ruang Belajar — AksesKelas",
};

export default async function StudentHomePage() {
  const session = await requireRole("student");
  const studentClasses = await listClassesForStudent(session.user.id);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <AppHeader user={session.user} csrfToken={session.csrfToken} />

      <main id="konten-utama" className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
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

          <div className="shrink-0">
            <Button variant="primary" size="md" asChild>
              <Link href="/siswa/bergabung">
                <Plus className="size-4" aria-hidden="true" />
                <span>Gabung Kelas Baru</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Daftar Kelas Siswa */}
        <div className="mt-10">
          <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
            <h2 className="font-heading text-xl font-bold tracking-tight text-ink">
              Kelas yang Anda Ikuti ({studentClasses.length})
            </h2>
          </div>

          {studentClasses.length === 0 ? (
            <div className="mt-10 rounded-surface border border-line bg-surface p-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-btn bg-surface-subtle text-muted">
                <GraduationCap className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink">
                Belum Terdaftar di Kelas Mana Pun
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
                Minta 12 karakter kode akses kelas kepada guru Anda, lalu klik tombol di bawah untuk mulai bergabung.
              </p>
              <div className="mt-6">
                <Button variant="primary" size="md" asChild>
                  <Link href="/siswa/bergabung">
                    <Plus className="size-4" aria-hidden="true" />
                    <span>Masukkan Kode Bergabung</span>
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-line rounded-surface border border-line bg-surface">
              {studentClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="flex flex-col justify-between gap-4 p-5 transition-colors hover:bg-surface-subtle/50 sm:flex-row sm:items-center sm:p-6"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/siswa/kelas/${cls.id}`}
                        className="font-heading text-lg font-bold text-ink transition-colors hover:text-primary hover:underline"
                      >
                        {cls.name}
                      </Link>
                      <Badge tone="neutral" className="text-xs">
                        Aktif
                      </Badge>
                    </div>

                    <p className="text-xs text-muted">
                      Pengajar: <span className="font-medium text-ink">{cls.teacherName}</span>
                    </p>

                    {cls.description ? (
                      <p className="text-sm text-muted line-clamp-1">
                        {cls.description}
                      </p>
                    ) : null}

                    <div className="flex items-center gap-4 text-xs text-muted pt-1">
                      <span>{cls.publishedCount} Materi Tersedia</span>
                      <span>•</span>
                      <span>Bergabung {formatDate(cls.joinedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                    {cls.publishedCount > 0 ? (
                      <Button variant="primary" size="sm" asChild>
                        <Link href={`/siswa/kelas/${cls.id}`}>
                          <span>Mulai Membaca</span>
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted italic">
                        Belum ada materi terbit
                      </span>
                    )}
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
