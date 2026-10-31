import { requireRole } from "@/server/auth/guards";
import { getUserPreferences } from "@/server/services/preferences.service";
import { getStudentWorkspaceData } from "@/server/services/student-workspace.service";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StudentMaterialsList } from "../student-materials-list";

export const metadata = {
  title: "Bacaan Saya — AksesKelas",
};

export default async function BacaanSayaPage() {
  const session = await requireRole("student");
  const preferences = await getUserPreferences(session.user.id);
  const workspace = await getStudentWorkspaceData(session.user.id, preferences.structure);

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10 space-y-8">
        {/* Header Halaman */}
        <div className="border-b border-line pb-5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Bacaan Saya
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted leading-relaxed">
            Temukan materi dari kelas yang kamu ikuti.
          </p>
        </div>

        {/* Daftar Materi Terbitan dengan Filter Status */}
        <StudentMaterialsList materials={workspace.materials} />
      </main>
    </DashboardLayout>
  );
}
