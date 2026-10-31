import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Users, Plus, Trash2, User } from "lucide-react";
import { requireRole } from "@/server/auth/guards";
import { listClassesForTeacher } from "@/server/services/classes.service";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DeleteClassModal } from "@/components/teacher/delete-class-modal";
import { CopyCodeButton } from "@/components/teacher/copy-code-button";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Dasbor Guru — AksesKelas",
};

export default async function TeacherHomePage() {
  const session = await requireRole("teacher");
  const teacherClasses = await listClassesForTeacher(session.user.id);
  const totalClasses = teacherClasses.length;
  const totalStudents = teacherClasses.reduce((acc, c) => acc + c.studentCount, 0);
  const totalMaterials = teacherClasses.reduce((acc, c) => acc + c.publishedCount, 0);

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10 space-y-8">
        {/* Header: Judul sejajar Tombol Aksi & Garis Pembatas Proporsional */}
        <div className="border-b border-line pb-5">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h1 className="font-heading text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Selamat datang, {session.user.displayName}
            </h1>
            <div className="shrink-0">
              <Button
                variant="primary"
                size="md"
                asChild
                className="h-10 px-4.5 font-semibold shadow-xs"
              >
                <Link href="/guru/kelas/baru">
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Buat Kelas Baru</span>
                </Link>
              </Button>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Kelola kelas dan bagikan materi belajar yang mudah dipahami setiap murid.
          </p>
        </div>

        {/* 1. Ringkasan Metrik Pengajar (Menyamping 3 Kolom) */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
            <p className="text-xs font-medium text-muted">Kelas yang Diampu</p>
            <p className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {totalClasses}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">Ruang belajar aktif</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
            <p className="text-xs font-medium text-muted">Total Murid Terdaftar</p>
            <p className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {totalStudents}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">Murid di seluruh kelas</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs transition-shadow hover:shadow-sm">
            <p className="text-xs font-medium text-muted">Materi Siap Belajar</p>
            <p className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {totalMaterials}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">Bahan ajar aktif</p>
          </div>
        </div>

        {/* 2. Daftar Kelas Section */}
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Kelas yang Anda Ajar
              </h2>
              <p className="text-xs text-muted">
                Pilih kelas untuk mengunggah materi bacaan, mengatur kartu fokus, atau melihat murid.
              </p>
            </div>
            <span className="rounded-full border border-line bg-surface-subtle px-3 py-1 text-xs font-semibold text-muted">
              {totalClasses} Kelas
            </span>
          </div>

          {totalClasses === 0 ? (
            <div className="rounded-2xl border border-line bg-surface p-12 text-center shadow-xs">
              <h3 className="font-heading text-lg font-bold text-ink">
                Belum Ada Kelas yang Dibuat
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                Buat kelas pertama Anda untuk mulai mengunggah file materi pelajaran (PDF atau teks) dan membagikan kode bergabung kepada para murid.
              </p>
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="md"
                  asChild
                  className="h-11 px-5 font-semibold shadow-xs"
                >
                  <Link href="/guru/kelas/baru">
                    <Plus className="size-4" aria-hidden="true" />
                    <span>Buat Kelas Sekarang</span>
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {teacherClasses.map((cls) => (
                <div
                  key={cls.id}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-xs transition-shadow duration-200 hover:shadow-md"
                >
                  {/* Header gambar gelombang */}
                  <div className="relative shrink-0" style={{ height: 136 }}>
                    <Image
                      src="/class-header-wave.jpg"
                      alt=""
                      fill
                      sizes="(min-width: 640px) 440px, 100vw"
                      className="object-fill"
                      aria-hidden="true"
                    />
                    <div className="relative z-10 px-5 pt-4">
                      <h3
                        className="truncate font-heading text-xl font-bold leading-tight"
                        style={{ color: "#ffffff", maxWidth: "62%" }}
                      >
                        <Link
                          href={`/guru/kelas/${cls.id}`}
                          className="hover:underline focus-visible:outline-focus"
                          style={{ color: "#ffffff" }}
                        >
                          {cls.name}
                        </Link>
                      </h3>
                      {cls.description ? (
                        <p
                          className="mt-0.5 truncate text-sm"
                          style={{ color: "#dbe7ff", maxWidth: "46%" }}
                        >
                          {cls.description}
                        </p>
                      ) : null}
                      <p
                        className="mt-3 truncate text-xs font-medium"
                        style={{ color: "#c3d4fb", maxWidth: "34%" }}
                      >
                        {session.user.displayName}
                      </p>
                    </div>
                  </div>

                  {/* Avatar guru: ikon akun, menimpa tepi bawah header */}
                  <div
                    className="absolute z-20 flex items-center justify-center rounded-full bg-surface-subtle text-muted ring-4 ring-surface"
                    style={{ right: 16, top: 100, width: 68, height: 68 }}
                  >
                    <User className="size-8" aria-hidden="true" />
                  </div>

                  {/* Badan kartu */}
                  <div className="flex min-h-[84px] flex-col justify-end gap-3 px-5 pb-4 pt-5">
                    <div>
                      <CopyCodeButton code={cls.joinCode} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="size-3.5 text-muted" aria-hidden="true" />
                        <span>{cls.studentCount} Murid</span>
                      </span>
                      <span className="text-line">•</span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <BookOpen className="size-3.5 text-muted" aria-hidden="true" />
                        <span>{cls.publishedCount} Materi</span>
                      </span>
                    </div>
                  </div>

                  {/* Footer aksi */}
                  <div className="flex items-center justify-end border-t border-line/70 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <DeleteClassModal
                        classId={cls.id}
                        className={cls.name}
                        studentCount={cls.studentCount}
                        materialCount={cls.publishedCount}
                        csrfToken={session.csrfToken}
                        trigger={
                          <button
                            type="button"
                            title={`Hapus kelas ${cls.name}`}
                            className="flex size-8.5 cursor-pointer items-center justify-center rounded-lg border border-transparent text-muted transition-colors hover:border-danger/25 hover:bg-danger/10 hover:text-danger active:bg-danger/20 focus-visible:outline-focus"
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Hapus kelas {cls.name}</span>
                          </button>
                        }
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="h-8.5 cursor-pointer px-3.5 text-xs font-semibold group-hover:border-primary-border group-hover:text-primary"
                      >
                        <Link href={`/guru/kelas/${cls.id}`}>
                          <span>Buka</span>
                          <ArrowRight
                            className="size-3.5 transition-transform group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </Link>
                      </Button>
                    </div>
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
