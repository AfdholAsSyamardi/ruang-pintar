import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import CourseCatalogClient from "@/components/CourseCatalogClient";

export const dynamic = "force-dynamic";

export default async function CourseCatalogPage({ searchParams }) {
  const sp = await searchParams;
  const searchQuery = (sp?.q || "").trim();
  const categoryFilter = (sp?.category || "").trim();

  const user = await getCurrentUser();

  let categories = [];
  let courses = [];
  const enrolledObj = {};

  try {
    const catRes = await pool.query(
      "SELECT id, name FROM categories ORDER BY name ASC"
    );
    categories = catRes.rows;

    const coursesRes = await pool.query(
      `SELECT
        c.id,
        c.title,
        c.description,
        c.category_id,
        c.teacher_id,
        c.start_date,
        c.end_date,
        cat.name AS category_name,
        u.username AS teacher_name,
        u.email AS teacher_email,
        COUNT(DISTINCT e.id)::int AS student_count,
        COUNT(DISTINCT cc.id)::int AS content_count
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN users u ON c.teacher_id = u.id
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN course_contents cc ON cc.course_id = c.id
      GROUP BY c.id, cat.id, u.id
      ORDER BY c.created_at DESC`
    );
    courses = coursesRes.rows;

    if (user && user.role === "student") {
      const enrollRes = await pool.query(
        `SELECT
          e.course_id,
          COUNT(DISTINCT comp.content_id)::int AS completed_count
         FROM enrollments e
         LEFT JOIN completed_contents comp ON comp.enrollment_id = e.id
         WHERE e.student_id = $1
         GROUP BY e.course_id`,
        [user.id]
      );
      for (const row of enrollRes.rows) {
        enrolledObj[row.course_id] = row.completed_count;
      }
    }
  } catch (error) {
    console.error("Gagal memuat katalog kursus:", error);
  }

  return (
    <main className="flex-1 bg-slate-50/50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Semua Program Belajar
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">
            Katalog Kursus RuangPintar
          </h1>
          <p className="text-slate-600 mt-2 max-w-2xl">
            Pilih kelas yang ingin Anda pelajari, hubungi pengajar bila perlu
            konsultasi, dan pantau progres belajar Anda secara langsung.
          </p>
        </div>

        <CourseCatalogClient
          key={`${searchQuery}-${categoryFilter}`}
          courses={courses}
          categories={categories}
          user={user ? { id: user.id, role: user.role } : null}
          enrolledObj={enrolledObj}
          initialQuery={searchQuery}
          initialCategory={categoryFilter}
        />
      </div>
    </main>
  );
}
