"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        const target = data?.user?.role === "student" ? "/profile" : "/dashboard";
        router.push(target);
        router.refresh();
      } else {
        setErrorMsg(data.message || "Gagal masuk ke akun.");
      }
    } catch {
      setErrorMsg("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-slate-50/60 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-emerald-50 text-xs font-bold uppercase tracking-wider mb-6">
              Selamat Datang Kembali
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight mb-4">
              Fokus Belajar & Berkembang di RuangPintar
            </h1>
            <p className="text-emerald-50/90 text-sm sm:text-base leading-relaxed">
              Masuk sebagai Admin, Teacher, atau Student untuk mengakses materi
              terstruktur, pantau progres belajar, dan raih sertifikat digital.
            </p>
          </div>

          <div className="mt-8 bg-white/10 border border-white/15 rounded-2xl p-5 space-y-2.5 text-xs text-emerald-50">
            <p className="font-extrabold uppercase tracking-wider text-white">
              Ruang Fokus Pembelajaran Daring
            </p>
            <p className="leading-relaxed">
              Nikmati pengalaman belajar bebas distraksi dengan pelacakan
              progres otomatis, forum diskusi per materi, dan sertifikat digital
              terverifikasi.
            </p>
          </div>
        </div>

        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Masuk ke Akun
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Gunakan email dan kata sandi yang telah terdaftar.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? "Memeriksa Akun..." : "Masuk Sekarang →"}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-slate-100 text-center text-sm text-slate-600">
            Belum memiliki akun?{" "}
            <Link
              href="/register"
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
