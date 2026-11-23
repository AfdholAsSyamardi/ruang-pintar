import { cookies } from "next/headers";
import pool from "./db";
import { decrypt, SESSION_COOKIE_NAME } from "./session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await decrypt(token);
  if (!session?.id) return null;

  try {
    const { rows } = await pool.query(
      `SELECT
        id,
        username,
        email,
        role,
        status,
        approved_at,
        created_at,
        (
          role = 'teacher'
          AND approved_at IS NOT NULL
          AND approved_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
        ) AS is_new_teacher
       FROM users
       WHERE id = $1`,
      [session.id]
    );
    const user = rows[0] || null;
    if (user && (user.role === "teacher" || user.role === "admin")) {
      await pool.query("DELETE FROM enrollments WHERE student_id = $1", [
        user.id,
      ]);
    }
    return user;
  } catch (error) {
    console.error("Gagal mengambil user saat ini:", error);
    return null;
  }
}
