DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS completed_contents CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS course_contents CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending')),
    approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NULL,
    end_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE course_contents (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

CREATE TABLE completed_contents (
    id SERIAL PRIMARY KEY,
    enrollment_id INTEGER NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    content_id INTEGER NOT NULL REFERENCES course_contents(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enrollment_id, content_id)
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content_id INTEGER NOT NULL REFERENCES course_contents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    certificate_code VARCHAR(100) UNIQUE NOT NULL,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

INSERT INTO users (id, username, email, password, role, status, approved_at) VALUES
(1, 'Admin RuangPintar', 'admin@ruangpintar.com', '$2b$10$HLvn9tCdVWHlISrh/rkGV.ziUofSorKE9yLqeEVyTzosK.ssPSayy', 'admin', 'active', NULL),
(2, 'Budi Santoso, S.Kom.', 'budi.santoso@ruangpintar.com', '$2b$10$ODA7VdEiJ9qvhQcAyAGi2upD8Uvg8JoYZGsmaWVRxZQlRq0UCzuaC', 'teacher', 'active', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(3, 'Siti Aminah, M.Pd.', 'siti.aminah@ruangpintar.com', '$2b$10$ODA7VdEiJ9qvhQcAyAGi2upD8Uvg8JoYZGsmaWVRxZQlRq0UCzuaC', 'teacher', 'active', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 'Dimas Wijaya', 'dimas.pending@ruangpintar.com', '$2b$10$ODA7VdEiJ9qvhQcAyAGi2upD8Uvg8JoYZGsmaWVRxZQlRq0UCzuaC', 'student', 'pending', NULL),
(5, 'Andi Pratama', 'andi.pratama@ruangpintar.com', '$2b$10$aDyLFaHHiGVJkfAwrRnjquhDzVirA1imFWLlJC7Abo422xBNq4kuq', 'student', 'active', NULL),
(6, 'Rina Lestari', 'rina.lestari@ruangpintar.com', '$2b$10$aDyLFaHHiGVJkfAwrRnjquhDzVirA1imFWLlJC7Abo422xBNq4kuq', 'student', 'active', NULL);

INSERT INTO categories (id, name) VALUES
(1, 'Web Development'),
(2, 'Data Science'),
(3, 'Teknologi & AI'),
(4, 'Matematika & Sains'),
(5, 'Bahasa Inggris'),
(6, 'UI/UX Design');

INSERT INTO courses (id, title, description, category_id, teacher_id, start_date, end_date) VALUES
(1, 'Full-Stack Next.js & PostgreSQL', 'Pelajari cara membangun aplikasi web modern full-stack menggunakan Next.js App Router, Tailwind CSS, Server Actions, dan Raw SQL PostgreSQL. Referensi resmi: https://nextjs.org/docs', 1, 2, '2026-11-01', '2026-12-31'),
(2, 'Dasar Python untuk Data Science', 'Kuasai fundamental pemrograman Python, manipulasi data tabular menggunakan Pandas, dan visualisasi data interaktif. Dokumentasi: https://docs.python.org/3/', 2, 3, NULL, NULL),
(3, 'Pengenalan Kecerdasan Buatan (AI)', 'Pahami konsep dasar Machine Learning, Neural Networks, serta etika dan penerapan Generative AI dalam pembelajaran modern. Referensi: https://ai.google/', 3, 2, NULL, NULL),
(4, 'Matematika Diskrit & Logika Komputasi', 'Fondasi logika matematika, himpunan, graf, dan kombinatorika yang wajib dikuasai calon programmer. Referensi: https://mathworld.wolfram.com/', 4, 3, '2026-10-15', '2026-12-20'),
(5, 'English for Tech & Presentation', 'Tingkatkan kepercayaan diri dalam membaca dokumentasi teknis, menulis email profesional, dan presentasi proyek teknologi. Referensi: https://developer.mozilla.org/en-US/', 5, 3, NULL, NULL),
(6, 'Fundamental UI/UX Design Modern', 'Belajar prinsip desain antarmuka yang bersih, pemilihan tipografi, hierarki visual, dan wireframe ramah pengguna. Referensi: https://tailwindcss.com/docs', 6, 2, '2026-11-10', '2026-12-15');

INSERT INTO course_contents (id, course_id, title, content, order_index) VALUES
(1, 1, 'Pengenalan App Router & Arsitektur Next.js', E'Next.js App Router memungkinkan kita membangun aplikasi web dengan File-System Routing di dalam folder src/app/.\n\nSecara bawaan, komponen adalah Server Component:\n- Server Component: Berjalan di server, aman untuk query database langsung.\n- Client Component: Menggunakan direktif "use client" untuk interaktivitas browser.\n\nVideo pembelajaran: https://www.youtube.com/watch?v=Sklc_fQBmcs\nReferensi lengkap: https://nextjs.org/docs/app', 1),
(2, 1, 'Koneksi PostgreSQL dengan Library pg (Raw SQL)', E'Kita menggunakan Pool dari library pg untuk mengeksekusi query SQL secara efisien tanpa ORM.\n\nContoh inisialisasi:\nconst pool = new Pool({ connectionString: process.env.DATABASE_URL });\n\nSelalu gunakan Parameterized Query ($1, $2) untuk mencegah SQL Injection.\n\nVideo pembelajaran: https://www.youtube.com/watch?v=4Z9KEBexzcM\nDokumentasi PostgreSQL: https://www.postgresql.org/docs/', 2),
(3, 1, 'Server Actions & Autentikasi Cookie', E'Server Actions ("use server") memudahkan operasi Create, Update, dan Delete langsung dari form HTML.\n\nUntuk keamanan rute privat seperti dashboard dan profile, sesi pengguna dienkripsi ke HTTP-Only Cookie dengan JWT dan diperiksa pada middleware.\n\nVideo pembelajaran: https://www.youtube.com/watch?v=O94ESaJtHtM\nPelajari lebih lanjut: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations', 3),
(4, 2, 'Sintaks Dasar Python & Tipe Data', E'Python dikenal dengan sintaksnya yang ringkas dan mudah dibaca. Pada bab ini kita mengenal tipe data list, tuple, dan dictionary.\n\nContoh kode:\nnilai_siswa = [85, 90, 78, 92]\nrata_rata = sum(nilai_siswa) / len(nilai_siswa)\n\nVideo pembelajaran: https://www.youtube.com/watch?v=x7X9w_GIm1s\nReferensi Python: https://docs.python.org/3/tutorial/', 1),
(5, 2, 'Mengolah Tabel Data dengan Pandas', E'Pandas menyediakan struktur DataFrame untuk membaca file CSV/Excel, filtering baris, dan agregasi statistik.\n\nMethod yang sering dipakai:\n- df.head() untuk melihat 5 baris pertama.\n- df.describe() untuk ringkasan statistik deskriptif.\n\nVideo pembelajaran: https://www.youtube.com/watch?v=vmEHCJofslg\nDokumentasi Pandas: https://pandas.pydata.org/docs/', 2),
(6, 3, 'Apa Itu Kecerdasan Buatan & Machine Learning?', E'Kecerdasan Buatan (AI) berfokus pada pembuatan sistem cerdas, sedangkan Machine Learning adalah sub-bidang AI di mana komputer belajar pola dari data.\n\nVideo pembelajaran: https://www.youtube.com/watch?v=PeMlggyqz0Y\nReferensi Machine Learning: https://scikit-learn.org/stable/', 1),
(7, 3, 'Etika Penggunaan AI di Lingkungan Pendidikan', E'Gunakan AI sebagai asisten belajar untuk memahami konsep sulit, bukan untuk menyalin mentah-mentah tugas tanpa pemahaman kritis.\n\nVideo pembelajaran: https://www.youtube.com/watch?v=G2fqAlgmoPo\nBaca panduan AI bertanggung jawab: https://ai.google/responsibility/', 2),
(8, 4, 'Logika Proposisi, Himpunan, & Teori Graf', E'Pemrograman bergantung pada logika Boolean (AND, OR, NOT), operasi himpunan yang berkaitan erat dengan JOIN pada SQL, serta graf untuk memodelkan relasi jaringan.\n\nVideo pembelajaran: https://www.youtube.com/watch?v=09_LlHjoEiY\nSumber belajar matematika: https://mathworld.wolfram.com/', 1),
(9, 5, 'Membaca Dokumentasi Teknis & Presentasi Proyek', E'Mulailah presentasi proyek dengan latar belakang masalah, demonstrasi alur pengguna (Student, Teacher, Admin), dan jawab sesi Q&A dengan pola Point - Reason - Example.\n\nVideo pembelajaran: https://www.youtube.com/watch?v=Unzc731iCUY\nLatihan membaca dokumentasi web: https://developer.mozilla.org/en-US/', 1),
(10, 6, 'Prinsip Desain Clean White & Hierarki Visual', E'Penggunaan latar putih bersih dan aksen warna hijau tenang membantu siswa mempertahankan fokus lebih lama saat membaca materi teks yang panjang.\n\nVideo pembelajaran: https://www.youtube.com/watch?v=mr15Xzb1Ook\nReferensi styling Tailwind CSS: https://tailwindcss.com/docs', 1);

INSERT INTO enrollments (id, student_id, course_id) VALUES
(1, 5, 1),
(2, 6, 1),
(3, 4, 1),
(4, 5, 2),
(5, 6, 2),
(6, 5, 3),
(7, 4, 3),
(8, 6, 4),
(9, 6, 6);

INSERT INTO completed_contents (id, enrollment_id, content_id) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 3),
(4, 4, 4),
(5, 6, 6),
(6, 2, 1),
(7, 2, 2);

INSERT INTO comments (id, content_id, user_id, comment_text) VALUES
(1, 1, 5, 'Penjelasan perbedaan Server Component dan Client Component di bab ini sangat membantu, Pak!'),
(2, 1, 2, 'Sama-sama Andi! Jangan lupa coba praktikkan langsung di proyek masing-masing ya.'),
(3, 2, 6, 'Pak Budi, apakah parameter $1 dan $2 wajib selalu berbentuk array saat memanggil pool.query?'),
(4, 2, 2, 'Betul Rina, argumen kedua pool.query selalu berupa array sesuai urutan $1, $2, dan seterusnya.'),
(5, 4, 5, 'Ibu Siti, apakah contoh latihan list comprehension akan dibahas di materi selanjutnya?');

INSERT INTO certificates (id, certificate_code, student_id, course_id) VALUES
(1, 'RP-2026-C01-U05-8F4A2B', 5, 1);

SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('categories', 'id'), COALESCE((SELECT MAX(id) FROM categories), 1));
SELECT setval(pg_get_serial_sequence('courses', 'id'), COALESCE((SELECT MAX(id) FROM courses), 1));
SELECT setval(pg_get_serial_sequence('course_contents', 'id'), COALESCE((SELECT MAX(id) FROM course_contents), 1));
SELECT setval(pg_get_serial_sequence('enrollments', 'id'), COALESCE((SELECT MAX(id) FROM enrollments), 1));
SELECT setval(pg_get_serial_sequence('completed_contents', 'id'), COALESCE((SELECT MAX(id) FROM completed_contents), 1));
SELECT setval(pg_get_serial_sequence('comments', 'id'), COALESCE((SELECT MAX(id) FROM comments), 1));
SELECT setval(pg_get_serial_sequence('certificates', 'id'), COALESCE((SELECT MAX(id) FROM certificates), 1));
