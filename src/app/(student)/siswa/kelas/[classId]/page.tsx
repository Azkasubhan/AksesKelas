import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowRight } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { getClassForUser } from "@/server/services/classes.service";
import { listMaterialsForClass } from "@/server/services/materials.service";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
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
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-6 sm:px-10 sm:py-8 space-y-6">
        {/* Breadcrumb Navigasi */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted">
          <Link href="/siswa" className="hover:text-ink hover:underline">
            Ruang Belajar
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted/60" aria-hidden="true" />
          <span className="font-semibold text-ink" aria-current="page">
            {cls.name}
          </span>
        </nav>

        {/* Header Kelas */}
        <div className="border-b border-line pb-5">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {cls.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Pengajar: <span className="font-semibold text-ink">{"teacherName" in cls ? cls.teacherName : "Guru"}</span>
          </p>
          {cls.description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              {cls.description}
            </p>
          ) : null}
        </div>

        {/* Daftar Materi Terbit */}
        <div className="pt-2">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-ink">
              Materi Pelajaran ({materialsList.length})
            </h2>
          </div>

          {materialsList.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-line bg-surface p-12 text-center shadow-xs">
              <h3 className="font-heading text-lg font-bold text-ink">
                Belum Ada Materi Terbit
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
                Guru sedang menyiapkan materi pelajaran untuk kelas ini. Begitu diterbitkan, materi akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {materialsList.map((mat) => (
                <div
                  key={mat.id}
                  className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-line bg-surface p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-line bg-surface-subtle/80 px-2 py-0.5 text-xs font-medium text-muted">
                        {mat.subject}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-subtle/80 px-2 py-0.5 text-xs font-medium text-ink">
                        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                        <span>Tersedia</span>
                      </span>
                    </div>
                    <h3 className="font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                      <Link href={`/siswa/kelas/${classId}/materi/${mat.id}`} className="focus-visible:outline-focus">
                        {mat.title}
                      </Link>
                    </h3>
                    {mat.description ? (
                      <p className="line-clamp-1 text-sm text-muted">
                        {mat.description}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted">
                      Diterbitkan {formatDate(mat.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                    <Button
                      variant="primary"
                      size="sm"
                      asChild
                      className="h-8.5 px-4 text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      <Link href={`/siswa/kelas/${classId}/materi/${mat.id}`}>
                        <span>Mulai Membaca</span>
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
