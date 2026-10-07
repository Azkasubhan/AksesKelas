import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentSession } from "@/server/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { HeroShaderGradientBackground } from "@/components/marketing/hero-shader-gradient";
import { HeroHeadline } from "@/components/marketing/hero-headline";
import { ProductStage } from "@/components/marketing/product-stage";
import { TeacherFlow } from "@/components/marketing/teacher-flow";
import { MotionProvider, Reveal } from "@/components/marketing/motion-primitives";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "AksesKelas — Satu Materi Pelajaran. Bebas Dipahami Semua Murid.",
  description:
    "Platform penyampaian materi kelas dengan akses belajar yang dapat disesuaikan: kartu fokus berurutan, bahasa sederhana, pengaturan tampilan, dan audio pendamping.",
};

export default async function LandingPage() {
  const session = await getCurrentSession();
  const dashboardHref = session?.user.role === "teacher" ? "/guru" : "/siswa";

  return (
    <MotionProvider>
      <div className="flex min-h-dvh flex-col overflow-x-clip bg-canvas text-ink">
        <AppHeader user={session?.user} csrfToken={session?.csrfToken} />

        <main id="konten-utama" className="flex-1">
          {/* Hero */}
          <section className="relative flex min-h-[640px] sm:min-h-[720px] flex-col items-center justify-start px-5 pt-32 pb-24 text-center sm:px-8 sm:pt-40 sm:pb-32 lg:pt-44 lg:pb-36">
            <HeroShaderGradientBackground />

            <div className="relative z-10 mx-auto max-w-4xl">
              <HeroHeadline className="font-heading text-[2.6rem] font-extrabold leading-[1.08] tracking-tight text-ink sm:text-6xl lg:text-7xl" />

              <Reveal delay={1.05} y={16}>
                <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-ink/80 sm:text-xl font-normal">
                  Ubah teks buku atau lembar PDF menjadi kartu bacaan fokus berurutan, kalimat yang mudah dipahami, dan suara pendamping.
                </p>
              </Reveal>

              <Reveal delay={1.22} y={16}>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                  {session?.user ? (
                    <Button variant="coral" size="lg" className="h-12 px-7 text-base shadow-lg shadow-coral/25" asChild>
                      <Link href={dashboardHref}>
                        <span>Buka Ruang {session.user.role === "teacher" ? "Guru" : "Siswa"}</span>
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button variant="coral" size="lg" className="h-12 px-7 text-base shadow-lg shadow-coral/25" asChild>
                        <Link href="/signup">
                          <span>Mulai Buat Materi</span>
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="lg"
                        className="h-12 px-7 text-base font-medium text-ink bg-white/60 hover:bg-white/85 border border-white/80 shadow-xs backdrop-blur-md rounded-btn transition-all duration-150"
                        asChild
                      >
                        <Link href="/login">Masuk sebagai Guru</Link>
                      </Button>
                    </>
                  )}
                </div>
                <p className="mt-6 text-sm text-ink/65 font-medium">
                  Hasil AI selalu berstatus draf sampai disetujui guru.
                </p>
              </Reveal>
            </div>
          </section>

          <ProductStage />
          <TeacherFlow />

          {/* Closing call to action */}
          <section className="px-5 pb-24 sm:px-8 sm:pb-32">
            <Reveal className="mx-auto max-w-6xl">
              <div className="rounded-[20px] bg-primary px-7 py-14 text-white sm:px-14 sm:py-20">
                <h2 className="max-w-2xl font-heading text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
                  Mulai dari satu materi untuk kelas Anda.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                  Daftar sebagai guru untuk mengunggah materi pertama, atau masuk sebagai murid dengan kode kelas dari guru.
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Button variant="coral" size="lg" className="h-12 px-7 text-base" asChild>
                    <Link href="/signup">
                      <span>Daftar Akun</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-12 px-6 text-base text-white hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <Link href="/login">Masuk</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          </section>
        </main>

        <footer className="px-5 pb-10 text-sm text-ink/60 sm:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
            <p>
              <span className="font-heading font-bold text-ink">AksesKelas</span> · Satu materi, banyak cara memahami.
            </p>
            <nav aria-label="Tautan footer" className="flex items-center gap-6">
              <a href="#keunggulan" className="transition-colors hover:text-ink">
                Lapisan Membaca
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
            </nav>
          </div>
        </footer>
      </div>
    </MotionProvider>
  );
}
