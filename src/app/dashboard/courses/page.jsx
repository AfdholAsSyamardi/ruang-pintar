import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createCourse } from "@/app/dashboard/actions";
import DashboardCourseList from "@/components/DashboardCourseList";

export const dynamic = "force-dynamic";

export default async function CoursesManagementPage({ searchParams }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const sp = await searchParams;

  const { rows: categories } = await pool.query(
    "SELECT id, name FROM categories ORDER BY name ASC"
  );

  let teachers = [];
  if (currentUser.role === "admin") {
    const { rows } = await pool.query(
      "SELECT id, username, email FROM users WHERE role = 'teacher' ORDER BY username ASC"
    );
    teachers = rows;
  }

  const { rows: courses } = await pool.query(
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
      COUNT(DISTINCT mat.id)::int AS content_count,
      COUNT(DISTINCT e.id)::int AS student_count
     FROM courses c
     LEFT JOIN categories cat ON c.category_id = cat.id
     LEFT JOIN users u ON c.teacher_id = u.id
     LEFT JOIN course_contents mat ON mat.course_id = c.id
     LEFT JOIN enrollments e ON e.course_id = c.id
     GROUP BY c.id, cat.id, u.id
     ORDER BY c.created_at DESC`
  );

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          {currentUser.role === "admin" ? "Admin CMS" : "Teacher CMS"}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Course Management
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Buat kelas baru, atur kategori serta rentang waktu (opsional untuk
          Lifetime Access), dan kelola materi pembelajaran.
        </p>
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
          Buat Course Baru
        </h2>
        <form action={createCourse} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Nama Course *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="Contoh: Fundamental Next.js & SQL"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Kategori *
              </label>
              <select
                name="category_id"
                required
                defaultValue=""
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="" disabled>
                  -- Pilih Kategori --
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Deskripsi Course *
            </label>
            <textarea
              name="description"
              rows={3}
              required
              placeholder="Jelaskan ringkasan materi dan tujuan pembelajaran kelas ini..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Nama Teacher *
              </label>
              {currentUser.role === "admin" ? (
                <select
                  name="teacher_id"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>
                    -- Pilih Teacher --
                  </option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.username} ({t.email})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={currentUser.username}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Tanggal Mulai (Opsional)
              </label>
              <input
                type="date"
                name="start_date"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Tanggal Selesai (Opsional)
              </label>
              <input
                type="date"
                name="end_date"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Catatan: Kosongkan tanggal mulai dan tanggal selesai jika kelas
            bersifat <strong>Lifetime Access</strong> (tanpa batas waktu).
          </p>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            + Simpan Course Baru
          </button>
        </form>
      </section>

      <DashboardCourseList
        courses={courses}
        categories={categories}
        currentUser={{ id: currentUser.id, role: currentUser.role }}
      />
    </div>
  );
}
