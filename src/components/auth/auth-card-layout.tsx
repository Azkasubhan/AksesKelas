import * as React from "react";
import Image from "next/image";
import { AppHeader } from "@/components/layout/app-header";

interface AuthCardLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footerText: React.ReactNode;
}

export function AuthCardLayout({
  title,
  description,
  children,
  footerText,
}: AuthCardLayoutProps) {
  const containerWidthClass = "w-full max-w-md sm:max-w-[460px]";

  return (
    <div className="relative flex min-h-dvh flex-col bg-canvas text-ink">
      {/* Tekstur Halus Latar Belakang agar tidak kosong/bland */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,#000_30%,transparent_100%)] opacity-70"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-[380px] w-[640px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(33,41,34,0.05)_0%,transparent_70%)] blur-2xl"
        aria-hidden="true"
      />

      {/* Header Sama Persis dengan Homepage / Front Screen */}
      <AppHeader />

      {/* Konten Terpusat di Tengah Layar */}
      <main id="konten-utama" className="flex flex-1 items-center justify-center p-4 py-8 sm:p-8 sm:py-12">
        <div className={containerWidthClass}>
          {/* Card Pembungkus Form dengan Tinggi Proporsional & Elegan */}
          <div className="flex min-h-[530px] sm:min-h-[580px] flex-col justify-between rounded-2xl border border-line bg-surface p-8 sm:p-10 shadow-sm">
            <div>
              <div className="mb-6 sm:mb-7">
                <div className="mb-4">
                  <Image
                    src="/logo.png"
                    alt="AksesKelas"
                    width={480}
                    height={138}
                    priority
                    className="h-9 sm:h-10 w-auto object-contain"
                    style={{ width: "auto" }}
                  />
                </div>
                <h1 className="font-heading text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {description}
                </p>
              </div>

              {children}
            </div>

            <div className="mt-8 border-t border-line pt-6 text-center text-sm text-muted">
              {footerText}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
