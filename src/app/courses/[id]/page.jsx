import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  enrollCourse,
  markAsDone,
  addComment,
  deleteComment,
} from "@/app/actions";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import { extractYouTubeIdsFromText } from "@/lib/youtube";
import { parsePositiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "Lifetime Access";
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "-";
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

function renderTextWithLinks(text) {
  if (!text) return null;
  const parts = String(text).split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, idx) => {
    if (/^https?:\/\/[^\s]+$/i.test(part)) {
      const cleanedUrl = part.replace(/[.,;:!?)]+$/, "");
      const trailing = part.slice(cleanedUrl.length);
      return (
        <span key={idx}>
          <a
            href={cleanedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 font-semibold underline hover:text-emerald-700 break-all"
          >
            {cleanedUrl}
          </a>
          {trailing}
        </span>
      );
    }
    return part;
  });
}

export default async function CourseDetailPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;

  const courseId = parsePositiveInt(id);
  if (!courseId) {
    notFound();
  }
  const user = await getCurrentUser();

  const { rows: courseRows } = await pool.query(
    `SELECT
      c.*,
      cat.name AS category_name,
      u.username AS teacher_name,
      u.email AS teacher_email
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

  const { rows: contents } = await pool.query(
    `SELECT id, course_id, title, content, order_index, created_at
     FROM course_contents
     WHERE course_id = $1
     ORDER BY order_index ASC, id ASC`,
    [courseId]
  );

  let enrollment = null;
  let completedContentIds = new Set();
  let certificate = null;

  if (user && user.role === "student") {
    const { rows: enrollRows } = await pool.query(
      "SELECT id, enrolled_at FROM enrollments WHERE student_id = $1 AND course_id = $2",
      [user.id, courseId]
    );
    enrollment = enrollRows[0] || null;

    if (enrollment) {
      const { rows: doneRows } = await pool.query(
        "SELECT content_id FROM completed_contents WHERE enrollment_id = $1",
        [enrollment.id]
      );
      completedContentIds = new Set(doneRows.map((r) => r.content_id));
    }

    const { rows: certRows } = await pool.query(
      "SELECT certificate_code, issued_at FROM certificates WHERE student_id = $1 AND course_id = $2",
      [user.id, courseId]
    );
    certificate = certRows[0] || null;
  }

  const requestedMateriId = Number(sp?.materi);
  let activeIndex = contents.findIndex((m) => m.id === requestedMateriId);
  if (activeIndex === -1 && contents.length > 0) {
    const firstUnfinished = contents.findIndex(
      (m) => !completedContentIds.has(m.id)
    );
    activeIndex = firstUnfinished !== -1 ? firstUnfinished : 0;
  }

  const activeContent = activeIndex >= 0 ? contents[activeIndex] : null;
  const nextContent =
    activeIndex >= 0 && activeIndex + 1 < contents.length
      ? contents[activeIndex + 1]
      : null;

  const totalContents = contents.length;
  const completedCount = contents.filter((m) =>
    completedContentIds.has(m.id)
  ).length;
  const progressPct =
    totalContents > 0
      ? Math.min(100, Math.round((completedCount / totalContents) * 100))
      : 0;

  let comments = [];
  if (activeContent) {
    const { rows: commentRows } = await pool.query(
      `SELECT
        cm.id,
        cm.comment_text,
        cm.created_at,
        cm.user_id,
        u.username,
        u.role
       FROM comments cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.content_id = $1
       ORDER BY cm.created_at DESC`,
      [activeContent.id]
    );
    comments = commentRows;
  }

  const activeYoutubeIds = activeContent
    ? extractYouTubeIdsFromText(activeContent.content)
    : [];

  const isOwnerOrAdmin =
    user && (user.role === "admin" || user.id === course.teacher_id);
  const isTeacherOrAdmin =
    user && (user.role === "admin" || user.role === "teacher");

  return (
    <main className="flex-1 bg-slate-50/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/courses" className="hover:text-emerald-600 font-semibold">
              Katalog Kursus
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold truncate max-w-xs sm:max-w-md">
              {course.title}
            </span>
          </div>

          {course.teacher_email && (!user || user.id !== course.teacher_id) && (
            <a
              href={`mailto:${course.teacher_email}?subject=${encodeURIComponent(
                `Konsultasi Kelas: ${course.title}`
              )}`}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-xs font-bold text-slate-700 hover:text-emerald-700 transition-colors"
            >
              Hubungi Teacher ({course.teacher_name})
            </a>
          )}
        </div>

        <section className="bg-white border border-emerald-100 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  {course.category_name || "Umum"}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                  {formatDateRange(course.start_date, course.end_date)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
                {course.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-3 whitespace-pre-line">
                {renderTextWithLinks(course.description)}
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Pengajar:{" "}
                <span className="text-slate-800 font-bold">
                  {course.teacher_name}
                </span>{" "}
                • {totalContents} Materi Pembelajaran
              </p>
            </div>

            <div className="lg:w-80 shrink-0">
              {!user ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                  <p className="text-sm font-bold text-emerald-950 mb-2">
                    Tertarik mengikuti kelas ini?
                  </p>
                  <p className="text-xs text-emerald-800 mb-4">
                    Masuk atau daftar sebagai Siswa untuk membaca seluruh materi
                    dan melacak progres belajar Anda.
                  </p>
                  <Link
                    href="/login"
                    className="block w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
                  >
                    Masuk untuk Ikuti Course
                  </Link>
                </div>
              ) : enrollment ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                  <div className="flex justify-between text-xs font-bold text-emerald-800 mb-2">
                    <span>Progres Kursus Anda</span>
                    <span>
                      {completedCount}/{totalContents} ({progressPct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-emerald-200/70 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {certificate ? (
                    <Link
                      href={`/certificates/${certificate.certificate_code}`}
                      className="block w-full text-center py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                    >
                      Lihat Sertifikat Digital ({certificate.certificate_code})
                    </Link>
                  ) : (
                    <p className="text-xs text-emerald-800">
                      Selesaikan semua materi untuk mendapatkan sertifikat digital!
                    </p>
                  )}
                </div>
              ) : isOwnerOrAdmin ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2.5">
                  <p className="text-xs font-bold text-slate-600 uppercase">
                    Mode Pengajar / Admin
                  </p>
                  <Link
                    href={`/dashboard/courses/${course.id}/contents`}
                    className="block w-full text-center py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Kelola Materi Kelas Ini
                  </Link>
                </div>
              ) : user.role === "teacher" ? (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-1.5">
                  <p className="text-xs font-bold text-emerald-800 uppercase">
                    Mode Pratinjau Pengajar
                  </p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Anda masuk sebagai Teacher sehingga dapat meninjau seluruh
                    materi tanpa mendaftar sebagai siswa.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                  <p className="text-sm font-bold text-slate-900 mb-2">
                    Anda belum terdaftar di kelas ini
                  </p>
                  <form action={enrollCourse}>
                    <input type="hidden" name="course_id" value={course.id} />
                    <input
                      type="hidden"
                      name="redirect_to"
                      value={`/courses/${course.id}`}
                    />
                    <button
                      type="submit"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
                    >
                      Ikuti Course Sekarang
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 sticky top-24">
              <h2 className="text-base font-extrabold text-slate-900 mb-4">
                Daftar Materi ({contents.length})
              </h2>
              {contents.length > 0 ? (
                <ul className="space-y-2">
                  {contents.map((item, idx) => {
                    const isActive = activeContent?.id === item.id;
                    const isDone = completedContentIds.has(item.id);
                    const hasVideo =
                      extractYouTubeIdsFromText(item.content).length > 0;
                    return (
                      <li key={item.id}>
                        <Link
                          href={`/courses/${course.id}?materi=${item.id}`}
                          className={`flex items-start justify-between gap-3 p-3 rounded-xl border text-sm transition-all ${
                            isActive
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
                              : "bg-white border-slate-100 hover:border-emerald-200 text-slate-700"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                isDone
                                  ? "bg-emerald-600 text-white"
                                  : isActive
                                  ? "bg-emerald-200 text-emerald-900"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isDone ? "✓" : item.order_index || idx + 1}
                            </span>
                            <span className="leading-snug">{item.title}</span>
                          </div>
                          {hasVideo && (
                            <span className="shrink-0 px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200/70 text-[10px] font-bold mt-0.5">
                              ▶ Video
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">
                  Pengajar belum menambahkan materi pada kelas ini.
                </p>
              )}
            </div>
          </aside>

          <div className="lg:col-span-8 space-y-6">
            {activeContent ? (
              <>
                <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                        Materi #{activeContent.order_index}
                      </span>
                      <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                        {activeContent.title}
                      </h2>
                    </div>

                    {completedContentIds.has(activeContent.id) && (
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        ✓ Selesai Dipelajari
                      </span>
                    )}
                  </div>

                  {activeYoutubeIds.length > 0 && (
                    <div className="mb-6 space-y-4">
                      {activeYoutubeIds.map((videoId) => (
                        <div
                          key={videoId}
                          className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-sm"
                        >
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={activeContent.title}
                            className="w-full aspect-video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-slate-700 text-base leading-relaxed whitespace-pre-line">
                    {renderTextWithLinks(activeContent.content)}
                  </div>

                  {enrollment && user?.role === "student" && (
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                      {completedContentIds.has(activeContent.id) ? (
                        <span className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold text-center">
                          ✓ Materi Sudah Ditandai Selesai
                        </span>
                      ) : (
                        <form action={markAsDone} className="w-full sm:w-auto">
                          <input
                            type="hidden"
                            name="course_id"
                            value={course.id}
                          />
                          <input
                            type="hidden"
                            name="content_id"
                            value={activeContent.id}
                          />
                          <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
                          >
                            ✓ Mark as Done
                          </button>
                        </form>
                      )}

                      {nextContent ? (
                        <Link
                          href={`/courses/${course.id}?materi=${nextContent.id}`}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold text-center transition-colors"
                        >
                          Lanjutkan →
                        </Link>
                      ) : certificate ? (
                        <Link
                          href={`/certificates/${certificate.certificate_code}`}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold text-center transition-colors"
                        >
                          Lihat Sertifikat Anda →
                        </Link>
                      ) : null}
                    </div>
                  )}

                  {!user ? (
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <Link
                        href="/login"
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
                      >
                        Masuk untuk Ikuti Course
                      </Link>
                      {nextContent && (
                        <Link
                          href={`/courses/${course.id}?materi=${nextContent.id}`}
                          className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors ml-auto"
                        >
                          Materi Selanjutnya →
                        </Link>
                      )}
                    </div>
                  ) : user.role === "student" && !enrollment ? (
                    <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <form action={enrollCourse}>
                        <input
                          type="hidden"
                          name="course_id"
                          value={course.id}
                        />
                        <input
                          type="hidden"
                          name="redirect_to"
                          value={`/courses/${course.id}?materi=${activeContent.id}`}
                        />
                        <button
                          type="submit"
                          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
                        >
                          Ikuti Course Sekarang
                        </button>
                      </form>
                      {nextContent && (
                        <Link
                          href={`/courses/${course.id}?materi=${nextContent.id}`}
                          className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors ml-auto"
                        >
                          Materi Selanjutnya →
                        </Link>
                      )}
                    </div>
                  ) : isTeacherOrAdmin && nextContent ? (
                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                      <Link
                        href={`/courses/${course.id}?materi=${nextContent.id}`}
                        className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold transition-colors"
                      >
                        Materi Selanjutnya →
                      </Link>
                    </div>
                  ) : null}
                </article>

                <section
                  id="diskusi"
                  className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs"
                >
                  <h3 className="text-lg font-extrabold text-slate-900 mb-1">
                    Forum Diskusi Materi
                  </h3>
                  <p className="text-xs text-slate-500 mb-5">
                    Diskusikan pertanyaan atau catatan mengenai materi &ldquo;
                    {activeContent.title}&rdquo;.
                  </p>

                  {user ? (
                    <form action={addComment} className="mb-6 space-y-3">
                      <input type="hidden" name="course_id" value={course.id} />
                      <input
                        type="hidden"
                        name="content_id"
                        value={activeContent.id}
                      />
                      <textarea
                        name="comment_text"
                        rows={3}
                        required
                        placeholder="Tulis pertanyaan atau tanggapan Anda di sini..."
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
                      >
                        Kirim Komentar
                      </button>
                    </form>
                  ) : (
                    <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-600">
                      <Link
                        href="/login"
                        className="font-bold text-emerald-600 hover:underline"
                      >
                        Masuk terlebih dahulu
                      </Link>{" "}
                      untuk ikut berdiskusi di forum materi ini.
                    </div>
                  )}

                  {comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((cm) => {
                        const canDelete =
                          user &&
                          (user.role === "admin" || user.id === cm.user_id);

                        return (
                          <div
                            key={cm.id}
                            className="border border-slate-100 bg-slate-50/70 rounded-2xl p-4"
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center uppercase">
                                  {cm.username?.charAt(0) || "U"}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-900">
                                      {cm.username}
                                    </span>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                        cm.role === "teacher"
                                          ? "bg-emerald-100 text-emerald-800"
                                          : cm.role === "admin"
                                          ? "bg-teal-100 text-teal-800"
                                          : "bg-slate-200 text-slate-700"
                                      }`}
                                    >
                                      {cm.role}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    {new Date(cm.created_at).toLocaleString(
                                      "id-ID"
                                    )}
                                  </p>
                                </div>
                              </div>

                              {canDelete && (
                                <DeleteConfirmButton
                                  action={deleteComment}
                                  hiddenFields={{
                                    comment_id: cm.id,
                                    course_id: course.id,
                                    content_id: activeContent.id,
                                  }}
                                  confirmMessage="Hapus komentar ini?"
                                  className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                                />
                              )}
                            </div>
                            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                              {renderTextWithLinks(cm.comment_text)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Belum ada komentar diskusi pada materi ini. Jadilah yang
                      pertama bertanya!
                    </p>
                  )}
                </section>
              </>
            ) : (
              <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center">
                <p className="text-slate-600 font-semibold">
                  Belum ada materi pembelajaran yang tersedia di kursus ini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
