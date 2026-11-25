"use client";

import Link from "next/link";

export default function GlobalErrorPage({ reset }) {
  return (
    <main className="flex-1 bg-slate-50/50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white border border-red-100 rounded-3xl p-8 sm:p-10 text-center shadow-xs">
        <span className="inline-block px-3.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-extrabold uppercase tracking-wider mb-4">
          Terjadi Kesalahan
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
          Gagal Memuat Halaman
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-7">
          Terjadi gangguan sementara pada sistem atau koneksi database. Silakan
          coba muat ulang halaman.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors"
          >
            Ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
