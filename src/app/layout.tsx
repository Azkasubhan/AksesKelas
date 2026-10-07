import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Inter } from "next/font/google";
import "./globals.css";

const headingFont = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["500", "600", "700"],
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "AksesKelas — Satu Materi. Banyak Cara Memahami.",
    template: "%s · AksesKelas",
  },
  description:
    "Platform penyampaian materi kelas dengan akses belajar inklusif yang dapat disesuaikan oleh siswa dan dikontrol penuh oleh guru.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8f8f5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sansFont.variable} ${headingFont.variable}`}>
      <body className="min-h-dvh flex flex-col font-sans antialiased text-ink bg-canvas selection:bg-primary-subtle selection:text-ink">
        <a
          href="#konten-utama"
          className="sr-only z-[100] rounded-btn bg-primary px-4 py-3 text-sm font-medium text-on-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
