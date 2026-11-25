import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateContent } from "@/app/dashboard/actions";
import ContentTextareaWithPreview from "@/components/ContentTextareaWithPreview";

export const dynamic = "force-dynamic";

export default async function EditCourseContentPage({ params, searchParams }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const { id, contentId } = await params;
  const sp = await searchParams;
  if (!Number.isInteger(Number(id)) || !Number.isInteger(Number(contentId))) {
    notFound();
  }

  const courseId = Number(id);
  const matId = Number(contentId);

  const { rows } = await pool.query(
    `SELECT cc.*, c.teacher_id, c.title AS course_title
     FROM course_contents cc
     JOIN courses c ON cc.course_id = c.id
     WHERE cc.id = $1 AND cc.course_id = $2`,
    [matId, courseId]
  );

  const material = rows[0];
  if (!material) {
    notFound();
  }

  if (
    currentUser.role === "teacher" &&
    material.teacher_id !== currentUser.id
  ) {
    redirect("/dashboard/courses?error=Akses+ditolak");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link
          href={`/dashboard/courses/${courseId}/contents`}
          className="text-xs font-bold text-emerald-700 hover:underline"
        >
          ← Kembali ke Daftar Materi ({material.course_title})
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Edit Materi #{material.order_index}
        </h1>
      </div>

      {sp?.error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
          {sp.error}
        </div>
      )}

      <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <form action={updateContent} className="space-y-4">
          <input type="hidden" name="id" value={material.id} />
          <input type="hidden" name="course_id" value={courseId} />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Judul Materi
              </label>
              <input
                type="text"
                name="title"
                defaultValue={material.title}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Urutan Materi
              </label>
              <input
                type="number"
                name="order_index"
                min={1}
                defaultValue={material.order_index}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Isi Materi
            </label>
            <ContentTextareaWithPreview
              rows={10}
              defaultValue={material.content}
              placeholder="Tulis isi materi pembelajaran atau tempel link YouTube di sini..."
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
            >
              Simpan Perubahan
            </button>
            <Link
              href={`/dashboard/courses/${courseId}/contents`}
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
