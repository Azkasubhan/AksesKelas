<br>
<div align="center">
  <img
    src="public/AksesKelas_GitHub_Banner.png"
    alt="AksesKelas Banner"
    style="width:100%; max-width:960px; border-radius:14px; box-shadow: 0 8px 30px rgba(0,0,0,0.08);"
  />
</div>
<br>

> 📚 **Prinsip Human-in-the-Loop & Aksesibilitas**: AksesKelas adalah platform penyampaian materi belajar adaptif berbasis AI di mana **guru memegang kendali editorial penuh**. AI bertindak sebagai asisten penyusun draf adaptasi multi-modal, dan setiap adaptasi wajib ditinjau serta disetujui oleh guru sebelum sampai ke tangan siswa.

---

## Apa itu AksesKelas?

**AksesKelas** adalah platform penyampaian materi belajar inklusif yang dirancang untuk mengatasi kesenjangan aksesibilitas di ruang kelas Indonesia. Di setiap sekolah, terdapat keberagaman profil belajar siswa—mulai dari siswa dengan disleksia, kesulitan pemrosesan bacaan (*reading fatigue*), hambatan perhatian (ADHD), *low vision*, hingga perbedaan kecepatan pemahaman kognitif.

Secara konvensional, guru tidak memiliki cukup waktu untuk menyusun 3 hingga 4 versi materi yang berbeda untuk satu topik pelajaran. **AksesKelas menyelesaikan masalah ini**:

> **“Satu materi. Banyak cara memahami.”**

Guru cukup mengunggah **1 dokumen sumber** (berkas PDF buku ajar atau teks langsung). Mesin AI adaptif AksesKelas secara otomatis menganalisis struktur materi dan memecahnya ke dalam format pembelajaran multi-modal yang telah tervalidasi secara pedagogis, sementara siswa bebas memilih cara belajar terbaik sesuai profil kognitif masing-masing.

---

## Alur Pengguna Utama (*Core User Flows*)

```
Guru:
  Masuk Akun → Buat / Buka Kelas → Unggah Dokumen (PDF/Teks) → Auto-Detect Judul & Mapel 
  → Pratinjau Blok Sumber Teks → AI Menyusun Draf Multi-Modal → Guru Review & Sunting
  → Setujui Setiap Bagian → Terbitkan ke Siswa

Siswa:
  Daftar / Masuk → Masukkan Kode Kelas (12 Karakter Crockford Base32) → Buka Ruang Kelas 
  → Pilih Materi → Sesuaikan Reader (Standar / Kartu Fokus / Easy Read / Glosarium) 
  → Dengar Audio (Bilingual TTS) → Atur Font (Atkinson Hyperlegible) & Tema (Sepia/Kontras)

AI & Heuristic Engine:
  Unggah PDF (In-Memory Buffer) → Ekstraksi Teks (unpdf) → Eliminasi Running Header/Footer 
  → Chunking Blok Sumber → Gemini 2.5 Flash / Flash-Lite API 
  → [Fallback Bertingkat: Retry Backoff → Model Candidates → Deterministic Rule-Based Heuristic] 
  → Validasi Skema JSON Terstruktur → Draf Siap Ditinjau Guru
```

---

## Fitur Unggulan (*Key Features*)

- **🤖 AI Multi-Modal Adaptation Engine**  
  Mengubah materi ajar tebal menjadi beberapa modalitas belajar adaptif dalam hitungan detik menggunakan Google Gemini Flash AI yang dikombinasikan dengan *deterministic rule-based fallback*.
- **📑 3 Modalitas Membaca Terpersonalisasi**  
  - **Teks Standar (*Standard View*)**: Untuk siswa yang nyaman dengan alur bacaan naratif konvensional.
  - **Bahasa Sederhana (*Easy Read*)**: Mengurai kalimat majemuk panjang menjadi 2–5 kalimat inti yang jernih dan ramah pemula tanpa memangkas konsep kunci.
  - **Kartu Fokus Interaktif (*Focus Cards Carousel*)**: Memecah materi menjadi kartu konsep mandiri dengan visualisasi *bite-sized* untuk mencegah kelelahan kognitif.
- **📖 Glosarium Kontekstual Otomatis**  
  Mendeteksi istilah ilmiah dan terminologi sulit secara langsung dari teks sumber beserta definisinya.
- **👩‍🏫 Kendali Penuh Guru (*Human-in-the-Loop*)**  
  Guru memiliki wewenang penuh menyunting teks kartu, memodifikasi glosarium, dan menyetujui setiap bagian secara granular sebelum materi dapat diterbitkan.
- **👁️ Workspace Reader Ramah Disleksia & Neurodivergen**  
  Dilengkapi tipografi khusus **Atkinson Hyperlegible** (dikembangkan oleh Braille Institute untuk membedakan bentuk huruf yang mirip), slider ukuran huruf, *line-height* dinamis, serta mode tema ramah mata (**Light**, **Sepia anti-silau**, dan **High Contrast** untuk *low vision*).
- **🔊 Bilingual Text-to-Speech (TTS) Bawaan**  
  Mendengarkan materi dengan suara alami melalui Web Speech API. Dilengkapi deteksi otomatis bahasa Indonesia vs Inggris, tombol jeda/lanjut, dan pengaturan tempo kecepatan bicara (0.75x – 1.5x).
- **🔒 Akses Kelas Tanpa Hambatan (*Crockford Base32 Join Code*)**  
  Menggunakan generator kode kelas 12 karakter berbasis kriptografi CSPRNG yang menghilangkan karakter ambigu (`I`, `L`, `O`, `U`) sehingga siswa tidak akan salah membaca angka `1` vs huruf `I` atau angka `0` vs huruf `O`.
- **🛡️ Arsitektur Berdaya Tahan Tinggi (*Zero-Downtime Multi-Tier Fallback*)**  
  Jika layanan AI eksternal sedang mengalami lonjakan beban (*rate limit* 429 atau 503), sistem secara otomatis beralih ke aturan heuristik berbasis pemrosesan teks lokal (*rule-based heuristic*) sehingga materi tetap berhasil disusun.

---

## Tech Stack

| Lapisan | Teknologi | Keterangan |
|---|---|---|
| **Framework Web** | Next.js 16 (App Router + Turbopack) | Server Components & Client Components |
| **Bahasa Pemrograman** | TypeScript 5 (Strict Mode) | Keamanan tipe penuh dari database hingga UI |
| **Tampilan & Desain** | Tailwind CSS v4 + Vanilla CSS Tokens | Desain sistem aksesibilitas WCAG AAA |
| **Komponen Primitif** | Radix UI Primitives + Lucide Icons | Komponen headless yang ramah pembaca layar (a11y) |
| **Shader & Visual** | Three.js + ShaderGradient | Elemen visual modern yang tenang dan tidak distraksi |
| **Mesin AI & LLM** | Google Gemini 2.5 Flash / Flash-Lite (`@google/genai`) | Ekstraksi terstruktur berbasis JSON Schema |
| **Rule-Based Engine** | Deterministic Heuristic Regex NLP | Fallback offline bebas halusinasi berbasis teks sumber |
| **Ekstraksi Dokumen** | `unpdf` | Pemrosesan stream berkas PDF secara in-memory |
| **Audio Sintesis** | Web Speech API (SpeechSynthesis) | TTS native tanpa dependensi API audio berbayar |
| **Database & ORM** | PostgreSQL 15+ & Drizzle ORM | Database relasional dengan pooling koneksi SSL |
| **Keamanan & Autentikasi** | Cookie Sesi HTTP-Only + Scrypt + CSRF Double-Submit | Proteksi brute-force, CSRF, dan enkripsi kata sandi aman |
| **Pengujian Kualitas** | Vitest | 14 test suite (78 integration & unit tests) |

---

## Arsitektur Sistem (*System Architecture Overview*)

<br>
<div align="center">
  <img
    src="public/system-architecture.png"
    alt="Arsitektur Sistem AksesKelas"
    style="width:100%; max-width:960px; border-radius:12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);"
  />
</div>
<br>

---

## Struktur Folder Proyek (*Folder Structure*)

```
AksesKelas/
├── drizzle/                   # File migrasi SQL Drizzle
├── public/                    # Aset statis publik (logo, foto profil tim, ikon)
├── scripts/
│   ├── migrate.ts             # Skrip migrasi schema database ke PostgreSQL
│   └── seed.ts                # Skrip pembuat data demo awal (guru, murid, kelas)
├── src/
│   ├── app/                   # Rute halaman Next.js App Router
│   │   ├── (auth)/            # Halaman autentikasi (/login, /signup)
│   │   ├── (student)/         # Dasbor siswa (/siswa, /siswa/kelas, /siswa/bergabung)
│   │   ├── (teacher)/         # Dasbor guru (/guru, /guru/kelas, /guru/materi)
│   │   ├── api/v1/            # API Route Handlers RESTful
│   │   ├── globals.css        # Konfigurasi Tailwind & Utility CSS
│   │   └── page.tsx           # Landing page editorial interaktif
│   ├── components/            # Komponen antarmuka (UI)
│   │   ├── auth/              # Form login dan registrasi
│   │   ├── layout/            # Navbar, header, shell dashboard
│   │   ├── marketing/         # Komponen landing page & shader background
│   │   ├── reader/            # Focus card carousel, mode bacaan adaptif
│   │   ├── teacher/           # Modal hapus, indikator proses AI, editor materi
│   │   └── ui/                # Primitif tombol, modal, input, dropdown, toast
│   ├── lib/                   # Utilitas sisi klien (api-client, speech/TTS)
│   ├── server/                # Logika server aman (server-only)
│   │   ├── ai/                # Adapter Gemini AI & penanganan fallback model
│   │   ├── auth/              # Hashing kata sandi, manajemen sesi, verifikasi peran
│   │   ├── db/                # Klien Drizzle ORM, pooling PostgreSQL, & skema tabel
│   │   ├── extraction/        # Ekstraksi PDF (unpdf) & rule-based heuristic
│   │   ├── services/          # Layanan bisnis (classes, materials, drafts, progress)
│   │   ├── env.ts             # Validasi variabel lingkungan berbasis Zod
│   │   └── errors.ts          # Penanganan galat standar RFC-7807
│   ├── shared/                # Skema dan utilitas yang dipakai klien & server
│   │   ├── join-codes.ts      # Generator kode acak Crockford Base32
│   │   ├── schemas/           # Skema validasi Zod (auth, classes, drafts, reader)
│   │   └── utils/             # Heuristik pendeteksi judul & mata pelajaran
│   └── styles/                # Token desain CSS (warna, kontras, reader sepia)
├── tests/                     # Test suite Vitest
│   ├── integration/           # Uji alur database, pipeline AI, & otorisasi
│   └── unit/                  # Uji unit parser, kode join, speech, & validator
├── AksesKelas_PRD.md          # Dokumen spesifikasi produk & teknis lengkap
├── drizzle.config.ts          # Konfigurasi Drizzle Kit
├── next.config.ts             # Konfigurasi build Next.js
├── package.json               # Dependensi & skrip eksekusi
└── vitest.config.ts           # Konfigurasi pengujian Vitest
```

---

## Panduan Menjalankan Aplikasi (*How to Run*)

### Prasyarat Sistem
- **Node.js**: v20+ LTS
- **pnpm**: v9+ atau v12+
- **PostgreSQL**: v15+ (lokal atau cloud seperti Neon/Supabase)

---

### 1. Kloning Repositori & Instalasi Dependensi

```bash
git clone https://github.com/Azkasubhan/AksesKelas.git
cd AksesKelas
pnpm install
```

### 2. Konfigurasi Lingkungan (`.env`)

Salin file template `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Sesuaikan nilai variabel di dalam file `.env`:

```dotenv
NODE_ENV=development
APP_URL=http://localhost:3000

# PostgreSQL (lokal atau Neon/Supabase)
DATABASE_URL=postgresql://akseskelas:password@localhost:5432/akseskelas
DB_POOL_MAX=5
TRUST_PROXY=false

# Konfigurasi AI (gunakan 'fixture' untuk uji coba offline atau 'live' untuk Gemini API)
AI_MODE=live
GEMINI_API_KEY=AIzaSy...your_gemini_api_key...
GEMINI_MODEL=gemini-flash-lite-latest

# Keamanan Sesi & CSRF
CSRF_SECRET=kunci_rahasia_acak_minimal_16_karakter
SESSION_TTL_DAYS=7
NEXT_PUBLIC_ENABLE_DEMO=true
```

### 3. Migrasi & Pengisian Data Awal Database

Pastikan PostgreSQL Anda sudah aktif, kemudian jalankan migrasi tabel dan seeding data demo:

```bash
# 1. Jalankan migrasi schema Drizzle:
pnpm db:migrate

# 2. Isi akun demo awal guru & siswa (idempotent):
pnpm db:seed
```

Data akun demo yang siap digunakan:
- **Akun Guru**: `teacher@example.test` (Kata sandi: sesuai `SEED_TEACHER_PASSWORD` di `.env`, default: `KataSandiGuruMinimal12`)
- **Akun Siswa**: `raka@example.test`, `sinta@example.test` (Kata sandi: sesuai `SEED_STUDENT_PASSWORD`, default: `KataSandiSiswaMinimal12`)

### 4. Menjalankan Server Pengembangan

```bash
pnpm dev
```

Buka peramban di **[http://localhost:3000](http://localhost:3000)**.

---

## Pengujian Kualitas Kode (*Quality Gates*)

Proyek ini dilengkapi dengan serangkaian pengujian otomatis yang ketat:

```bash
# Menjalankan seluruh pengujian unit & integrasi (Vitest):
pnpm test

# Pemeriksaan kepatuhan tipe TypeScript:
pnpm typecheck

# Menguji build produksi Next.js:
pnpm build
```

---

## Cara Kerja Mesin Adaptasi AI (*How the AI Engine Works*)

Ketika guru mengunggah materi ajar (berkas PDF atau teks input):

1. **In-Memory Text Extraction (`unpdf`)**  
   File PDF dibaca langsung secara streaming dalam memori (tanpa menyimpan file mentah di disk), membersihkan nomor halaman ganda dan *running header/footer*.
2. **Tahap 1: Pengelompokan Logis (*Structure Stage*)**  
   Menganalisis panjang dan struktur bacaan, lalu membaginya menjadi 1 hingga 4 bagian materi yang seimbang agar tidak membebani kognisi siswa.
3. **Tahap 2: Adaptasi Multi-Modal (*Section Adaptation*)**  
   Untuk setiap bagian, Gemini Flash menghasilkan 3 artefak belajar:
   - **Easy Read**: Menyederhanakan kalimat ke dalam bahasa yang mudah dicerna.
   - **Focus Cards**: Membuat kartu-kartu konsep dengan judul ringkas, teks asli, dan teks sederhana, diakhiri dengan kartu rekapitulasi (*recap card*).
   - **Glosarium**: Mengidentifikasi istilah kunci dan membuat definisi yang jelas.
4. **Strategi Fallback Heuristik Bertingkat (*Multi-Tier Fallback*)**  
   - Jika Gemini API mengembalikan kode transien 503 / 429, sistem otomatis melakukan jeda cerdas (*exponential backoff*) dan mencoba model alternatif (`gemini-3.5-flash-lite`, `gemini-3.5-flash`).
   - Jika koneksi offline atau kuota habis, modul `adaptation-fixture.ts` langsung mengambil alih dengan **Rule-Based Heuristic**:
     - *Chunking* proporsional berbasis batas kalimat `/(?<=[.!?])\s+/`.
     - Filter panjang kalimat ramah kognitif (15–180 karakter).
     - Deteksi glosarium otomatis via pencocokan pola regex tata bahasa Indonesia (*Colon Pattern* `X: Y` dan *Copula Pattern* `X adalah/merupakan Y`).

---

## Daftar Variabel Lingkungan (*Environment Variables*)

| Variabel | Wajib | Nilai Contoh | Keterangan |
|---|---|---|---|
| `DATABASE_URL` | Ya | `postgresql://user:pass@localhost:5432/akseskelas` | Connection string PostgreSQL (lokal/cloud) |
| `APP_URL` | Ya | `http://localhost:3000` atau `https://akseskelas.vercel.app` | URL domain aplikasi (wajib `https://` di produksi) |
| `CSRF_SECRET` | Ya | `kunci_rahasia_minimal_16_karakter` | Secret key untuk validasi token CSRF |
| `AI_MODE` | Ya | `live` atau `fixture` | Gunakan `live` untuk Gemini API, atau `fixture` untuk mode offline |
| `GEMINI_API_KEY` | Kondisional | `AIzaSy...` | API Key Google Gemini (wajib jika `AI_MODE=live`) |
| `GEMINI_MODEL` | Kondisional | `gemini-flash-lite-latest` | Model LLM yang digunakan (wajib jika `AI_MODE=live`) |
| `DB_POOL_MAX` | Tidak | `5` | Jumlah maksimal koneksi database pool |
| `TRUST_PROXY` | Tidak | `true` / `false` | Set `true` bila di-deploy di Vercel / reverse proxy |
| `SESSION_TTL_DAYS` | Tidak | `7` | Durasi masa aktif cookie autentikasi (hari) |
| `NEXT_PUBLIC_ENABLE_DEMO`| Tidak | `true` | Menampilkan shortcut login cepat pada demo |

---

## Etika & Prinsip Aksesibilitas

> AksesKelas berpegang teguh pada prinsip **Pendidikan untuk Semua (*Education for All*)**.
> - **Anti-Halusinasi**: Seluruh adaptasi AI ditautkan langsung ke blok sumber aslinya (*source reference mapping*), memastikan kebenaran ilmiah materi kurikulum tetap terjaga.
> - **Kedaulatan Guru**: Guru adalah pengambil keputusan final dalam kurikulum. AI hanya menyajikan draf pembantu untuk memangkas waktu kerja guru dari berjam-jam menjadi beberapa detik.
> - **Privasi Data**: Tidak ada data pribadi sensitif siswa yang dikirimkan ke model AI publik.

---

<br>
<div align="left">
  <h2>Meet the Team</h2>
  <p>Inovator di balik AksesKelas</p>
</div>

| <a href="#"><img width="160" src="public/Muhammad%20Azka%20Subhan.png" alt="Muhammad Azka Subhan" style="border-radius: 8px;"/></a> | <a href="#"><img width="160" src="public/Calista%20Sahla.png" alt="Calista Sahla" style="border-radius: 8px;"/></a> |
| :---: | :---: |
| <div align="center"><h3><b>Muhammad Azka Subhan</b></h3></div> | <div align="center"><h3><b>Calista Sahla</b></h3></div> |
