import Link from "next/link";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  createUser,
  approveTeacher,
  deleteUser,
} from "@/app/dashboard/actions";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";

export const dynamic = "force-dynamic";

export default async function UsersManagementPage({ searchParams }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const searchQuery = (sp?.q || "").trim();
  const requestedPage = Math.max(1, Math.floor(Number(sp?.page) || 1));
  const limit = 8;
  const successMsg = sp?.success;
  const errorMsg = sp?.error;

  const { rows: pendingTeachers } = await pool.query(
    `SELECT id, username, email, created_at
     FROM users
     WHERE status = 'pending'
     ORDER BY created_at ASC`
  );

  const params = [];
  let whereSql = "";
  if (searchQuery) {
    params.push(`%${searchQuery}%`);
    whereSql = `WHERE username ILIKE $1 OR email ILIKE $1 OR role ILIKE $1`;
  }

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM users ${whereSql}`,
    params
  );
  const totalUsers = countRes.rows[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
  const page = Math.min(requestedPage, totalPages);
  const offset = (page - 1) * limit;

  const listParams = [...params, limit, offset];
  const { rows: users } = await pool.query(
    `SELECT id, username, email, role, status, approved_at, created_at
     FROM users
     ${whereSql}
     ORDER BY CASE WHEN status = 'pending' THEN 0 ELSE 1 END, id DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    listParams
  );

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Admin CMS
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
          User Management & Verifikasi Teacher
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Kelola seluruh akun pengguna dan setujui pendaftaran pengajar baru.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      {pendingTeachers.length > 0 && (
        <section className="bg-amber-50/90 border border-amber-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-amber-950">
                Menunggu Verifikasi Pengajar ({pendingTeachers.length})
              </h2>
              <p className="text-xs text-amber-800">
                User berikut mendaftar melalui form Teacher dan berstatus Pending.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingTeachers.map((pt) => (
              <div
                key={pt.id}
                className="bg-white border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-slate-900">{pt.username}</p>
                  <p className="text-xs text-slate-500">
                    {pt.email} • Daftar pada{" "}
                    {new Date(pt.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={approveTeacher}>
                    <input type="hidden" name="id" value={pt.id} />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      ✓ Approve Teacher
                    </button>
                  </form>
                  <Link
                    href={`/dashboard/users/${pt.id}/edit`}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700"
                  >
                    Detail
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <h2 className="text-lg font-extrabold text-slate-900 mb-4">
          Tambah Pengguna Baru
        </h2>
        <form
          action={createUser}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3"
        >
          <input
            type="text"
            name="username"
            maxLength={100}
            required
            placeholder="Username / Nama"
            className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="email"
            name="email"
            maxLength={100}
            required
            placeholder="Email"
            className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <input
            type="password"
            name="password"
            required
            minLength={6}
            placeholder="Kata sandi"
            className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <select
            name="role"
            defaultValue="student"
            className="rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 transition-colors cursor-pointer"
          >
            + Tambah User
          </button>
        </form>
      </section>

      <section className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-lg font-extrabold text-slate-900">
            Daftar Pengguna ({totalUsers})
          </h2>

          <form method="GET" action="/dashboard/users" className="flex gap-2">
            <input
              key={searchQuery}
              type="text"
              name="q"
              defaultValue={searchQuery}
              placeholder="Cari nama/email/role..."
              className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              Cari
            </button>
            {searchQuery && (
              <Link
                href="/dashboard/users"
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold flex items-center"
              >
                Reset
              </Link>
            )}
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="py-3 pr-4">ID</th>
                <th className="py-3 pr-4">Username</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Role</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">Approved At</th>
                <th className="py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 pr-4 font-mono text-xs text-slate-500">
                    #{u.id}
                  </td>
                  <td className="py-3.5 pr-4 font-bold text-slate-900">
                    {u.username}
                  </td>
                  <td className="py-3.5 pr-4 text-slate-600">{u.email}</td>
                  <td className="py-3.5 pr-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${
                        u.role === "admin"
                          ? "bg-teal-100 text-teal-800"
                          : u.role === "teacher"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4">
                    {u.status === "pending" ? (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase">
                        Pending Teacher
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-xs text-slate-500">
                    {u.approved_at
                      ? new Date(u.approved_at).toLocaleString("id-ID")
                      : "-"}
                  </td>
                  <td className="py-3.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {u.status === "pending" && (
                        <form action={approveTeacher}>
                          <input type="hidden" name="id" value={u.id} />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                        </form>
                      )}
                      <Link
                        href={`/dashboard/users/${u.id}/edit`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                      >
                        Edit
                      </Link>
                      {u.id !== currentUser.id && (
                        <DeleteConfirmButton
                          action={deleteUser}
                          hiddenFields={{ id: u.id }}
                          confirmMessage={`Yakin hapus pengguna ${u.username}?`}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/users?page=${page - 1}${
                    searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
                  }`}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  ← Sebelumnya
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/dashboard/users?page=${page + 1}${
                    searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""
                  }`}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Berikutnya →
                </Link>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
