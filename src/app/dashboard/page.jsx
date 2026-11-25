import Link from "next/link";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import WelcomeTeacherModal from "@/components/WelcomeTeacherModal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const showWelcomeTeacher = Boolean(user.is_new_teacher);
  const approvedAtFormatted = user.approved_at
    ? new Date(user.approved_at).toLocaleString("id-ID")
    : "";

  let adminStats = null;
  let teacherCourses = [];
  let studentCourses = [];

  if (user.role === "admin") {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE status = 'pending') AS pending_teachers,
        (SELECT COUNT(*)::int FROM categories) AS total_categories,
        (SELECT COUNT(*)::int FROM courses) AS total_courses,
        (SELECT COUNT(*)::int FROM certificates) AS total_certificates
    `);
    adminStats = rows[0];
  }

  if (user.role === "teacher") {
    const { rows } = await pool.query(
      `SELECT
        c.id,
        c.title,
        cat.name AS category_name,
        COUNT(DISTINCT mat.id)::int AS content_count,
        COUNT(DISTINCT e.id)::int AS student_count
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN course_contents mat ON mat.course_id = c.id
       LEFT JOIN enrollments e ON e.course_id = c.id
       WHERE c.teacher_id = $1
       GROUP BY c.id, cat.id
       ORDER BY c.created_at DESC`,
      [user.id]
    );
    teacherCourses = rows;
  }

  if (user.role === "student") {
    const { rows: enrolledRows } = await pool.query(
      `SELECT
        c.id,
        c.title,
        cat.name AS category_name,
        COUNT(DISTINCT mat.id)::int AS total_contents,
        COUNT(DISTINCT comp.content_id)::int AS completed_contents,
        cert.certificate_code
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN course_contents mat ON mat.course_id = c.id
       LEFT JOIN completed_contents comp ON comp.enrollment_id = e.id
       LEFT JOIN certificates cert ON cert.student_id = e.student_id AND cert.course_id = c.id
       WHERE e.student_id = $1
       GROUP BY c.id, cat.id, cert.certificate_code, e.enrolled_at
       ORDER BY e.enrolled_at DESC`,
      [user.id]
    );
    studentCourses = enrolledRows;
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Dashboard RuangPintar
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Halo, {user.username}!
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Kelola aktivitas Anda sesuai peran{" "}
          <span className="font-bold uppercase text-emerald-700">
            {user.role}
          </span>
          .
        </p>
      </div>

      {showWelcomeTeacher && (
        <WelcomeTeacherModal
          userId={user.id}
          username={user.username}
          approvedAt={user.approved_at ? new Date(user.approved_at).toISOString() : ""}
          approvedAtFormatted={approvedAtFormatted}
        />
      )}

      {user.role === "student" && user.status === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <span className="px-2.5 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold uppercase shrink-0">
            Pending
          </span>
          <div>
            <h2 className="text-base font-extrabold text-amber-950">
              Akun Pengajar Anda sedang menunggu verifikasi Admin
            </h2>
            <p className="text-sm text-amber-800 mt-0.5">
              Anda tetap dapat mengakses fitur Student sambil menunggu Admin
              menyetujui status pengajar Anda.
            </p>
          </div>
        </div>
      )}

      {user.role === "admin" && adminStats && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Pengguna", val: adminStats.total_users, href: "/dashboard/users" },
              { label: "Guru Pending", val: adminStats.pending_teachers, href: "/dashboard/users", highlight: adminStats.pending_teachers > 0 },
              { label: "Total Kategori", val: adminStats.total_categories, href: "/dashboard/categories" },
              { label: "Total Kursus", val: adminStats.total_courses, href: "/dashboard/courses" },
              { label: "Sertifikat Terbit", val: adminStats.total_certificates, href: "/certificates/verify" },
            ].map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className={`rounded-2xl p-5 border transition-all shadow-xs ${
                  card.highlight
                    ? "bg-amber-50 border-amber-300"
                    : "bg-white border-emerald-100 hover:border-emerald-300"
                }`}
              >
                <p
                  className={`text-2xl font-extrabold ${
                    card.highlight ? "text-amber-700" : "text-emerald-600"
                  }`}
                >
                  {card.val}
                </p>
                <p className="text-xs font-bold text-slate-600 mt-1">
                  {card.label}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {user.role === "admin" && (
        <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
          <h2 className="text-lg font-extrabold text-slate-900 mb-1">
            Akses Cepat CMS Admin
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Kelola pengguna, verifikasi pengajar baru, kategori kursus, dan
            seluruh kelas di RuangPintar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/dashboard/users"
              className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/60 hover:bg-emerald-100/70 text-sm font-bold text-emerald-800"
            >
              User Management →
            </Link>
            <Link
              href="/dashboard/categories"
              className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/60 hover:bg-emerald-100/70 text-sm font-bold text-emerald-800"
            >
              Category Management →
            </Link>
            <Link
              href="/dashboard/courses"
              className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/60 hover:bg-emerald-100/70 text-sm font-bold text-emerald-800"
            >
              Course Management →
            </Link>
            <Link
              href="/certificates/verify"
              className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/60 hover:bg-emerald-100/70 text-sm font-bold text-emerald-800"
            >
              Cek Sertifikat →
            </Link>
          </div>
        </section>
      )}

      {user.role === "teacher" && (
        <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Kursus yang Anda Kelola ({teacherCourses.length})
              </h2>
              <p className="text-xs text-slate-500">
                Buat kelas baru atau perbarui materi pembelajaran.
              </p>
            </div>
            <Link
              href="/dashboard/courses"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              + Kelola Kursus
            </Link>
          </div>

          {teacherCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teacherCourses.map((c) => (
                <div
                  key={c.id}
                  className="border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700">
                      {c.category_name || "Umum"}
                    </span>
                    <h3 className="font-extrabold text-slate-900">
                      <Link
                        href={`/courses/${c.id}`}
                        className="hover:text-emerald-600 transition-colors"
                      >
                        {c.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {c.content_count} Materi • {c.student_count} Siswa
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    <Link
                      href={`/courses/${c.id}`}
                      className="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold"
                    >
                      Buka Kelas
                    </Link>
                    <Link
                      href={`/dashboard/courses/${c.id}/contents`}
                      className="px-3 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold"
                    >
                      Materi →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Anda belum membuat kelas. Klik &ldquo;+ Kelola Kursus&rdquo; untuk
              memulai.
            </p>
          )}
        </section>
      )}

      {user.role === "student" && (
        <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Progres Belajar Saya ({studentCourses.length})
            </h2>
            <p className="text-xs text-slate-500">
              Kursus yang sedang Anda ikuti beserta sertifikat yang telah diraih.
            </p>
          </div>
          <Link
            href="/courses"
            className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold"
          >
            Katalog Kursus →
          </Link>
        </div>

        {studentCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentCourses.map((c) => {
              const pct =
                c.total_contents > 0
                  ? Math.min(
                      100,
                      Math.round((c.completed_contents / c.total_contents) * 100)
                    )
                  : 0;
              return (
                <div
                  key={c.id}
                  className="border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700">
                      {c.category_name || "Umum"}
                    </span>
                    <h3 className="font-extrabold text-slate-900">{c.title}</h3>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-emerald-700 mb-1">
                      <span>
                        {c.completed_contents}/{c.total_contents} Materi
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/courses/${c.id}`}
                      className="flex-1 text-center py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Lanjutkan Belajar
                    </Link>
                    {c.certificate_code && (
                      <Link
                        href={`/certificates/${c.certificate_code}`}
                        className="py-2 px-3 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold"
                      >
                        Sertifikat
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Anda belum mengikuti kursus apa pun. Jelajahi katalog untuk mulai
            belajar!
          </p>
        )}
        </section>
      )}
    </div>
  );
}
