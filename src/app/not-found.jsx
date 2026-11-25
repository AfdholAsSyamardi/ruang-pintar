import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex-1 bg-slate-50/50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white border border-emerald-100 rounded-3xl p-8 sm:p-10 text-center shadow-xs">
        <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-wider mb-4">
          404 • Halaman Tidak Ditemukan
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
          Halaman Tidak Tersedia
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed mb-7">
          Kursus, sertifikat, atau halaman yang Anda cari tidak ditemukan atau
          sudah dihapus.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/courses"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-bold transition-colors"
          >
            Jelajahi Kursus
          </Link>
        </div>
      </div>
    </main>
  );
}
