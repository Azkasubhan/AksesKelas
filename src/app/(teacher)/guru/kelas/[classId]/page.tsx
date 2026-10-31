import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Plus, Users, BookOpen, Clock } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { getClassForUser, listMembers } from "@/server/services/classes.service";
import { listMaterialsForClass } from "@/server/services/materials.service";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { JoinCodePanel } from "@/components/teacher/join-code-panel";
import { DeleteClassModal } from "@/components/teacher/delete-class-modal";
import { DeleteMaterialModal } from "@/components/teacher/delete-material-modal";
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
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-6 sm:px-10 sm:py-8 space-y-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-muted">
          <Link href="/guru" className="hover:text-ink hover:underline">
            Kelas Saya
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted/60" aria-hidden="true" />
          <span className="font-semibold text-ink" aria-current="page">
            {cls.name}
          </span>
        </nav>

        {/* Header Kelas: Kompak & Sejajar */}
        <div className="border-b border-line pb-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {cls.name}
              </h1>
              {cls.description ? (
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                  {cls.description}
                </p>
              ) : null}
              <div className="mt-2.5 flex items-center gap-3 text-xs text-muted">
                <span>Dibuat: {formatDate(cls.createdAt)}</span>
                <span className="text-line">•</span>
                <span>{members.length} Murid Terdaftar</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <DeleteClassModal
                classId={classId}
                className={cls.name}
                studentCount={members.length}
                materialCount={materialsList?.length ?? 0}
                csrfToken={session.csrfToken}
              />
              <Button variant="primary" size="md" asChild className="h-10 px-4.5 font-semibold shadow-xs">
                <Link href={`/guru/kelas/${classId}/materi/baru`}>
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Tambah Materi</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Join Code Panel */}
        <JoinCodePanel
          classId={classId}
          joinCode={cls.joinCode}
          csrfToken={session.csrfToken}
        />

        {/* Tabs: Materi & Anggota */}
        <div className="pt-2">
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
                <div className="rounded-2xl border border-line bg-surface p-12 text-center shadow-xs">
                  <h3 className="font-heading text-lg font-bold text-ink">
                    Belum Ada Materi Pelajaran
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                    Unggah dokumen PDF atau tempel teks materi. Anda dapat meninjau dan mengedit adaptasi sebelum menerbitkannya ke murid.
                  </p>
                  <div className="mt-6">
                    <Button variant="primary" size="md" asChild className="h-10 px-5 font-semibold shadow-xs cursor-pointer">
                      <Link href={`/guru/kelas/${classId}/materi/baru`}>
                        <Plus className="size-4" aria-hidden="true" />
                        <span>Tambah Materi Sekarang</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
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
                          {mat.isPublished ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-subtle/80 px-2 py-0.5 text-xs font-medium text-ink">
                              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                              <span>Terbit untuk Murid</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-line bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                              <span className="size-1.5 rounded-full bg-muted/60" aria-hidden="true" />
                              <span>Draf Tersimpan</span>
                            </span>
                          )}
                        </div>
                        <h3 className="font-heading text-lg font-bold text-ink transition-colors group-hover:text-primary">
                          <Link href={`/guru/materi/${mat.id}`} className="focus-visible:outline-focus">
                            {mat.title}
                          </Link>
                        </h3>
                        {mat.description ? (
                          <p className="line-clamp-1 text-sm text-muted">
                            {mat.description}
                          </p>
                        ) : null}
                        <p className="text-xs text-muted">
                          Dibuat pada {formatDate(mat.createdAt)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                        <DeleteMaterialModal
                          materialId={mat.id}
                          materialTitle={mat.title}
                          csrfToken={session.csrfToken}
                        />
                        <Button
                          variant="secondary"
                          size="sm"
                          asChild
                          className="h-8.5 px-3.5 text-xs font-semibold cursor-pointer group-hover:border-primary-border group-hover:text-primary"
                        >
                          <Link href={`/guru/materi/${mat.id}`}>
                            <span>{mat.isPublished ? "Lihat & Edit" : "Tinjau Draf"}</span>
                            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
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
                <div className="rounded-2xl border border-line bg-surface p-12 text-center shadow-xs">
                  <h3 className="font-heading text-lg font-bold text-ink">
                    Belum Ada Murid Terdaftar
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
                    Bagikan kode akses kelas di atas kepada murid Anda untuk mulai bergabung ke kelas ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-line bg-surface-subtle/80 text-xs font-semibold uppercase tracking-wider text-muted">
                      <tr>
                        <th className="px-6 py-3.5">Nama Murid</th>
                        <th className="px-6 py-3.5">Waktu Bergabung</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {members.map((m) => (
                        <tr key={m.id} className="transition-colors hover:bg-surface-subtle/50">
                          <td className="px-6 py-3.5 font-medium text-ink">
                            {m.displayName}
                          </td>
                          <td className="px-6 py-3.5 text-muted">
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

