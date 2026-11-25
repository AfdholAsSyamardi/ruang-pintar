"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteCourse } from "@/app/dashboard/actions";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";

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

export default function DashboardCourseList({
  courses,
  categories,
  currentUser,
}) {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [ownership, setOwnership] = useState("all");

  const query = search.trim().toLowerCase();

  const filteredCourses = courses.filter((c) => {
    if (
      ownership === "mine" &&
      currentUser.role === "teacher" &&
      c.teacher_id !== currentUser.id
    ) {
      return false;
    }

    if (categoryId && String(c.category_id) !== String(categoryId)) {
      return false;
    }

    if (!query) return true;

    return (
      (c.title || "").toLowerCase().includes(query) ||
      (c.description || "").toLowerCase().includes(query) ||
      (c.category_name || "").toLowerCase().includes(query) ||
      (c.teacher_name || "").toLowerCase().includes(query) ||
      `/courses/${c.id}`.includes(query)
    );
  });

  const hasActiveFilter =
    query !== "" || categoryId !== "" || ownership !== "all";

  function handleReset() {
    setSearch("");
    setCategoryId("");
    setOwnership("all");
  }

  return (
    <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Daftar Seluruh Course ({filteredCourses.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {hasActiveFilter
              ? `Menampilkan ${filteredCourses.length} dari ${courses.length} kelas secara real-time`
              : `Total ${courses.length} kelas tersedia di platform`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div
          className={
            currentUser.role === "teacher" ? "md:col-span-5" : "md:col-span-8"
          }
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul course, deskripsi, kategori, atau nama teacher..."
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="md:col-span-4 flex gap-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {currentUser.role !== "teacher" && hasActiveFilter && (
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {currentUser.role === "teacher" && (
          <div className="md:col-span-3 flex gap-2">
            <select
              value={ownership}
              onChange={(e) => setOwnership(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Pengajar</option>
              <option value="mine">Kelas Milik Saya</option>
            </select>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="py-3.5 px-4 whitespace-nowrap">Course</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Kategori</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Teacher</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Rentang Waktu</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Statistik</th>
              <th className="py-3.5 px-4 whitespace-nowrap text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCourses.map((c) => {
              const isOwner =
                currentUser.role === "admin" || c.teacher_id === currentUser.id;
              const isLifetime = !c.start_date && !c.end_date;

              return (
                <tr
                  key={c.id}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="py-4 px-4 min-w-[250px] max-w-sm align-middle">
                    <Link
                      href={`/courses/${c.id}`}
                      className="font-bold text-slate-900 hover:text-emerald-600 transition-colors block"
                    >
                      {c.title}
                    </Link>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {c.description}
                    </p>
                    <Link
                      href={`/courses/${c.id}`}
                      className="inline-block mt-1 text-[11px] font-mono font-semibold text-emerald-700 hover:underline"
                    >
                      /courses/{c.id}
                    </Link>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap align-middle">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-bold whitespace-nowrap">
                      {c.category_name || "Umum"}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap align-middle">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-slate-700 font-semibold">
                        {c.teacher_name}
                      </span>
                      {c.teacher_id === currentUser.id && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold whitespace-nowrap">
                          Milik Anda
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap align-middle">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        isLifetime
                          ? "bg-teal-50 text-teal-700 border border-teal-200/60"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {formatDateRange(c.start_date, c.end_date)}
                    </span>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap align-middle">
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {c.content_count} Materi
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700">
                        {c.student_count} Siswa
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-right align-middle">
                    {isOwner ? (
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <Link
                          href={`/courses/${c.id}`}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Buka
                        </Link>
                        <Link
                          href={`/dashboard/courses/${c.id}/contents`}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 text-xs font-bold transition-colors"
                        >
                          Materi ({c.content_count})
                        </Link>
                        <Link
                          href={`/dashboard/courses/${c.id}/edit`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Edit
                        </Link>
                        <DeleteConfirmButton
                          action={deleteCourse}
                          hiddenFields={{ id: c.id }}
                          confirmMessage={`Yakin hapus course "${c.title}"? Semua materi di dalamnya juga akan terhapus.`}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer whitespace-nowrap"
                        />
                      </div>
                    ) : (
                      <Link
                        href={`/courses/${c.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
                      >
                        Lihat Kelas →
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredCourses.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  {courses.length === 0
                    ? "Belum ada course yang dibuat."
                    : "Tidak ada course yang cocok dengan pencarian atau filter Anda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
