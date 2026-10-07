import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  UserCheck,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { getCurrentSession } from "@/server/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { HeroShaderGradientBackground } from "@/components/marketing/hero-shader-gradient";
import { HeroFloatingBadges } from "@/components/marketing/hero-floating-badges";
import { ModernFeaturesSection } from "@/components/marketing/modern-features-section";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "AksesKelas — Satu Materi Pelajaran. Bebas Dipahami Semua Murid.",
  description:
    "Platform penyampaian materi kelas dengan akses belajar multi-moda yang ramah guru dan siswa: kartu fokus berurutan, bahasa sederhana, pengaturan tampilan, dan audio pendamping.",
};

export default async function LandingPage() {
  const session = await getCurrentSession();

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink overflow-x-hidden">
      <AppHeader user={session?.user} csrfToken={session?.csrfToken} />

      <main id="konten-utama" className="flex-1">
        {/* ============================================================ */}
        {/* HERO SECTION: Centered Big Text, Floating Badges, ShaderGradient */}
        {/* ============================================================ */}
        <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-5 py-20 text-center sm:px-8 sm:py-32">
          {/* Latar Belakang 3D WebGL ShaderGradient Interaktif */}
          <HeroShaderGradientBackground />

          <div className="relative z-10 mx-auto max-w-4xl">
            {/* Kartu Mengambang Dinamis di Sekitar Hero (Gaya Teman Akun) */}
            <HeroFloatingBadges />

            {/* Pill Atas Ceria */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-border/60 bg-surface/80 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-sm">
              <span className="size-2 rounded-full bg-emerald animate-pulse" />
              <span>Platform Pembelajaran Multi-Moda untuk Guru & Siswa</span>
            </div>

            {/* Headline Utama: Big Text dengan Aksen Warna Hidup */}
            <h1 className="mt-6 font-heading text-4xl font-extrabold tracking-tight text-ink sm:text-6xl sm:leading-[1.12] lg:text-7xl">
              Satu materi pelajaran,
              <br />
              <span className="bg-gradient-to-r from-primary via-indigo-600 to-violet bg-clip-text text-transparent">
                bebas dipahami{" "}
              </span>
              <span className="relative inline-block bg-gradient-to-r from-coral to-amber bg-clip-text text-transparent">
                semua murid
                {/* SVG Garis Lengkung Artistik Bawah Teks */}
                <svg
                  className="absolute -bottom-2 left-0 w-full text-coral opacity-80"
                  viewBox="0 0 250 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M3 9C60 2 190 2 247 9"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Paragraf Pendukung yang Ringan & Hangat */}
            <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted sm:text-xl">
              Ubah teks buku atau lembar PDF menjadi kartu bacaan fokus berurutan, kalimat ramah anak, dan suara pendamping tanpa membuat murid merasa dibeda-bedakan.
            </p>

            {/* Cluster Tombol Aksi Utama (Tengah) */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3.5">
              {session?.user ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="h-12 bg-coral hover:bg-coral-hover text-white px-7 shadow-lg shadow-coral/25 font-semibold text-base transition-all hover:scale-105"
                  asChild
                >
                  <Link href={session.user.role === "teacher" ? "/guru" : "/siswa"}>
                    <span>Buka Ruang {session.user.role === "teacher" ? "Guru" : "Siswa"}</span>
                    <ArrowRight className="size-4.5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="lg"
                    className="h-12 bg-coral hover:bg-coral-hover text-white px-7 shadow-lg shadow-coral/25 font-semibold text-base transition-all hover:scale-105"
                    asChild
                  >
                    <Link href="/signup">
                      <span>Mulai Buat Materi</span>
                      <ArrowRight className="size-4.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="h-12 border-line bg-surface/80 hover:bg-surface px-6 font-semibold text-base backdrop-blur-md transition-all hover:scale-105"
                    asChild
                  >
                    <Link href="/login">
                      <span>Masuk sebagai Guru</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Baris Garansi Kredibilitas Produk */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-muted">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald" />
                100% Hasil AI Wajib Disetujui Guru
              </span>
              <span className="hidden sm:inline text-line">•</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-amber" />
                Bebas Pelabelan Disabilitas Murid
              </span>
              <span className="hidden sm:inline text-line">•</span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-4 text-primary" />
                Terverifikasi Kurikulum Resmi
              </span>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION: Keunggulan Modern AksesKelas (Interaktif & Bertenaga) */}
        {/* ============================================================ */}
        <ModernFeaturesSection />

        {/* ============================================================ */}
        {/* SECTION: Tiga Langkah Guru (Alur Nyata Human-in-the-Loop)       */}
        {/* ============================================================ */}
        <section id="cara-kerja" className="border-t border-line bg-surface/60 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Alur Kerja Pengajar
              </span>
              <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                Tiga Langkah Mudah Menghadirkan Materi Ramah Siswa
              </h2>
              <p className="mt-3 text-base text-muted">
                Guru memegang kuasa penuh sejak awal. AI membantu mempercepat draf adaptasi, namun publikasi sepenuhnya ada di tangan guru.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {/* Langkah 1 */}
              <div className="group relative rounded-2xl border border-line bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary-subtle text-primary font-heading text-xl font-bold">
                  01
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold text-ink">
                  Unggah PDF atau Teks
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Masukkan file materi pelajaran yang biasa Anda ajarkan. Sistem mengekstrak teks menjadi blok sumber berurutan yang terlacak nomor halamannya.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-primary">
                  <FileText className="size-4" />
                  <span>Ekstraksi Dokumen Instan</span>
                </div>
              </div>

              {/* Langkah 2 */}
              <div className="group relative rounded-2xl border border-line bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-subtle text-emerald font-heading text-xl font-bold">
                  02
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold text-ink">
                  Telaah & Edit Berdampingan
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Bandingkan teks asli dengan hasil adaptasi Focus Cards dan Easy Read. Guru bebas menyunting kata, menambahkan catatan, atau menolak draf.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-emerald">
                  <UserCheck className="size-4" />
                  <span>Pintu Persetujuan Guru</span>
                </div>
              </div>

              {/* Langkah 3 */}
              <div className="group relative rounded-2xl border border-line bg-surface p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex size-12 items-center justify-center rounded-xl bg-coral-subtle text-coral font-heading text-xl font-bold">
                  03
                </div>
                <h3 className="mt-5 font-heading text-xl font-bold text-ink">
                  Terbitkan Snapshot ke Kelas
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Bagikan kode kelas kepada murid. Setiap murid bebas memilih format membaca yang paling nyaman bagi mereka secara mandiri dan aman.
                </p>
                <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-coral">
                  <ShieldCheck className="size-4" />
                  <span>Snapshot Publikasi Abadi</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* CTA BANNER: Hangat, Bertenaga & Mengundang                    */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden border-t border-line bg-gradient-to-b from-surface to-primary-subtle/30 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
            <span className="inline-flex items-center gap-1 rounded-full bg-coral-subtle px-3 py-1 text-xs font-bold text-coral">
              Siap Memulai?
            </span>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-ink sm:text-5xl">
              Hadirkan Pengalaman Belajar yang Nyaman untuk Seluruh Siswa Anda
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">
              Daftar sebagai guru pengajar untuk mulai mengunggah materi pertama Anda, atau masuk dengan akun murid untuk mulai membaca.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3.5">
              <Button
                variant="primary"
                size="lg"
                className="h-12 bg-coral hover:bg-coral-hover text-white px-7 shadow-lg shadow-coral/25 font-semibold text-base transition-all hover:scale-105"
                asChild
              >
                <Link href="/signup">
                  <span>Daftar Akun AksesKelas</span>
                  <ArrowRight className="size-4.5" />
                </Link>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="h-12 border-line bg-surface px-6 font-semibold text-base transition-all hover:scale-105"
                asChild
              >
                <Link href="/login">
                  <span>Masuk ke Akun</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================ */}
      {/* FOOTER: Bersih, Ceria & Kredibel                             */}
      {/* ============================================================ */}
      <footer className="border-t border-line bg-surface py-12 text-xs text-muted">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-5 sm:flex-row sm:px-8">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p className="font-heading text-sm font-bold text-ink">AksesKelas</p>
            <p>© 2026 AksesKelas. Platform pembelajaran kelas dengan akses multi-moda inklusif.</p>
          </div>

          <div className="flex items-center gap-6">
            <a href="#keunggulan" className="transition-colors hover:text-ink">
              Keunggulan
            </a>
            <a href="#cara-kerja" className="transition-colors hover:text-ink">
              Cara Kerja
            </a>
            <Link href="/login" className="transition-colors hover:text-ink">
              Masuk
            </Link>
            <Link href="/signup" className="transition-colors hover:text-ink">
              Daftar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
