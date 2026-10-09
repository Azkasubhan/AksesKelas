import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, BookOpen, ArrowRight, GraduationCap } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { getClassForUser } from "@/server/services/classes.service";
import { listMaterialsForClass } from "@/server/services/materials.service";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function StudentClassDetailPage({ params }: PageProps) {
  const session = await requireRole("student");
  const { classId } = await params;

  let cls;
  let materialsList;
  try {
    cls = await getClassForUser(session.user, classId);
    materialsList = await listMaterialsForClass(session.user.id, "student", classId);
  } catch {
    notFound();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <AppHeader user={session.user} csrfToken={session.csrfToken} />

      <main id="konten-utama" className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14">
        {/* Breadcrumb Navigasi */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted">
          <Link href="/siswa" className="hover:text-ink hover:underline">
            Ruang Belajar
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted/60" aria-hidden="true" />
          <span className="font-semibold text-ink" aria-current="page">
            {cls.name}
          </span>
        </nav>

        {/* Header Kelas */}
        <div className="border-b border-line pb-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Kelas Pembelajaran
            </span>
          </div>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {cls.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Pengajar: <span className="font-semibold text-ink">{"teacherName" in cls ? cls.teacherName : "Guru"}</span>
          </p>
          {cls.description ? (
            <p className="mt-3 max-w-2xl text-base text-muted leading-relaxed">
              {cls.description}
            </p>
          ) : null}
        </div>

        {/* Daftar Materi Terbit */}
        <div className="mt-10">
          <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
            <h2 className="font-heading text-xl font-bold tracking-tight text-ink">
              Materi Pelajaran ({materialsList.length})
            </h2>
          </div>

          {materialsList.length === 0 ? (
            <div className="mt-10 rounded-surface border border-line bg-surface p-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-btn bg-surface-subtle text-muted">
                <GraduationCap className="size-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-bold text-ink">
                Belum Ada Materi Terbit
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">
                Guru sedang menyiapkan materi pelajaran untuk kelas ini. Begitu diterbitkan, materi akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              {materialsList.map((mat) => (
                <div
                  key={mat.id}
                  className="flex flex-col justify-between gap-4 rounded-surface border border-line bg-surface p-5 transition-shadow hover:shadow-sm sm:flex-row sm:items-center sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-btn bg-primary-subtle text-primary mt-0.5">
                      <BookOpen className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-surface-subtle px-2 py-0.5 text-xs font-semibold text-muted">
                          {mat.subject}
                        </span>
                        <span className="rounded bg-emerald-subtle px-2 py-0.5 text-xs font-semibold text-emerald">
                          Tersedia
                        </span>
                      </div>
                      <h3 className="mt-1.5 font-heading text-lg font-bold text-ink">
                        {mat.title}
                      </h3>
                      {mat.description ? (
                        <p className="mt-1 text-sm text-muted line-clamp-2">
                          {mat.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-muted">
                        Diterbitkan {formatDate(mat.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                    <Button variant="primary" size="md" asChild>
                      <Link href={`/siswa/kelas/${classId}/materi/${mat.id}`}>
                        <span>Mulai Membaca</span>
                        <ArrowRight className="size-4" aria-hidden="true" />
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
