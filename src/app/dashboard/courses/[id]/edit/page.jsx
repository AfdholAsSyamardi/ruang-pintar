import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateCourse } from "@/app/dashboard/actions";
import { parsePositiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

function toDateInputValue(d) {
  if (!d) return "";
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)) {
    return d.slice(0, 10);
  }
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default async function EditCoursePage({ params, searchParams }) {
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
    `SELECT c.*, u.username AS teacher_name
     FROM courses c
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
    redirect("/dashboard/courses?error=Anda+hanya+dapat+mengedit+course+milik+sendiri");
  }

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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/courses"
          className="text-xs font-bold text-emerald-700 hover:underline"
        >
          ← Kembali ke Course Management
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Edit Course #{course.id}
        </h1>
      </div>

      {sp?.error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
          {sp.error}
        </div>
      )}

      <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <form action={updateCourse} className="space-y-4">
          <input type="hidden" name="id" value={course.id} />

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Nama Course
            </label>
            <input
              type="text"
              name="title"
              defaultValue={course.title}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Deskripsi Course
            </label>
            <textarea
              name="description"
              rows={4}
              defaultValue={course.description}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Kategori
              </label>
              <select
                name="category_id"
                defaultValue={course.category_id || ""}
                required
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

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Nama Teacher
              </label>
              {currentUser.role === "admin" ? (
                <select
                  name="teacher_id"
                  defaultValue={
                    teachers.some((t) => t.id === course.teacher_id)
                      ? course.teacher_id
                      : ""
                  }
                  required
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
                  value={course.teacher_name || currentUser.username}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Tanggal Mulai (Opsional)
              </label>
              <input
                type="date"
                name="start_date"
                defaultValue={toDateInputValue(course.start_date)}
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
                defaultValue={toDateInputValue(course.end_date)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
            >
              Simpan Perubahan
            </button>
            <Link
              href="/dashboard/courses"
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold"
            >
              Batal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
