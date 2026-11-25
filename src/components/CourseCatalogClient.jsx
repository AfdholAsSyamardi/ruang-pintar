"use client";

import { useState } from "react";
import Link from "next/link";
import { enrollCourse } from "@/app/actions";

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) return "Lifetime Access";
  const fmt = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

export default function CourseCatalogClient({
  courses,
  categories,
  user,
  enrolledObj = {},
  initialQuery = "",
  initialCategory = "",
  isHomePopular = false,
}) {
  const [search, setSearch] = useState(initialQuery);
  const [categoryId, setCategoryId] = useState(initialCategory);

  const query = search.trim().toLowerCase();

  const filteredCourses = courses.filter((course) => {
    if (categoryId && String(course.category_id) !== String(categoryId)) {
      return false;
    }
    if (!query) return true;
    return (
      (course.title || "").toLowerCase().includes(query) ||
      (course.description || "").toLowerCase().includes(query) ||
      (course.teacher_name || "").toLowerCase().includes(query) ||
      (course.category_name || "").toLowerCase().includes(query)
    );
  });

  const visibleCourses = isHomePopular
    ? filteredCourses.slice(0, 5)
    : filteredCourses;

  const hasActiveFilter = query !== "" || categoryId !== "";

  function handleReset() {
    setSearch("");
    setCategoryId("");
  }

  return (
    <>
      <form
        onSubmit={(e) => e.preventDefault()}
        className={
          isHomePopular
            ? "bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 mb-10 grid grid-cols-1 md:grid-cols-12 gap-3"
            : "bg-white border border-emerald-100 rounded-2xl p-4 mb-10 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3"
        }
      >
        <div className="md:col-span-7">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              isHomePopular
                ? "Cari judul kursus, topik, atau nama pengajar..."
                : "Cari nama kelas, deskripsi, atau pengajar..."
            }
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="md:col-span-5 flex gap-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-semibold whitespace-nowrap cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {hasActiveFilter && (
        <p className="text-xs font-semibold text-slate-500 -mt-6 mb-6">
          {isHomePopular && filteredCourses.length > 5
            ? `Menampilkan 5 kursus terpopuler dari ${filteredCourses.length} hasil yang cocok`
            : `Ditemukan ${visibleCourses.length} kursus yang cocok`}
        </p>
      )}

      {visibleCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleCourses.map((course, index) => {
            const isEnrolled = Object.prototype.hasOwnProperty.call(
              enrolledObj,
              course.id
            );
            const completedCount = enrolledObj[course.id] || 0;
            const progressPct =
              course.content_count > 0
                ? Math.min(
                    100,
                    Math.round((completedCount / course.content_count) * 100)
                  )
                : 0;

            const mailtoHref = course.teacher_email
              ? `mailto:${course.teacher_email}?subject=${encodeURIComponent(
                  `Pertanyaan Kursus: ${course.title}`
                )}`
              : "#";

            const isOwnerOrAdmin =
              user?.role === "admin" ||
              (user?.role === "teacher" && course.teacher_id === user.id);

            const ctaLink = isOwnerOrAdmin ? (
              <Link
                href={`/dashboard/courses/${course.id}/contents`}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                Kelola Kelas →
              </Link>
            ) : user?.role === "teacher" ? (
              <Link
                href={`/courses/${course.id}`}
                className="px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
              >
                Lihat Materi →
              </Link>
            ) : isEnrolled ? (
              <Link
                href={`/courses/${course.id}`}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors"
              >
                Lanjutkan Belajar →
              </Link>
            ) : user?.role === "student" ? (
              <form action={enrollCourse}>
                <input type="hidden" name="course_id" value={course.id} />
                <input
                  type="hidden"
                  name="redirect_to"
                  value={`/courses/${course.id}`}
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Ikuti Course
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
              >
                Ikuti Course
              </Link>
            );

            return (
              <article
                key={course.id}
                className={
                  isHomePopular
                    ? "bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-6 shadow-xs hover:shadow-lg hover:shadow-emerald-900/5 transition-all flex flex-col"
                    : `bg-white rounded-2xl p-6 border transition-all flex flex-col shadow-xs hover:shadow-lg hover:shadow-emerald-900/5 ${
                        isEnrolled
                          ? "border-emerald-300 ring-1 ring-emerald-100"
                          : "border-slate-200 hover:border-emerald-300"
                      }`
                }
              >
                <Link
                  href={`/courses/${course.id}`}
                  className="block flex-1 group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                        {course.category_name || "Umum"}
                      </span>
                      {!isHomePopular &&
                        user?.role === "teacher" &&
                        course.teacher_id === user.id && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase">
                            Kelas Anda
                          </span>
                        )}
                    </div>

                    {isHomePopular ? (
                      <div className="flex items-center gap-2">
                        {user?.role === "teacher" &&
                          course.teacher_id === user.id && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase">
                              Kelas Anda
                            </span>
                          )}
                        <span className="text-xs font-bold text-slate-400">
                          #{index + 1} Terpopuler
                        </span>
                      </div>
                    ) : (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          !course.start_date && !course.end_date
                            ? "bg-teal-50 text-teal-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {formatDateRange(course.start_date, course.end_date)}
                      </span>
                    )}
                  </div>

                  <h3
                    className={
                      isHomePopular
                        ? "text-lg font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2 leading-snug"
                        : "text-xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors mb-2"
                    }
                  >
                    {course.title}
                  </h3>

                  <p className="text-sm text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="text-xs text-slate-500 space-y-1.5 mb-5">
                    <p>
                      Pengajar:{" "}
                      <span
                        className={
                          isHomePopular
                            ? "font-bold text-slate-700"
                            : "font-bold text-slate-800"
                        }
                      >
                        {course.teacher_name || "Pengajar"}
                      </span>
                    </p>
                    {isHomePopular && (
                      <p>
                        Jadwal:{" "}
                        <span className="font-semibold text-emerald-700">
                          {formatDateRange(course.start_date, course.end_date)}
                        </span>
                      </p>
                    )}
                    <p>
                      {course.content_count} Materi • {course.student_count}{" "}
                      {isHomePopular ? "Siswa Terdaftar" : "Siswa Mengikuti"}
                    </p>
                  </div>

                  {isEnrolled &&
                    (isHomePopular ? (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs font-bold text-emerald-700 mb-1">
                          <span>Progres Belajar</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="mb-5 bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
                        <div className="flex justify-between items-center text-xs font-bold text-emerald-800 mb-1.5">
                          <span>
                            {completedCount}/{course.content_count} Materi Selesai
                          </span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </Link>

                <div className="mt-auto pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {isHomePopular ? (
                    <>
                      <Link
                        href={`/courses/${course.id}`}
                        className="text-xs font-bold text-slate-600 hover:text-emerald-700"
                      >
                        Detail Kelas
                      </Link>
                      {ctaLink}
                    </>
                  ) : (
                    <>
                      {course.teacher_email &&
                        (!user || user.id !== course.teacher_id) && (
                          <a
                            href={mailtoHref}
                            className="px-3 py-2 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition-colors"
                          >
                            Hubungi Teacher
                          </a>
                        )}
                      <div className="flex items-center gap-2 ml-auto">
                        {ctaLink}
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div
          className={
            isHomePopular
              ? "bg-slate-50 border border-slate-200 rounded-2xl p-10 text-center"
              : "bg-white border border-slate-200 rounded-2xl p-12 text-center"
          }
        >
          <p className="text-slate-600 font-semibold">
            {isHomePopular
              ? "Tidak ditemukan kursus yang sesuai dengan filter pencarian Anda."
              : "Belum ada kursus yang cocok dengan pencarian Anda."}
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-block mt-3 text-sm font-bold text-emerald-600 hover:underline cursor-pointer"
            >
              {isHomePopular
                ? "Tampilkan Semua Kursus Populer"
                : "Tampilkan Semua Kursus"}
            </button>
          )}
        </div>
      )}
    </>
  );
}
