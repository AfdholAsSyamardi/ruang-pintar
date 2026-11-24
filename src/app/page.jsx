import Link from "next/link";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import CourseCatalogClient from "@/components/CourseCatalogClient";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }) {
  const sp = await searchParams;
  const searchQuery = (sp?.q || "").trim();
  const categoryFilter = (sp?.category || "").trim();

  const user = await getCurrentUser();

  let categories = [];
  let popularCourses = [];
  let stats = { courses: 0, teachers: 0, students: 0, certificates: 0 };
  const enrolledObj = {};

  try {
    const catRes = await pool.query(
      "SELECT id, name FROM categories ORDER BY name ASC"
    );
    categories = catRes.rows;

    const statsRes = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM courses) AS courses,
        (SELECT COUNT(*)::int FROM users WHERE role = 'teacher') AS teachers,
        (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS students,
        (SELECT COUNT(*)::int FROM certificates) AS certificates
    `);
    stats = statsRes.rows[0] || stats;

    const coursesRes = await pool.query(
      `SELECT
        c.id,
        c.title,
        c.description,
        c.category_id,
        c.teacher_id,
        c.start_date,
        c.end_date,
        cat.name AS category_name,
        u.username AS teacher_name,
        u.email AS teacher_email,
        COUNT(DISTINCT e.id)::int AS student_count,
        COUNT(DISTINCT cc.id)::int AS content_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_contents cc ON cc.course_id = c.id
      GROUP BY c.id, cat.id, u.id
      ORDER BY student_count DESC, c.created_at DESC`
    );
    popularCourses = coursesRes.rows;

    if (user && user.role === "student") {
      const enrollRes = await pool.query(
        `SELECT
          e.course_id,
          COUNT(DISTINCT comp.content_id)::int AS completed_count
         FROM enrollments e
         LEFT JOIN completed_contents comp ON comp.enrollment_id = e.id
         WHERE e.student_id = $1
         GROUP BY e.course_id`,
        [user.id]
      );
      for (const row of enrollRes.rows) {
        enrolledObj[row.course_id] = row.completed_count;
      }
    }
  } catch (error) {
    console.error("Gagal memuat data beranda:", error);
  }

  return (
    <main className="flex-1 bg-white">
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Platform Belajar Fokus & Terstruktur
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Belajar Lebih Terarah di{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
                RuangPintar
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
              Temukan kursus pilihan dari pengajar terverifikasi, ikuti materi
              langkah demi langkah bebas distraksi, diskusikan bersama mentor,
              dan raih sertifikat digital terverifikasi.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                href="/courses"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all"
              >
                Jelajahi Semua Kursus →
              </Link>
              {user ? (
                <Link
                  href={user.role === "student" ? "/profile" : "/dashboard"}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-sm transition-all"
                >
                  {user.role === "student"
                    ? "Profil & Progres Saya"
                    : "Buka Dashboard CMS"}
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-sm transition-all"
                >
                  Daftar Akun Gratis
                </Link>
              )}
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: "Kursus Tersedia", value: stats.courses },
              { label: "Pengajar Aktif", value: stats.teachers },
              { label: "Siswa Belajar", value: stats.students },
              { label: "Sertifikat Terbit", value: stats.certificates },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white border border-emerald-100 rounded-2xl p-5 text-center shadow-xs"
              >
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {item.value}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Pilihan Siswa Terbaik
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              5 Course Terpopuler
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Cari materi yang Anda butuhkan atau filter berdasarkan kategori.
            </p>
          </div>
          <Link
            href="/courses"
            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Lihat Katalog Lengkap →
          </Link>
        </div>

        <CourseCatalogClient
          courses={popularCourses}
          categories={categories}
          user={user ? { id: user.id, role: user.role } : null}
          enrolledObj={enrolledObj}
          initialQuery={searchQuery}
          initialCategory={categoryFilter}
          isHomePopular
        />
      </section>

      <section className="bg-emerald-50/50 border-t border-emerald-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold mb-4">
              01
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              Antarmuka Clean White & Hijau
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Didesain minimalis tanpa distraksi agar siswa dapat fokus penuh
              memahami setiap bab materi pembelajaran.
            </p>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold mb-4">
              02
            </div>
            <h3 className="text-lg font-extrabold text-slate-900 mb-2">
              Pelacakan Progres & Diskusi
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Tandai materi selesai dengan tombol Mark as Done dan ajukan
              pertanyaan langsung di forum diskusi tiap materi.
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-extrabold mb-2">
                Sertifikat Digital Terverifikasi
              </h3>
              <p className="text-sm text-emerald-50 leading-relaxed mb-5">
                Selesaikan 100% materi dalam satu kursus untuk memperoleh
                sertifikat digital otomatis dengan kode unik anti-pemalsuan.
              </p>
            </div>
            <Link
              href="/certificates/verify"
              className="inline-block w-fit px-4 py-2.5 rounded-xl bg-white text-emerald-700 text-xs font-extrabold hover:bg-emerald-50 transition-colors"
            >
              Cek Keaslian Sertifikat →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
