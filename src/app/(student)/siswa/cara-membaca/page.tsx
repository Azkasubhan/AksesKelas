import { requireRole } from "@/server/auth/guards";
import { getUserPreferences } from "@/server/services/preferences.service";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CaraMembacaClient } from "./cara-membaca-client";

export const metadata = {
  title: "Cara Membaca Saya — AksesKelas",
};

export default async function CaraMembacaPage() {
  const session = await requireRole("student");
  const preferences = await getUserPreferences(session.user.id);

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10 space-y-8">
        {/* Header Halaman */}
        <div className="border-b border-line pb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Personalisasi Membaca
          </span>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Temukan cara membaca yang nyaman untukmu.
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted leading-relaxed">
            Setiap orang punya kebutuhan membaca yang berbeda. Atur tampilan dan cara membaca sesuai kenyamananmu.
          </p>
        </div>

        {/* Komponen Pengaturan & Pratinjau Interaktif */}
        <CaraMembacaClient
          initialPreferences={preferences}
          csrfToken={session.csrfToken}
        />
      </main>
    </DashboardLayout>
  );
}
