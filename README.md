# RuangPintar — Platform Kursus Daring Interaktif

**RuangPintar** adalah aplikasi Learning Management System (LMS) berbasis web untuk **Tugas Final Praktikum Pemrograman Web 2026 (Individual Project 4: Platform Kursus)**. Aplikasi ini dibangun secara full-stack menggunakan **Next.js (App Router, JSX)**, **Tailwind CSS**, dan **PostgreSQL** dengan query **Raw SQL** melalui library `pg` (tanpa ORM).

---

## Fitur Utama

### 1. Halaman Publik & Pengunjung
- **Beranda Responsif (`/`)**: Menampilkan pengenalan platform, ringkasan fitur, dan kursus populer yang dapat diakses di berbagai ukuran layar.
- **Katalog Kursus (`/courses`)**: Pencarian kursus berdasarkan kata kunci (`q` — judul, deskripsi, atau nama pengajar) serta filter berdasarkan kategori (`category`).
- **Detail Kursus & Daftar Materi (`/courses/[id]`)**: Informasi lengkap kursus, pengajar, periode pelaksanaan, daftar materi, serta pratinjau bagi pengunjung sebelum mendaftar.
- **Verifikasi Sertifikat Publik (`/certificates/verify`)**: Halaman publik untuk mengecek keaslian sertifikat berdasarkan kode sertifikat secara langsung melalui database.

### 2. Autentikasi & Otorisasi (RBAC)
- **Registrasi Akun (`/register`)**: Pengguna dapat mendaftar sebagai **Student** atau mengajukan diri sebagai **Teacher** (pendaftar Teacher otomatis masuk dengan `role = 'student'` dan `status = 'pending'` hingga diverifikasi oleh Admin).
- **Keamanan Kata Sandi & Sesi**: Password di-hash menggunakan `bcryptjs` dan sesi pengguna disimpan menggunakan **JWT (`jose`, HS256, masa berlaku 24 jam)** di dalam HTTP-Only Cookie bernama `ruangpintar_session`.
- **Proteksi Rute (`src/middleware.js`)**: Mengarahkan pengguna yang belum login ke `/login` saat mengakses `/dashboard/*` atau `/profile`, serta mengarahkan pengguna yang sudah login keluar dari `/login` dan `/register` sesuai perannya.

### 3. Peran Student (Siswa)
- **Enroll & Unenroll Kursus**: Mendaftar ke kursus dari katalog/detail kursus maupun membatalkan pendaftaran (*unenroll*) dari halaman profil.
- **Ruang Belajar Interaktif (`/courses/[id]`)**: Membaca materi berurutan (`order_index`) dengan **auto-embed video YouTube** otomatis ketika link YouTube dicantumkan di dalam isi materi.
- **Pelacakan Progres (*Mark as Done*)**: Menandai materi sebagai selesai dan melihat persentase progres belajar.
- **Forum Diskusi Materi**: Menambahkan komentar/pertanyaan pada setiap materi dan menghapus komentar milik sendiri.
- **Sertifikat Otomatis & Cetak (`/certificates/[code]`)**: Saat seluruh materi dalam suatu kursus selesai (100%), sistem otomatis menerbitkan kode sertifikat unik berformat `RP-YYYY-Cxx-Uxx-XXXXXX` yang dapat dilihat dan dicetak melalui halaman profil (`/profile`).

### 4. Peran Teacher (Pengajar)
- **Sambutan Pengajar Baru (`WelcomeTeacherModal`)**: Pengajar yang baru disetujui Admin (`approved_at` < 24 jam) akan menerima banner dan pop-up sambutan khusus di dashboard.
- **Dashboard CMS (`/dashboard`)**: Mengelola kursus milik sendiri (`/dashboard/courses`) termasuk pemilihan kategori dan rentang tanggal (`start_date` – `end_date`).
- **Manajemen Materi & Live Preview (`/dashboard/courses/[id]/contents`)**: Menambah, mengubah, mengurutkan (`order_index`), dan menghapus materi kursus lengkap dengan pratinjau langsung video YouTube (`ContentTextareaWithPreview`), serta berinteraksi di diskusi materi.

### 5. Peran Admin
- **Akses Penuh Dashboard CMS (`/dashboard`)**: Ringkasan statistik platform secara keseluruhan.
- **Manajemen Pengguna & Verifikasi Pengajar (`/dashboard/users`)**: CRUD akun pengguna serta menyetujui (*approve*) pendaftar dengan status `pending` menjadi `teacher` aktif.
- **Manajemen Kategori (`/dashboard/categories`)**: Menambah, mengedit, dan menghapus kategori kursus.
- **Manajemen Seluruh Kursus & Materi**: Mengelola seluruh kursus dan materi lintas pengajar, termasuk menugaskan pengajar pada kursus.
- **Moderasi Diskusi**: Menghapus komentar dari pengguna mana pun pada diskusi materi.

---

## Teknologi yang Digunakan

| Kategori | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework & UI** | Next.js 16 (App Router, JSX), React 19 | Routing, Server Components, Route Handlers, Server Actions |
| **Styling** | Tailwind CSS 4 | Desain UI responsif dan modern |
| **Database** | PostgreSQL & `pg` (Raw SQL) | Query SQL langsung dengan *Parameterized Queries* (`$1`, `$2`) |
| **Autentikasi** | `jose` & `bcryptjs` | JWT HS256 dalam HTTP-Only Cookie & hashing password |
| **Linting** | ESLint 9 (`eslint-config-next`) | Pemeriksaan kualitas kode |

---

## Struktur Proyek

```text
ruang-pintar/
├── schema.sql                  # Skema tabel & seed data PostgreSQL (di luar src/app)
├── package.json                # Daftar dependensi dan script NPM
├── next.config.mjs             # Konfigurasi Next.js
├── eslint.config.mjs           # Konfigurasi ESLint
├── jsconfig.json               # Path alias (@/*)
└── src/
    ├── middleware.js           # Proteksi rute privat (/dashboard, /profile) & redirect auth
    ├── lib/
    │   ├── db.js               # Pool koneksi PostgreSQL (pg)
    │   ├── session.js          # Enkripsi/dekripsi token JWT sesi
    │   ├── auth.js             # Helper mengambil data user yang sedang login
    │   └── youtube.js          # Ekstraksi ID video YouTube dari teks materi
    ├── components/             # Komponen UI reusable (Navbar, Footer, Sidebar, Modal, dll.)
    └── app/
        ├── layout.jsx          # Root layout & navigasi global
        ├── page.jsx            # Halaman beranda
        ├── actions.js          # Server Actions publik/siswa (enroll, markAsDone, komentar)
        ├── login/              # Halaman masuk
        ├── register/           # Halaman pendaftaran
        ├── profile/            # Halaman profil siswa, daftar kelas, & sertifikat
        ├── courses/            # Katalog kursus & ruang belajar ([id])
        ├── certificates/       # Tampilan cetak sertifikat ([code]) & verifikasi (/verify)
        ├── dashboard/          # CMS Admin & Teacher (actions.js, users, categories, courses, contents)
        └── api/                # REST API Route Handlers
            ├── register/route.js
            ├── login/route.js
            ├── logout/route.js
            ├── courses/route.js
            └── certificates/verify/route.js
```

---

## Skema Database PostgreSQL

Seluruh struktur tabel dan data awal (*seed*) didefinisikan di [`schema.sql`](schema.sql) dengan 8 tabel utama:

| Tabel | Fungsi |
| :--- | :--- |
| `users` | Data pengguna (`admin`, `teacher`, `student`), status (`active`, `pending`), dan `approved_at` |
| `categories` | Daftar kategori kursus yang unik |
| `courses` | Data kursus, relasi ke kategori dan pengajar (`teacher_id`), serta jadwal (`start_date`, `end_date`) |
| `course_contents` | Materi pembelajaran per kursus beserta urutan (`order_index`) |
| `enrollments` | Catatan pendaftaran siswa pada kursus (`UNIQUE(student_id, course_id)`) |
| `completed_contents` | Pelacakan materi yang telah diselesaikan siswa per enrollment |
| `comments` | Komentar diskusi pada setiap materi kursus |
| `certificates` | Sertifikat kelulusan siswa dengan kode unik `certificate_code` |

---

## API Route Handlers & Server Actions

### Route Handlers (`/api/*`)
| Method & Endpoint | Fungsi |
| :--- | :--- |
| `POST /api/register` | Mendaftarkan akun baru (Student atau pengajuan Teacher berstatus `pending`) |
| `POST /api/login` | Memverifikasi kredensial dan menyetel cookie JWT `ruangpintar_session` |
| `POST /api/logout` | Menghapus cookie sesi pengguna |
| `GET /api/courses` | Mengambil daftar kursus beserta jumlah siswa/materi dengan filter `?q=` dan `?category=` |
| `GET /api/certificates/verify` | Memverifikasi keaslian sertifikat berdasarkan parameter `?code=` |

### Server Actions
- **`src/app/actions.js`**: Menangani aksi siswa dan diskusi (`enrollCourse`, `unenrollCourse`, `markAsDone` termasuk penerbitan sertifikat otomatis saat progres 100%, `addComment`, dan `deleteComment`).
- **`src/app/dashboard/actions.js`**: Menangani operasi CMS Admin/Teacher (CRUD user, `approveTeacher`, CRUD kategori, CRUD kursus, dan CRUD materi kursus).

---

## Cara Menjalankan Proyek (Instalasi Lokal)

### Prasyarat
- **Node.js** (versi LTS) & **npm**
- **PostgreSQL** & **pgAdmin**

### 1. Clone Repository
```bash
git clone https://github.com/AfdholAsSyamardi/ruang-pintar.git
cd ruang-pintar
```

### 2. Setup Database PostgreSQL (pgAdmin)
1. Buka **pgAdmin** dan buat database baru bernama `ruang_pintar`.
2. Buka **Query Tool** pada database `ruang_pintar`.
3. Buka dan jalankan seluruh isi file `schema.sql` yang berada di root proyek (di luar folder `src/app`).

### 3. Konfigurasi Environment (`.env.local`)
Buat file `.env.local` di root proyek, lalu sesuaikan dengan kredensial PostgreSQL lokal Anda:
```env
DATABASE_URL=postgresql://postgres:<password_postgres>@localhost:5432/ruang_pintar
SESSION_SECRET=ganti-dengan-kunci-rahasia-jwt-anda
```
> **Catatan:** `DATABASE_URL` wajib diisi agar koneksi ke PostgreSQL berjalan. `SESSION_SECRET` bersifat opsional saat pengembangan lokal (tersedia nilai default di `src/lib/session.js`), namun disarankan tetap diatur untuk keamanan sesi JWT.

### 4. Install Dependensi & Jalankan Server
```bash
npm install
npm run dev
```
Buka **`http://localhost:3000`** di browser.

### Daftar Script NPM
| Script | Perintah | Fungsi |
| :--- | :--- | :--- |
| `npm run dev` | `next dev` | Menjalankan server pengembangan lokal |
| `npm run build` | `next build` | Mem-build aplikasi untuk produksi |
| `npm run start` | `next start` | Menjalankan hasil build produksi |
| `npm run lint` | `eslint` | Menjalankan pengecekan linter |

---

## Akun Demo & Pengujian Sertifikat (Seed `schema.sql`)

| Peran | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@ruangpintar.com` | `admin123` | Akses penuh CMS (Users, Categories, Courses, Contents, moderasi komentar) |
| **Teacher (Baru)** | `budi.santoso@ruangpintar.com` | `guru123` | Teacher terverifikasi (`approved_at` < 24 jam, memunculkan pop-up sambutan) |
| **Teacher (Lama)** | `siti.aminah@ruangpintar.com` | `guru123` | Teacher aktif |
| **Pending Teacher** | `dimas.pending@ruangpintar.com` | `guru123` | Mendaftar sebagai Teacher, masih berstatus `pending` menunggu verifikasi Admin |
| **Student** | `andi.pratama@ruangpintar.com` | `siswa123` | Sudah menyelesaikan 100% kursus #1 & memiliki sertifikat `RP-2026-C01-U05-8F4A2B` |
| **Student** | `rina.lestari@ruangpintar.com` | `siswa123` | Sedang mengikuti beberapa kursus |

Untuk menguji fitur **Verifikasi Sertifikat**, buka `/certificates/verify` dan masukkan kode **`RP-2026-C01-U05-8F4A2B`**.
