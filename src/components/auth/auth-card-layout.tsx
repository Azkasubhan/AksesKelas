import * as React from "react";
import Image from "next/image";
import { AppHeader } from "@/components/layout/app-header";
import { AuthSky } from "./auth-sky";

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
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-canvas text-ink">
      {/* Latar Belakang: Gradient Biru Bawah & Awan Meluncur Kanan-Kiri */}
      <AuthSky />

      {/* Header Sama Persis dengan Homepage / Front Screen */}
      <AppHeader />

      {/* Konten Terpusat di Tengah Layar */}
      <main id="konten-utama" className="relative z-10 flex flex-1 items-center justify-center p-4 py-8 sm:p-8 sm:py-12">
        <div className={containerWidthClass}>
          {/* Card Pembungkus Form dengan Tinggi Proporsional & Elegan */}
          <div className="flex min-h-[530px] sm:min-h-[580px] flex-col justify-between rounded-2xl border border-line bg-surface p-8 sm:p-10 shadow-[0_16px_40px_-16px_rgba(30,60,130,0.12)]">
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
