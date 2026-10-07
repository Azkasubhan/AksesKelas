# AksesKelas

> **“Satu materi. Banyak cara memahami.”**  
> Platform penyampaian materi kelas dengan akses belajar inklusif yang dapat disesuaikan oleh siswa dan dikontrol oleh guru.

---

## 1. Persyaratan Sistem & Toolchain

- **Node.js**: v20+ LTS (teruji pada Node v25)
- **pnpm**: v12+
- **PostgreSQL**: v15+ lokal (berjalan di port `5432`)

---

## 2. Persiapan Database Lokal

Pastikan server PostgreSQL lokal aktif dan buat role serta database:

```bash
# Pastikan Postgres aktif (contoh macOS Homebrew):
LC_ALL=en_US.UTF-8 pg_ctl -D /opt/homebrew/var/postgresql@15 start

# Buat role dan database:
psql -d postgres -c "CREATE ROLE akseskelas LOGIN PASSWORD 'akseskelas_dev_local' CREATEDB;"
psql -d postgres -c "CREATE DATABASE akseskelas OWNER akseskelas;"
psql -d postgres -c "CREATE DATABASE akseskelas_test OWNER akseskelas;"
```

---

## 3. Konfigurasi Lingkungan (`.env`)

Salin file contoh konfigurasi:

```bash
cp .env.example .env
```

Pastikan variabel berikut telah terisi di `.env`:

```dotenv
DATABASE_URL=postgresql://akseskelas:akseskelas_dev_local@localhost:5432/akseskelas
CSRF_SECRET=kunci_rahasia_csrf_minimal_16_karakter
SEED_TEACHER_EMAIL=teacher@example.test
SEED_TEACHER_PASSWORD=KataSandiGuruMinimal12
SEED_STUDENT_EMAIL_DOMAIN=example.test
SEED_STUDENT_PASSWORD=KataSandiSiswaMinimal12
```

---

## 4. Migrasi & Seed Database

Jalankan migrasi tabel PostgreSQL dan data awal demo:

```bash
# Jalankan migrasi schema Drizzle:
pnpm db:migrate

# Jalankan data seed (idempotent):
pnpm db:seed
```

Perintah seed akan mendaftarkan:
- **Guru**: `teacher@example.test` (Bu Rani)
- **Siswa**: `raka@example.test`, `sinta@example.test`, `budi@example.test`
- **Kelas Demo**: **IPA VIII A** (dengan kode join otomatis berformat Crockford Base32)

---

## 5. Menjalankan Aplikasi

Jalankan server pengembangan:

```bash
pnpm dev
```

Buka peramban di: **[http://localhost:3000](http://localhost:3000)**

---

## 6. Pemeriksaan Kualitas & Pengujian

Semua gates kualitas kode dapat dijalankan dengan perintah berikut:

```bash
# Pemeriksaan linter ESLint:
pnpm lint

# Pemeriksaan tipe TypeScript:
pnpm typecheck

# Pengujian Unit & Integrasi PostgreSQL (Vitest):
pnpm test

# Build produksi Next.js (Turbopack):
pnpm build
```

---

## 7. Struktur Rute Aplikasi (Milestone 1)

| Rute Halaman | Deskripsi | Hak Akses |
|---|---|---|
| `/` | Landing page editorial dengan interaktif hero reader | Publik |
| `/demo` | Mode materi contoh (fixture read-only) | Publik |
| `/login` | Masuk akun email & kata sandi | Publik |
| `/signup` | Pendaftaran akun Guru / Siswa | Publik |
| `/guru` | Dasbor Guru: daftar kelas, buat kelas baru | Guru |
| `/guru/kelas/[classId]` | Detail kelas: tab materi, daftar siswa, rotasi kode join | Guru Pemilik |
| `/siswa` | Dasbor Siswa: daftar kelas yang diikuti | Siswa |
| `/siswa/bergabung` | Form bergabung ke kelas via kode join | Siswa |

### API Endpoints (`/api/v1`)
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET  /api/v1/auth/me`
- `GET  /api/v1/classes`
- `POST /api/v1/classes`
- `GET  /api/v1/classes/[classId]`
- `PATCH /api/v1/classes/[classId]`
- `POST /api/v1/classes/[classId]/rotate-code`
- `GET  /api/v1/classes/[classId]/members`
- `POST /api/v1/classes/join`
- `GET  /api/v1/health`
