import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateCategory } from "@/app/dashboard/actions";
import { parsePositiveInt } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params, searchParams }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const sp = await searchParams;
  const categoryId = parsePositiveInt(id);
  if (!categoryId) {
    notFound();
  }

  const { rows } = await pool.query(
    "SELECT id, name FROM categories WHERE id = $1",
    [categoryId]
  );
  const category = rows[0];
  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href="/dashboard/categories"
          className="text-xs font-bold text-emerald-700 hover:underline"
        >
          ← Kembali ke Category Management
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Edit Kategori #{category.id}
        </h1>
      </div>

      {sp?.error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
          {sp.error}
        </div>
      )}

      <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <form action={updateCategory} className="space-y-4">
          <input type="hidden" name="id" value={category.id} />

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Nama Kategori
            </label>
            <input
              type="text"
              name="name"
              defaultValue={category.name}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              href="/dashboard/categories"
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
