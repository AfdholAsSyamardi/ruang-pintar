"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    registerAs: "student",
  });
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setIsSuccess(false);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (res.ok) {
        setIsSuccess(true);
        setMessage(data.message);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setIsSuccess(false);
        setMessage(data.message || "Registrasi gagal.");
      }
    } catch {
      setIsSuccess(false);
      setMessage("Gagal terhubung ke server.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-slate-50/60 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-100 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 sm:p-10 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r border-emerald-100">
          <span className="inline-block w-fit mx-auto px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider mb-5">
            Pendaftaran RuangPintar
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-4">
            {formData.registerAs === "student"
              ? "Register as Student"
              : "Register as Teacher"}
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6 max-w-md mx-auto">
            {formData.registerAs === "student"
              ? "Daftar sebagai siswa untuk mengikuti berbagai kursus, menandai progres belajar, berdiskusi, dan mendapatkan sertifikat digital."
              : "Daftar sebagai pengajar untuk berbagi ilmu. Anda akan login sebagai Student terlebih dahulu dengan status pengajar 'Pending' hingga disetujui Admin."}
          </p>

          <div className="space-y-3 text-sm text-left w-full">
            <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
              <p className="font-bold text-emerald-800">
                1. Akses Awal Otomatis sebagai Student
              </p>
              <p className="text-slate-600 text-xs mt-1">
                Baik mendaftar sebagai Student maupun Teacher, akun langsung
                aktif dengan akses awal Student agar dapat langsung mencoba platform.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-xs">
              <p className="font-bold text-emerald-800">
                2. Verifikasi Admin untuk Pengajar
              </p>
              <p className="text-slate-600 text-xs mt-1">
                Pendaftar Teacher memiliki status Pending dan otomatis mendapatkan
                hak akses Teacher begitu Admin melakukan Approve.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 sm:p-10 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
            Buat Akun Baru
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Pilih peran pendaftaran Anda terlebih dahulu.
          </p>

          {message && (
            <div
              className={`mb-5 p-4 rounded-xl text-sm font-semibold border ${
                isSuccess
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Pilih Jenis Pendaftaran
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, registerAs: "student" }))
                  }
                  className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                    formData.registerAs === "student"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200"
                  }`}
                >
                  Register as Student
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, registerAs: "teacher" }))
                  }
                  className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all cursor-pointer ${
                    formData.registerAs === "teacher"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                      : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200"
                  }`}
                >
                  Register as Teacher
                </button>
              </div>
              {formData.registerAs === "teacher" && (
                <p className="mt-2.5 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-xl p-3 font-medium">
                  Info: Anda akan login dengan akses Student terlebih dahulu dengan
                  status pengajar <strong>Pending</strong> menunggu verifikasi Admin.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Nama Lengkap / Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Contoh: Nadia Putri"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
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
                name="password"
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimal 6 karakter"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading
                ? "Mendaftarkan..."
                : formData.registerAs === "student"
                ? "Daftar sebagai Student →"
                : "Daftar sebagai Teacher →"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center text-sm text-slate-600">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
