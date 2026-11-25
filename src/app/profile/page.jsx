import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import WelcomeTeacherModal from "@/components/WelcomeTeacherModal";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import { unenrollCourse } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const showWelcomeTeacher = Boolean(user.is_new_teacher);
  const approvedAtFormatted = user.approved_at
    ? new Date(user.approved_at).toLocaleString("id-ID")
    : "";

  let enrolledCourses = [];
  if (user.role === "student") {
    const { rows } = await pool.query(
      `SELECT
        c.id,
        c.title,
        cat.name AS category_name,
        t.username AS teacher_name,
        COUNT(DISTINCT mat.id)::int AS total_contents,
        COUNT(DISTINCT comp.content_id)::int AS completed_contents,
        cert.certificate_code
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN users t ON c.teacher_id = t.id
       LEFT JOIN course_contents mat ON mat.course_id = c.id
       LEFT JOIN completed_contents comp ON comp.enrollment_id = e.id
       LEFT JOIN certificates cert ON cert.student_id = e.student_id AND cert.course_id = c.id
       WHERE e.student_id = $1
       GROUP BY c.id, cat.id, t.id, cert.certificate_code, e.enrolled_at
       ORDER BY e.enrolled_at DESC`,
      [user.id]
    );
    enrolledCourses = rows;
  }

  let taughtCourses = [];
  if (user.role === "teacher") {
    const { rows: teacherCoursesRows } = await pool.query(
      `SELECT
        c.id,
        c.title,
        cat.name AS category_name,
        COUNT(DISTINCT mat.id)::int AS total_contents
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       LEFT JOIN course_contents mat ON mat.course_id = c.id
       WHERE c.teacher_id = $1
       GROUP BY c.id, cat.id
       ORDER BY c.created_at DESC`,
      [user.id]
    );

    const { rows: studentProgressRows } = await pool.query(
      `SELECT
        e.course_id,
        u.id AS student_id,
        u.username AS student_name,
        u.email AS student_email,
        COUNT(DISTINCT comp.content_id)::int AS completed_contents
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       JOIN users u ON e.student_id = u.id
       LEFT JOIN completed_contents comp ON comp.enrollment_id = e.id
       WHERE c.teacher_id = $1
       GROUP BY e.course_id, u.id, e.enrolled_at
       ORDER BY e.enrolled_at DESC`,
      [user.id]
    );

    taughtCourses = teacherCoursesRows.map((c) => ({
      ...c,
      students: studentProgressRows.filter((s) => s.course_id === c.id),
    }));
  }

  return (
    <main className="flex-1 bg-slate-50/50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {showWelcomeTeacher && (
          <WelcomeTeacherModal
            userId={user.id}
            username={user.username}
            approvedAt={user.approved_at ? new Date(user.approved_at).toISOString() : ""}
            approvedAtFormatted={approvedAtFormatted}
          />
        )}

        {user.role === "student" && user.status === "pending" && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-xs">
            <span className="px-3 py-1 rounded-full bg-amber-200 text-amber-900 text-xs font-extrabold uppercase shrink-0">
              Pending
            </span>
            <div>
              <h3 className="text-base font-extrabold text-amber-950">
                Akun Pengajar Anda sedang menunggu verifikasi Admin
              </h3>
              <p className="text-sm text-amber-800 mt-1">
                Sambil menunggu persetujuan Admin, Anda tetap dapat mengakses
                kursus dengan hak akses Student.
              </p>
            </div>
          </div>
        )}

        <section className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white text-2xl font-extrabold flex items-center justify-center uppercase">
                {user.username.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {user.username}
                </h1>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase">
                Role: {user.role}
              </span>
              {user.status === "pending" && (
                <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold uppercase">
                  Status: Pending Teacher
                </span>
              )}
              {(user.role === "admin" || user.role === "teacher") && (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                >
                  Buka Dashboard CMS
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-sm">
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Nama Pengguna
              </p>
              <p className="font-bold text-slate-800 mt-0.5">{user.username}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Email Terdaftar
              </p>
              <p className="font-bold text-slate-800 mt-0.5">{user.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-slate-400">
                Tanggal Bergabung
              </p>
              <p className="font-bold text-slate-800 mt-0.5">
                {new Date(user.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </section>

        {user.role === "teacher" && (
          <section className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Kursus yang Anda Ajarkan & Progres Siswa
                </h2>
                <p className="text-sm text-slate-500">
                  Pantau perkembangan belajar setiap siswa di kelas Anda.
                </p>
              </div>
              <Link
                href="/dashboard/courses"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Kelola Kursus
              </Link>
            </div>

            {taughtCourses.length > 0 ? (
              <div className="space-y-6">
                {taughtCourses.map((course) => (
                  <div
                    key={course.id}
                    className="border border-slate-200 rounded-2xl p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div>
                        <span className="text-xs font-bold text-emerald-700">
                          {course.category_name || "Umum"}
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          <Link
                            href={`/courses/${course.id}`}
                            className="hover:text-emerald-600 transition-colors"
                          >
                            {course.title}
                          </Link>
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/courses/${course.id}`}
                          className="text-xs font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg"
                        >
                          Buka Kelas
                        </Link>
                        <Link
                          href={`/dashboard/courses/${course.id}/contents`}
                          className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg"
                        >
                          Kelola {course.total_contents} Materi →
                        </Link>
                      </div>
                    </div>

                    {course.students.length > 0 ? (
                      <div className="space-y-2.5">
                        {course.students.map((st) => {
                          const pct =
                            course.total_contents > 0
                              ? Math.min(
                                  100,
                                  Math.round(
                                    (st.completed_contents /
                                      course.total_contents) *
                                      100
                                  )
                                )
                              : 0;
                          return (
                            <div
                              key={st.student_id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 rounded-xl p-3"
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-800">
                                  {st.student_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {st.student_email}
                                </p>
                              </div>
                              <div className="sm:w-56">
                                <div className="flex justify-between text-xs font-bold text-emerald-700 mb-1">
                                  <span>
                                    {st.completed_contents}/{course.total_contents}{" "}
                                    materi
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
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Belum ada siswa yang mendaftar di kursus ini.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Anda belum membuat kursus apa pun.
              </p>
            )}
          </section>
        )}

        {user.role === "admin" && (
          <section className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-xs">
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">
              Manajemen Platform (Admin)
            </h2>
            <p className="text-sm text-slate-500 mb-5">
              Akses cepat ke modul CMS untuk mengelola pengguna, kategori, dan
              seluruh kursus di RuangPintar.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/dashboard/users"
                className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-sm font-bold text-emerald-800"
              >
                User Management →
              </Link>
              <Link
                href="/dashboard/categories"
                className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-sm font-bold text-emerald-800"
              >
                Category Management →
              </Link>
              <Link
                href="/dashboard/courses"
                className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 text-sm font-bold text-emerald-800"
              >
                Course Management →
              </Link>
            </div>
          </section>
        )}

        {user.role === "student" && (
          <section className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Kursus yang Diikuti
              </h2>
              <p className="text-sm text-slate-500">
                Daftar kelas belajar Anda beserta progres penyelesaian materi.
              </p>
            </div>
            <Link
              href="/courses"
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold"
            >
              Cari Kelas Baru →
            </Link>
          </div>

          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {enrolledCourses.map((course) => {
                const pct =
                  course.total_contents > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (course.completed_contents / course.total_contents) *
                            100
                        )
                      )
                    : 0;
                return (
                  <div
                    key={course.id}
                    className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                        {course.category_name || "Umum"}
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-2 mb-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Pengajar: {course.teacher_name || "Pengajar"}
                      </p>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold text-emerald-700 mb-1">
                          <span>
                            {course.completed_contents}/{course.total_contents}{" "}
                            Materi
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
                    </div>

                    <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                      <Link
                        href={`/courses/${course.id}`}
                        className="flex-1 text-center py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                      >
                        Lanjutkan Belajar
                      </Link>
                      {course.certificate_code && (
                        <Link
                          href={`/certificates/${course.certificate_code}`}
                          className="py-2 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition-colors"
                        >
                          Sertifikat
                        </Link>
                      )}
                      <DeleteConfirmButton
                        action={unenrollCourse}
                        hiddenFields={{ course_id: course.id }}
                        confirmMessage={`Yakin berhenti belajar dari kelas "${course.title}"? Progres belajar dan sertifikat kelas ini akan direset.`}
                        label="Berhenti Belajar"
                        className="py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-colors cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm text-slate-600 mb-3">
                Anda belum mengikuti kursus apa pun.
              </p>
              <Link
                href="/courses"
                className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Jelajahi Katalog Kursus
              </Link>
            </div>
          )}
          </section>
        )}
      </div>
    </main>
  );
}
