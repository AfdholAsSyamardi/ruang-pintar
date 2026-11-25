import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = (searchParams.get("code") || "").trim();

    if (!code) {
      return NextResponse.json(
        { valid: false, message: "Kode sertifikat wajib diisi." },
        { status: 400 }
      );
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

    if (rows.length === 0) {
      return NextResponse.json(
        { valid: false, message: "Sertifikat tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { valid: true, certificate: rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error GET /api/certificates/verify:", error);
    return NextResponse.json(
      { valid: false, message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
