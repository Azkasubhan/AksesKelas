"use client";

import * as React from "react";
import { FocusCardReader, type FocusCardItem } from "@/components/reader/focus-card-reader";

const SAMPLE_CARDS: FocusCardItem[] = [
  {
    id: "card_1",
    kind: "concept",
    title: "1. Makanan Masuk ke Lambung",
    keyTerm: "Bolus Makanan",
    originalText:
      "Setelah dikunyah di rongga mulut, bolus makanan didorong oleh gerak peristaltik kerongkongan menuju lambung melalui sfingter esofagus bagian bawah.",
    easyText:
      "Makanan yang sudah dikunyah ditelan lewat kerongkongan, lalu masuk ke dalam lambung melalui pintu berotot.",
    sourceRef: "Buku IPA VIII · Bab 4 · Hal. 14",
  },
  {
    id: "card_2",
    kind: "concept",
    title: "2. Pengadukan & Asam Lambung",
    keyTerm: "Asam Klorida (HCl)",
    originalText:
      "Dinding lambung berkontraksi secara ritmis meremas makanan dan mencampurnya dengan asam lambung (HCl) berkonsentrasi tinggi untuk membunuh patogen serta mengaktifkan pepsinogen.",
    easyText:
      "Otot lambung meremas makanan sambil menyiramnya dengan cairan asam kuat agar kuman mati dan enzim pencerna mulai bekerja.",
    sourceRef: "Buku IPA VIII · Bab 4 · Hal. 15",
  },
  {
    id: "card_3",
    kind: "recap",
    title: "3. Inti Pemahaman Lambung",
    keyTerm: "Kimus (Chyme)",
    originalText:
      "Secara simultan terjadi pencernaan mekanik oleh gerakan dinding otot dan pencernaan kimiawi oleh pepsin, menghasilkan bubur kimus sebelum dialirkan bertahap ke pilorus usus halus.",
    easyText:
      "Di dalam lambung, makanan diaduk dan diurai sampai menjadi bubur lembut sebelum siap diteruskan ke usus halus.",
    sourceRef: "Buku IPA VIII · Bab 4 · Hal. 15–16",
  },
];

export function HeroInteractiveReader() {
  return (
    <div className="w-full">
      <div className="mb-2.5 flex items-center justify-between px-1 text-xs text-muted">
        <span className="font-semibold uppercase tracking-wider text-ink">
          Pratinjau Pengalaman Membaca
        </span>
        <span className="text-[11.5px]">Materi IPA Terpadu Kelas VIII</span>
      </div>
      <FocusCardReader cards={SAMPLE_CARDS} defaultEasyRead={true} />
    </div>
  );
}
