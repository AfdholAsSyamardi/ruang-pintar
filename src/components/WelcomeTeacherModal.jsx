"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function WelcomeTeacherModal({
  userId,
  username,
  approvedAt,
  approvedAtFormatted,
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const storageKey = `ruangpintar_welcome_teacher_${userId}_${approvedAt || "init"}`;
    const alreadySeen = localStorage.getItem(storageKey);
    if (!alreadySeen) {
      localStorage.setItem(storageKey, "true");
      const timerId = setTimeout(() => {
        setOpen(true);
      }, 0);
      return () => clearTimeout(timerId);
    }
  }, [userId, approvedAt]);

  return (
    <>
      <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wide mb-1">
              Guru Baru Terverifikasi
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-emerald-950">
              Selamat Datang Pengajar Baru, {username}!
            </h3>
            <p className="text-sm text-emerald-800 mt-0.5">
              Akun pengajar Anda telah disetujui Admin ({approvedAtFormatted}). Anda
              kini dapat membuat kelas dan mengelola materi pembelajaran.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/courses"
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold whitespace-nowrap text-center transition-colors"
        >
          Kelola Kelas Sekarang
        </Link>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-emerald-200 rounded-3xl max-w-md w-full p-7 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-9 h-9"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
                />
              </svg>
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              Verifikasi Berhasil
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
              Selamat Datang, Guru Baru!
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Halo <span className="font-bold text-slate-800">{username}</span>, akun
              Anda baru saja disetujui sebagai <span className="font-bold text-emerald-700">Teacher</span> di RuangPintar. Mulai susun kelas dan materi terbaik untuk siswa Anda!
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link
                href="/dashboard/courses"
                onClick={() => setOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors"
              >
                Buka Kelola Kelas
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
