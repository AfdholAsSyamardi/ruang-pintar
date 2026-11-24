import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateUser, approveTeacher } from "@/app/dashboard/actions";

export const dynamic = "force-dynamic";

export default async function EditUserPage({ params, searchParams }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const sp = await searchParams;
  if (!Number.isInteger(Number(id))) {
    notFound();
  }

  const { rows } = await pool.query(
    "SELECT id, username, email, role, status, approved_at FROM users WHERE id = $1",
    [Number(id)]
  );
  const targetUser = rows[0];
  if (!targetUser) {
    notFound();
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Link
          href="/dashboard/users"
          className="text-xs font-bold text-emerald-700 hover:underline"
        >
          ← Kembali ke User Management
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Edit Pengguna #{targetUser.id}
        </h1>
      </div>

      {sp?.error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
          {sp.error}
        </div>
      )}

      {targetUser.status === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold text-amber-950">
              Pendaftar Teacher (Pending)
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              Klik tombol di samping untuk langsung menyetujui user ini menjadi
              Teacher dan mencatat waktu persetujuan.
            </p>
          </div>
          <form action={approveTeacher}>
            <input type="hidden" name="id" value={targetUser.id} />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              ✓ Approve Teacher
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <form action={updateUser} className="space-y-4">
          <input type="hidden" name="id" value={targetUser.id} />

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Username / Nama Lengkap
            </label>
            <input
              type="text"
              name="username"
              defaultValue={targetUser.username}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="email"
              defaultValue={targetUser.email}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Kata Sandi Baru (Opsional)
            </label>
            <input
              type="password"
              name="password"
              placeholder="Kosongkan jika tidak ingin mengubah kata sandi"
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Role
              </label>
              <select
                name="role"
                defaultValue={targetUser.role}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Status Akun
              </label>
              <select
                name="status"
                defaultValue={targetUser.status}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center gap-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
            >
              Simpan Perubahan
            </button>
            <Link
              href="/dashboard/users"
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
