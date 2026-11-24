"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const menuLinks = [
    { label: "Ringkasan & Profil", href: "/dashboard", exact: true },
  ];

  if (user.role === "admin") {
    menuLinks.push(
      { section: "Admin CMS" },
      { label: "User Management", href: "/dashboard/users" },
      { label: "Category Management", href: "/dashboard/categories" },
      { label: "Course Management", href: "/dashboard/courses" }
    );
  } else if (user.role === "teacher") {
    menuLinks.push(
      { section: "Teacher CMS" },
      { label: "Kelola Kelas & Materi", href: "/dashboard/courses" }
    );
  } else {
    menuLinks.push(
      { section: "Pembelajaran" },
      { label: "Katalog Kursus", href: "/courses" },
      { label: "Cek Sertifikat", href: "/certificates/verify" }
    );
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  function renderNavLinks() {
    return (
      <nav className="space-y-1.5">
        {menuLinks.map((item, idx) => {
          if (item.section) {
            return (
              <p
                key={`sec-${idx}`}
                className="px-3 pt-4 pb-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400"
              >
                {item.section}
              </p>
            );
          }

          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3.5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-emerald-100 px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center">
            RP
          </span>
          <span className="font-extrabold text-lg text-slate-900">
            Ruang<span className="text-emerald-600">Pintar</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="px-3 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-bold"
        >
          {mobileOpen ? "Tutup Menu" : "Menu CMS"}
        </button>
      </header>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-emerald-100 px-4 py-4 space-y-4">
          {renderNavLinks()}
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
            >
              Ke Beranda
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold"
            >
              {loggingOut ? "Keluar..." : "Keluar"}
            </button>
          </div>
        </div>
      )}

      <aside className="hidden lg:flex lg:flex-col lg:w-68 lg:fixed lg:inset-y-0 bg-white border-r border-emerald-100 z-30">
        <div className="h-18 px-6 border-b border-emerald-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
              RP
            </div>
            <span className="font-extrabold text-xl text-slate-900">
              Ruang<span className="text-emerald-600">Pintar</span>
            </span>
          </Link>
        </div>

        <div className="px-5 py-4 border-b border-slate-100 bg-emerald-50/40">
          <p className="text-sm font-extrabold text-slate-900 truncate">
            {user.username}
          </p>
          <p className="text-xs text-slate-500 truncate">{user.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
              {user.role}
            </span>
            {user.status === "pending" && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase">
                Pending Teacher
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">{renderNavLinks()}</div>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <Link
            href="/"
            className="block w-full text-center py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            ← Halaman Utama
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors cursor-pointer"
          >
            {loggingOut ? "Keluar..." : "Keluar Akun"}
          </button>
        </div>
      </aside>
    </>
  );
}
