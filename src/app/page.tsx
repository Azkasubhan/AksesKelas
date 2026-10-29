import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentSession } from "@/server/auth/session";
import { AppHeader } from "@/components/layout/app-header";
import { HeroSky } from "@/components/marketing/hero-sky";
import { HeroHeadline } from "@/components/marketing/hero-headline";
import { ProductStage } from "@/components/marketing/product-stage";
import { TeacherFlow } from "@/components/marketing/teacher-flow";
import { ClosingBanner } from "@/components/marketing/closing-banner";
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
          {/* Hero dengan motion graphic awan berlayang */}
          <section className="relative flex min-h-[600px] sm:min-h-[680px] flex-col items-center justify-start px-5 pt-16 pb-24 text-center sm:px-8 sm:pt-24 sm:pb-32 lg:pt-28 lg:pb-36">
            <HeroSky />

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
                        className="h-12 px-7 text-base font-medium text-ink bg-white/70 hover:bg-white/90 border border-white/80 shadow-xs backdrop-blur-md rounded-btn transition-all duration-150"
                        asChild
                      >
                        <Link href="/login">Masuk sebagai Guru</Link>
                      </Button>
                    </>
                  )}
                </div>
              </Reveal>
            </div>
          </section>

          <ProductStage />
          <TeacherFlow />

          <ClosingBanner />
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
