"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <footer className="no-print bg-white border-t border-emerald-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-sm">
            RP
          </div>
          <div>
            <span className="font-extrabold text-slate-900">
              Ruang<span className="text-emerald-600">Pintar</span>
            </span>
            <p className="text-xs text-slate-500">
              Platform Kursus Daring Interaktif & Terstruktur
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-emerald-600 transition-colors">
            Beranda
          </Link>
          <Link
            href="/courses"
            className="hover:text-emerald-600 transition-colors"
          >
            Katalog Kursus
          </Link>
          <Link
            href="/certificates/verify"
            className="hover:text-emerald-600 transition-colors"
          >
            Verifikasi Sertifikat
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} RuangPintar. Praktikum Pemrograman Web.
        </p>
      </div>
    </footer>
  );
}
