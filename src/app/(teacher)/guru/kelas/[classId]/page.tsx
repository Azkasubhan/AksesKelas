import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Plus, Users, BookOpen, Clock, FileText } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { getClassForUser, listMembers } from "@/server/services/classes.service";
import { listMaterialsForClass } from "@/server/services/materials.service";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { JoinCodePanel } from "@/components/teacher/join-code-panel";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function TeacherClassDetailPage({ params }: PageProps) {
  const session = await requireRole("teacher");
  const { classId } = await params;

  let cls;
  let members;
  let materialsList;
  try {
    cls = await getClassForUser(session.user, classId);
    if (!cls.isOwner) notFound();
    members = await listMembers(session.user, classId);
    materialsList = await listMaterialsForClass(session.user.id, session.user.role, classId);
  } catch {
    notFound();
  }

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-muted">
          <Link href="/guru" className="hover:text-ink hover:underline">
            Kelas Saya
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted/60" aria-hidden="true" />
          <span className="font-semibold text-ink" aria-current="page">
            {cls.name}
          </span>
        </nav>

        {/* Header Kelas */}
        <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 sm:flex-row sm:items-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Manajemen Kelas
            </span>
            <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {cls.name}
            </h1>
            {cls.description ? (
              <p className="mt-2 max-w-2xl text-base text-muted">
                {cls.description}
              </p>
            ) : null}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted">
              <span>Dibuat: {formatDate(cls.createdAt)}</span>
              <span>•</span>
              <span>{members.length} Murid Terdaftar</span>
            </div>
          </div>

          <div className="shrink-0">
            <Button variant="primary" size="md" asChild>
              <Link href={`/guru/kelas/${classId}/materi/baru`}>
                <Plus className="size-4" aria-hidden="true" />
                <span>Tambah Materi</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Join Code Panel */}
        <div className="mt-8">
          <JoinCodePanel
            classId={classId}
            joinCode={cls.joinCode}
            csrfToken={session.csrfToken}
          />
        </div>

        {/* Tabs: Materi & Anggota */}
        <div className="mt-10">
          <Tabs defaultValue="materi">
            <TabsList>
              <TabsTrigger value="materi">
                <BookOpen className="size-4" aria-hidden="true" />
                <span>Materi Pembelajaran</span>
              </TabsTrigger>
              <TabsTrigger value="anggota">
                <Users className="size-4" aria-hidden="true" />
                <span>Daftar Murid ({members.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="materi">
              {!materialsList || materialsList.length === 0 ? (
                <div className="card-lift rounded-[20px] p-12 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-subtle to-primary-subtle/40 text-primary border border-primary-border/60 shadow-xs">
                    <FileText className="size-7" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold text-ink">
                    Belum Ada Materi Pelajaran
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
                    Unggah dokumen PDF atau tempel teks materi. Anda dapat meninjau dan mengedit adaptasi multi-modal sebelum menerbitkannya ke murid.
                  </p>
                  <div className="mt-6">
                    <Button variant="primary" size="md" asChild className="h-11 px-5 cursor-pointer">
                      <Link href={`/guru/kelas/${classId}/materi/baru`}>
                        <Plus className="size-4" aria-hidden="true" />
                        <span>Tambah Materi Sekarang</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {materialsList.map((mat) => (
                    <div
                      key={mat.id}
                      className="card-lift group relative overflow-hidden flex flex-col justify-between gap-4 rounded-[18px] p-5 sm:flex-row sm:items-center sm:p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-subtle to-primary-subtle/40 text-primary border border-primary-border/60 shadow-2xs mt-0.5">
                          <BookOpen className="size-5" aria-hidden="true" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md border border-line bg-surface-subtle/80 px-2 py-0.5 text-xs font-semibold text-muted">
                              {mat.subject}
                            </span>
                            {mat.isPublished ? (
                              <span className="rounded-md bg-emerald-subtle border border-emerald-border/60 px-2 py-0.5 text-xs font-semibold text-emerald">
                                Terbit untuk Murid
                              </span>
                            ) : (
                              <span className="rounded-md bg-amber-subtle border border-amber-border/60 px-2 py-0.5 text-xs font-semibold text-amber">
                                Draf Tersimpan
                              </span>
                            )}
                          </div>
                          <h3 className="font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                            {mat.title}
                          </h3>
                          {mat.description ? (
                            <p className="text-sm text-muted line-clamp-1">
                              {mat.description}
                            </p>
                          ) : null}
                          <p className="text-xs text-muted pt-0.5">
                            Dibuat pada {formatDate(mat.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <Button variant={mat.isPublished ? "secondary" : "primary"} size="sm" asChild className="h-9 px-4 font-semibold cursor-pointer">
                          <Link href={`/guru/materi/${mat.id}`}>
                            <span>{mat.isPublished ? "Lihat & Edit" : "Tinjau Draf"}</span>
                            <ChevronRight className="size-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="anggota">
              {members.length === 0 ? (
                <div className="card-lift rounded-[20px] p-12 text-center">
                  <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-subtle to-primary-subtle/40 text-primary border border-primary-border/60 shadow-xs">
                    <Users className="size-7" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 font-heading text-lg font-bold text-ink">
                    Belum Ada Murid Terdaftar
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
                    Bagikan kode akses kelas di atas kepada murid Anda untuk mulai bergabung ke kelas ini.
                  </p>
                </div>
              ) : (
                <div className="card-lift overflow-hidden rounded-[18px]">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-line bg-surface-subtle/80 text-xs font-semibold uppercase tracking-wider text-muted">
                      <tr>
                        <th className="px-6 py-4">Nama Murid</th>
                        <th className="px-6 py-4">Waktu Bergabung</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {members.map((m) => (
                        <tr key={m.id} className="transition-colors hover:bg-surface-subtle/50">
                          <td className="px-6 py-4 font-medium text-ink">
                            {m.displayName}
                          </td>
                          <td className="px-6 py-4 text-muted">
                            <span className="inline-flex items-center gap-1.5 text-xs">
                              <Clock className="size-3.5" aria-hidden="true" />
                              {formatDate(m.joinedAt)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </DashboardLayout>
  );
}
