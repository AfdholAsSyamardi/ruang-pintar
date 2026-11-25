import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createCategory, deleteCategory } from "@/app/dashboard/actions";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";

export const dynamic = "force-dynamic";

export default async function CategoriesManagementPage({ searchParams }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const { rows: categories } = await pool.query(
    `SELECT
      cat.id,
      cat.name,
      cat.created_at,
      COUNT(c.id)::int AS course_count
     FROM categories cat
     LEFT JOIN courses c ON c.category_id = cat.id
     GROUP BY cat.id
     ORDER BY cat.id ASC`
  );

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Admin CMS
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          Category Management
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Kategori yang dikelola di sini menjadi sumber dropdown pada saat
          membuat atau mengedit kursus.
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
          Tambah Kategori Baru
        </h2>
        <form action={createCategory} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="name"
            maxLength={100}
            required
            placeholder="Contoh: Teknologi, Web Development, Data Science"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
          >
            + Tambah Kategori
          </button>
        </form>
      </section>

      <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">
          Daftar Kategori ({categories.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-3 pr-4">ID</th>
                <th className="py-3 pr-4">Nama Kategori</th>
                <th className="py-3 pr-4">Jumlah Kursus</th>
                <th className="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 pr-4 font-mono text-xs text-slate-500">
                    #{cat.id}
                  </td>
                  <td className="py-3.5 pr-4 font-bold text-slate-900">
                    {cat.name}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-600">
                    {cat.course_count} Kursus
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/categories/${cat.id}/edit`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        Edit
                      </Link>
                      <DeleteConfirmButton
                        action={deleteCategory}
                        hiddenFields={{ id: cat.id }}
                        confirmMessage={`Yakin hapus kategori "${cat.name}"?`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Belum ada kategori.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
