import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createContent, deleteContent } from "@/app/dashboard/actions";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import ContentTextareaWithPreview from "@/components/ContentTextareaWithPreview";
import { extractYouTubeIdsFromText } from "@/lib/youtube";
import { parsePositiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function CourseContentsManagementPage({
  params,
  searchParams,
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const sp = await searchParams;
  const courseId = parsePositiveInt(id);
  if (!courseId) {
    notFound();
  }

  const { rows: courseRows } = await pool.query(
    `SELECT c.*, cat.name AS category_name, u.username AS teacher_name
     FROM courses c
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN users u ON c.teacher_id = u.id
     WHERE c.id = $1`,
    [courseId]
  );
  const course = courseRows[0];
  if (!course) {
    notFound();
  }

  if (
    currentUser.role === "teacher" &&
    course.teacher_id !== currentUser.id
  ) {
    redirect(
      "/dashboard/courses?error=Anda+hanya+dapat+mengelola+materi+di+kelas+Anda+sendiri"
    );
  }

  const { rows: contents } = await pool.query(
    `SELECT id, title, content, order_index, created_at
     FROM course_contents
     WHERE course_id = $1
     ORDER BY order_index ASC, id ASC`,
    [courseId]
  );

  const suggestedOrderIndex =
    contents.length > 0
      ? Math.max(...contents.map((c) => c.order_index || 0)) + 1
      : 1;

  const { rows: studentProgress } = await pool.query(
    `SELECT
      u.id AS student_id,
      u.username,
      u.email,
      e.enrolled_at,
      COUNT(DISTINCT comp.content_id)::int AS completed_count,
      cert.certificate_code
     FROM enrollments e
     JOIN users u ON e.student_id = u.id
     LEFT JOIN completed_contents comp ON comp.enrollment_id = e.id
     LEFT JOIN certificates cert ON cert.student_id = e.student_id AND cert.course_id = e.course_id
     WHERE e.course_id = $1
     GROUP BY u.id, e.enrolled_at, cert.certificate_code
     ORDER BY e.enrolled_at DESC`,
    [courseId]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/courses"
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            ← Kembali ke Course Management
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Kelola Materi: {course.title}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Kategori: <strong>{course.category_name || "Umum"}</strong> •
            Pengajar: <strong>{course.teacher_name}</strong>
          </p>
        </div>

        <Link
          href={`/courses/${courseId}`}
          className="px-4 py-2.5 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-bold"
        >
          Pratinjau Halaman Belajar →
        </Link>
      </div>

      {sp?.success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
          {sp.success}
        </div>
      )}
      {sp?.error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
          {sp.error}
        </div>
      )}

      <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">
          Tambah Materi Baru
        </h2>
        <form action={createContent} className="space-y-4">
          <input type="hidden" name="course_id" value={courseId} />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Judul Materi *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Contoh: Pengenalan Dasar & Konsep Utama"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Urutan (Order Index) *
              </label>
              <input
                type="number"
                name="order_index"
                min={1}
                defaultValue={suggestedOrderIndex}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Isi Materi *
            </label>
            <ContentTextareaWithPreview
              rows={10}
              placeholder="Tulis isi materi pembelajaran secara lengkap atau tempel link YouTube di sini..."
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
          >
            + Tambahkan Materi
          </button>
        </form>
      </section>

      <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">
          Daftar Materi Pembelajaran ({contents.length})
        </h2>

        {contents.length > 0 ? (
          <div className="space-y-3">
            {contents.map((item) => {
              const hasVideo = extractYouTubeIdsFromText(item.content).length > 0;
              return (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center shrink-0">
                      {item.order_index}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">
                          {item.title}
                        </h3>
                        {hasVideo && (
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold">
                            ▶ Video YouTube
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 max-w-xl mt-0.5">
                        {item.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/dashboard/courses/${courseId}/contents/${item.id}/edit`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      Edit
                    </Link>
                    <DeleteConfirmButton
                      action={deleteContent}
                      hiddenFields={{ id: item.id, course_id: courseId }}
                      confirmMessage={`Yakin hapus materi "${item.title}"?`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Belum ada materi di kelas ini. Tambahkan materi pertama di atas!
          </p>
        )}
      </section>

      <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-900 mb-1">
          Pantau Progres Siswa ({studentProgress.length})
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Perkembangan siswa yang telah mendaftar di kelas ini.
        </p>

        {studentProgress.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-3 pr-4">Siswa</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Progres</th>
                  <th className="py-3">Sertifikat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentProgress.map((st) => {
                  const pct =
                    contents.length > 0
                      ? Math.min(
                          100,
                          Math.round((st.completed_count / contents.length) * 100)
                        )
                      : 0;
                  return (
                    <tr key={st.student_id}>
                      <td className="py-3 pr-4 font-bold text-slate-900">
                        {st.username}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{st.email}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-28 h-2 bg-emerald-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-600 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-emerald-700">
                            {st.completed_count}/{contents.length} ({pct}%)
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        {st.certificate_code ? (
                          <Link
                            href={`/certificates/${st.certificate_code}`}
                            className="text-xs font-mono font-bold text-emerald-700 hover:underline"
                          >
                            {st.certificate_code}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Belum terbit
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Belum ada siswa yang mengikuti kelas ini.
          </p>
        )}
      </section>
    </div>
  );
}
