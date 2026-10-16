import { requireRole } from "@/server/auth/guards";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { JelajahiClient } from "./jelajahi-client";

export const metadata = {
  title: "Jelajahi Cara Membaca — AksesKelas",
};

export default async function JelajahiCaraMembacaPage() {
  const session = await requireRole("student");

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <main id="konten-utama" className="mx-auto w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10 space-y-8">
        {/* Header Halaman */}
        <div className="border-b border-line pb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Panduan & Eksplorasi
          </span>
          <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Jelajahi Cara Membaca
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted leading-relaxed">
            Lihat bagaimana materi pelajaran yang sama dapat disajikan dalam berbagai cara untuk memudahkan pemahamanmu.
          </p>
        </div>

        {/* Komponen Eksplorasi Interaktif */}
        <JelajahiClient />
      </main>
    </DashboardLayout>
  );
}
