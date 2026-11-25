import Link from "next/link";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({ searchParams }) {
  const sp = await searchParams;
  const code = (sp?.code || "").trim();

  let certificate = null;
  let searched = false;
  let dbError = false;

  if (code) {
    searched = true;
    try {
      const { rows } = await pool.query(
        `SELECT
          cert.certificate_code,
          cert.issued_at,
          s.username AS student_name,
          c.title AS course_title,
          cat.name AS category_name,
          t.username AS teacher_name
         FROM certificates cert
         JOIN users s ON cert.student_id = s.id
         JOIN courses c ON cert.course_id = c.id
         LEFT JOIN categories cat ON c.category_id = cat.id
         LEFT JOIN users t ON c.teacher_id = t.id
         WHERE UPPER(cert.certificate_code) = UPPER($1)`,
        [code]
      );
      certificate = rows[0] || null;
    } catch (error) {
      console.error("Gagal memverifikasi sertifikat:", error);
      dbError = true;
    }
  }

  return (
    <main className="flex-1 bg-slate-50/50 py-14 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-emerald-100 rounded-3xl p-8 shadow-xs">
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
            Verifikasi Sertifikat Digital
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
            Cek Keaslian Sertifikat
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            Masukkan kode unik (Identifier) yang tertera pada sertifikat untuk
            memvalidasi keasliannya di database RuangPintar.
          </p>

          <form method="GET" action="/certificates/verify" className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              key={code}
              type="text"
              name="code"
              defaultValue={code}
              placeholder="Contoh: RP-2026-C01-U05-8F4A2B"
              required
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer"
            >
              Periksa Kode
            </button>
          </form>

          {searched && certificate && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-extrabold uppercase">
                  ✓ Sertifikat Terverifikasi Asli
                </span>
                <span className="font-mono text-xs font-bold text-emerald-800">
                  {certificate.certificate_code}
                </span>
              </div>
              <div className="pt-2 space-y-1.5 text-sm">
                <p>
                  <span className="text-slate-500">Pemilik Sertifikat:</span>{" "}
                  <strong className="text-slate-900">
                    {certificate.student_name}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Kursus Diselesaikan:</span>{" "}
                  <strong className="text-slate-900">
                    {certificate.course_title}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Kategori:</span>{" "}
                  <strong className="text-slate-900">
                    {certificate.category_name || "Umum"}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Pengajar:</span>{" "}
                  <strong className="text-slate-900">
                    {certificate.teacher_name || "Pengajar RuangPintar"}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Tanggal Terbit:</span>{" "}
                  <strong className="text-slate-900">
                    {new Date(certificate.issued_at).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" }
                    )}
                  </strong>
                </p>
              </div>
              <div className="pt-3">
                <Link
                  href={`/certificates/${certificate.certificate_code}`}
                  className="inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Lihat Tampilan Sertifikat →
                </Link>
              </div>
            </div>
          )}

          {searched && dbError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700 font-semibold">
              Terjadi gangguan saat memeriksa sertifikat. Silakan coba lagi
              beberapa saat.
            </div>
          )}

          {searched && !dbError && !certificate && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-700 font-semibold">
              Kode sertifikat <span className="font-mono">{code}</span> tidak
              ditemukan atau tidak valid.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
