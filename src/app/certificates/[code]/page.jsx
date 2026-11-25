import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import PrintCertificateButton from "@/components/PrintCertificateButton";

export const dynamic = "force-dynamic";

export default async function CertificateDetailPage({ params }) {
  const { code: rawCode } = await params;
  let code = "";
  try {
    code = decodeURIComponent(rawCode || "").trim();
  } catch {
    notFound();
  }
  if (!code) {
    notFound();
  }

  const { rows } = await pool.query(
    `SELECT
      cert.id,
      cert.certificate_code,
      cert.issued_at,
      s.username AS student_name,
      s.email AS student_email,
      c.id AS course_id,
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

  const cert = rows[0];
  if (!cert) {
    notFound();
  }

  return (
    <main className="flex-1 bg-slate-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
          <Link
            href={`/courses/${cert.course_id}`}
            className="text-sm font-bold text-slate-600 hover:text-emerald-700"
          >
            ← Kembali ke Kursus
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/certificates/verify?code=${encodeURIComponent(
                cert.certificate_code
              )}`}
              className="px-4 py-2.5 rounded-xl border border-emerald-200 bg-white text-emerald-700 text-sm font-bold hover:bg-emerald-50"
            >
              Verifikasi Keaslian
            </Link>
            <PrintCertificateButton />
          </div>
        </div>

        <section className="bg-white border-8 border-emerald-600 rounded-3xl p-8 sm:p-14 shadow-xl relative overflow-hidden">
          <div className="border-2 border-emerald-200 rounded-2xl p-6 sm:p-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold uppercase tracking-widest mb-6">
              Sertifikat Kelulusan Resmi • RuangPintar
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              SERTIFIKAT PENYELESAIAN
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Diberikan sebagai penghargaan kepada:
            </p>

            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-700 border-b-2 border-emerald-100 pb-4 mb-6 inline-block px-6">
              {cert.student_name}
            </p>

            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed mb-4">
              Telah berhasil menyelesaikan 100% seluruh materi pembelajaran pada
              kursus daring terstruktur:
            </p>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
              {cert.course_title}
            </h2>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-10">
              Kategori: {cert.category_name || "Umum"}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-100 text-left sm:text-center items-end">
              <div>
                <p className="text-xs text-slate-400 font-semibold">
                  Tanggal Terbit
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {new Date(cert.issued_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold">
                  Identifier Unik
                </p>
                <p className="text-sm font-mono font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block mt-1">
                  {cert.certificate_code}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold">
                  Instruktur Pengajar
                </p>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {cert.teacher_name || "Pengajar RuangPintar"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
