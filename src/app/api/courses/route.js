import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const categoryId = searchParams.get("category");

    const params = [];
    const conditions = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(
        `(c.title ILIKE $${params.length} OR c.description ILIKE $${params.length} OR u.username ILIKE $${params.length})`
      );
    }

    if (categoryId && Number.isInteger(Number(categoryId))) {
      params.push(Number(categoryId));
      conditions.push(`c.category_id = $${params.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const sql = `
      SELECT
        c.id,
        c.title,
        c.description,
        c.start_date,
        c.end_date,
        c.created_at,
        cat.id AS category_id,
        cat.name AS category_name,
        u.id AS teacher_id,
        u.username AS teacher_name,
        u.email AS teacher_email,
        COUNT(DISTINCT e.id)::int AS student_count,
        COUNT(DISTINCT cc.id)::int AS content_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_contents cc ON cc.course_id = c.id
      ${whereClause}
      GROUP BY c.id, cat.id, u.id
      ORDER BY student_count DESC, c.created_at DESC
    `;

    const { rows } = await pool.query(sql, params);
    return NextResponse.json({ courses: rows }, { status: 200 });
  } catch (error) {
    console.error("Error GET /api/courses:", error);
    return NextResponse.json(
      { message: "Gagal mengambil daftar kursus." },
      { status: 500 }
    );
  }
}
