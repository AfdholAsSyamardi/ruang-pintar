"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  parsePositiveInt,
  isValidEmail,
  isValidDateString,
} from "@/lib/validation";

export async function createUser(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const username = (formData.get("username") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const password = (formData.get("password") || "").toString();
  const role = (formData.get("role") || "student").toString();

  if (
    !username ||
    !email ||
    !password ||
    username.length > 100 ||
    email.length > 100 ||
    !isValidEmail(email) ||
    !["admin", "teacher", "student"].includes(role)
  ) {
    redirect("/dashboard/users?error=Data+user+tidak+valid");
  }

  if (password.length < 6) {
    redirect("/dashboard/users?error=Kata+sandi+minimal+6+karakter");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const approvedAt = role === "teacher" ? new Date() : null;

  try {
    await pool.query(
      "INSERT INTO users (username, email, password, role, status, approved_at) VALUES ($1, $2, $3, $4, 'active', $5)",
      [username, email, hashedPassword, role, approvedAt]
    );
  } catch (error) {
    if (error.code === "23505") {
      redirect("/dashboard/users?error=Email+sudah+terdaftar");
    }
    throw error;
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard");
  revalidatePath("/");
  redirect("/dashboard/users?success=User+baru+berhasil+ditambahkan");
}

export async function updateUser(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const id = parsePositiveInt(formData.get("id")?.toString());
  if (!id) {
    redirect("/dashboard/users?error=ID+user+tidak+valid");
  }

  const username = (formData.get("username") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const password = (formData.get("password") || "").toString();
  const role = (formData.get("role") || "student").toString();
  const statusInput = (formData.get("status") || "active").toString();

  if (
    !username ||
    !email ||
    username.length > 100 ||
    email.length > 100 ||
    !isValidEmail(email) ||
    !["admin", "teacher", "student"].includes(role) ||
    !["active", "pending"].includes(statusInput)
  ) {
    redirect(`/dashboard/users/${id}/edit?error=Data+tidak+valid`);
  }

  if (id === currentUser.id && (role !== "admin" || statusInput !== "active")) {
    redirect(
      `/dashboard/users/${id}/edit?error=Tidak+dapat+mengubah+role+atau+status+akun+Admin+sendiri`
    );
  }

  if (password.trim() && password.length < 6) {
    redirect(
      `/dashboard/users/${id}/edit?error=Kata+sandi+baru+minimal+6+karakter`
    );
  }

  const { rows: existingRows } = await pool.query(
    "SELECT role, status, approved_at FROM users WHERE id = $1",
    [id]
  );
  if (existingRows.length === 0) {
    redirect("/dashboard/users");
  }

  const existing = existingRows[0];
  let finalStatus = statusInput;
  let approvedAt = existing.approved_at;

  if (role === "teacher") {
    finalStatus = "active";
    if (
      existing.role !== "teacher" ||
      existing.status === "pending" ||
      !approvedAt
    ) {
      approvedAt = new Date();
    }
  } else if (role === "admin") {
    finalStatus = "active";
    approvedAt = null;
  } else {
    approvedAt = null;
  }

  try {
    if (password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET username = $1, email = $2, password = $3, role = $4, status = $5, approved_at = $6 WHERE id = $7",
        [username, email, hashedPassword, role, finalStatus, approvedAt, id]
      );
    } else {
      await pool.query(
        "UPDATE users SET username = $1, email = $2, role = $3, status = $4, approved_at = $5 WHERE id = $6",
        [username, email, role, finalStatus, approvedAt, id]
      );
    }
  } catch (error) {
    if (error.code === "23505") {
      redirect(
        `/dashboard/users/${id}/edit?error=Email+sudah+digunakan+akun+lain`
      );
    }
    throw error;
  }

  if (role === "teacher" || role === "admin") {
    await pool.query("DELETE FROM enrollments WHERE student_id = $1", [id]);
  }

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/courses");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/dashboard/users?success=Data+user+berhasil+diperbarui");
}

export async function approveTeacher(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const id = parsePositiveInt(formData.get("id")?.toString());
  if (!id || id === currentUser.id) {
    redirect("/dashboard/users?error=Aksi+verifikasi+tidak+valid");
  }

  const { rowCount } = await pool.query(
    "UPDATE users SET role = 'teacher', status = 'active', approved_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'pending' AND role = 'student'",
    [id]
  );
  if (rowCount === 0) {
    redirect("/dashboard/users?error=User+tidak+dalam+status+pending+pengajar");
  }
  await pool.query("DELETE FROM enrollments WHERE student_id = $1", [id]);

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/courses");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/dashboard/users?success=Pengajar+berhasil+diverifikasi");
}

export async function deleteUser(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const id = parsePositiveInt(formData.get("id")?.toString());
  if (!id || id === currentUser.id) {
    redirect("/dashboard/users?error=Tidak+dapat+menghapus+akun+sendiri");
  }

  await pool.query("DELETE FROM users WHERE id = $1", [id]);

  revalidatePath("/dashboard/users");
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  revalidatePath("/profile");
  revalidatePath("/");
  redirect("/dashboard/users?success=User+berhasil+dihapus");
}

export async function createCategory(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const name = (formData.get("name") || "").toString().trim();
  if (!name || name.length > 100) {
    redirect(
      "/dashboard/categories?error=Nama+kategori+wajib+diisi+(maksimal+100+karakter)"
    );
  }

  try {
    await pool.query("INSERT INTO categories (name) VALUES ($1)", [name]);
  } catch (error) {
    if (error.code === "23505") {
      redirect("/dashboard/categories?error=Nama+kategori+sudah+ada");
    }
    throw error;
  }

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/dashboard/categories?success=Kategori+berhasil+ditambahkan");
}

export async function updateCategory(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const id = parsePositiveInt(formData.get("id")?.toString());
  const name = (formData.get("name") || "").toString().trim();
  if (!id || !name || name.length > 100) {
    redirect("/dashboard/categories?error=Data+kategori+tidak+valid");
  }

  try {
    await pool.query("UPDATE categories SET name = $1 WHERE id = $2", [
      name,
      id,
    ]);
  } catch (error) {
    if (error.code === "23505") {
      redirect(
        `/dashboard/categories/${id}/edit?error=Nama+kategori+sudah+ada`
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/dashboard/categories?success=Kategori+berhasil+diperbarui");
}

export async function deleteCategory(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const id = parsePositiveInt(formData.get("id")?.toString());
  if (!id) return;

  await pool.query("DELETE FROM categories WHERE id = $1", [id]);

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/dashboard/categories?success=Kategori+berhasil+dihapus");
}

export async function createCourse(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const title = (formData.get("title") || "").toString().trim();
  const description = (formData.get("description") || "").toString().trim();
  const categoryId = parsePositiveInt(formData.get("category_id")?.toString());
  const startDateRaw = (formData.get("start_date") || "").toString().trim();
  const endDateRaw = (formData.get("end_date") || "").toString().trim();

  const startDate = startDateRaw || null;
  const endDate = endDateRaw || null;

  let teacherId = currentUser.id;
  if (currentUser.role === "admin") {
    const selectedTeacher = parsePositiveInt(
      formData.get("teacher_id")?.toString()
    );
    if (!selectedTeacher) {
      redirect("/dashboard/courses?error=Pilih+teacher+yang+valid");
    }
    const { rows: teacherCheck } = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'teacher'",
      [selectedTeacher]
    );
    if (teacherCheck.length === 0) {
      redirect("/dashboard/courses?error=Pengguna+yang+dipilih+bukan+teacher+aktif");
    }
    teacherId = selectedTeacher;
  }

  if (!title || title.length > 255 || !description || !categoryId) {
    redirect("/dashboard/courses?error=Semua+field+wajib+harus+diisi+dengan+benar");
  }

  if (
    (startDate && !isValidDateString(startDate)) ||
    (endDate && !isValidDateString(endDate))
  ) {
    redirect("/dashboard/courses?error=Format+tanggal+tidak+valid");
  }

  if (startDate && endDate && endDate < startDate) {
    redirect(
      "/dashboard/courses?error=Tanggal+selesai+tidak+boleh+sebelum+tanggal+mulai"
    );
  }

  try {
    await pool.query(
      `INSERT INTO courses (title, description, category_id, teacher_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [title, description, categoryId, teacherId, startDate, endDate]
    );
  } catch (error) {
    if (error.code === "23503") {
      redirect("/dashboard/courses?error=Kategori+atau+teacher+tidak+ditemukan");
    }
    throw error;
  }

  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  revalidatePath("/profile");
  revalidatePath("/");
  redirect("/dashboard/courses?success=Course+baru+berhasil+dibuat");
}

export async function updateCourse(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const id = parsePositiveInt(formData.get("id")?.toString());
  if (!id) {
    redirect("/dashboard/courses?error=ID+course+tidak+valid");
  }

  const title = (formData.get("title") || "").toString().trim();
  const description = (formData.get("description") || "").toString().trim();
  const categoryId = parsePositiveInt(formData.get("category_id")?.toString());
  const startDateRaw = (formData.get("start_date") || "").toString().trim();
  const endDateRaw = (formData.get("end_date") || "").toString().trim();

  const startDate = startDateRaw || null;
  const endDate = endDateRaw || null;

  if (!title || title.length > 255 || !description || !categoryId) {
    redirect(`/dashboard/courses/${id}/edit?error=Data+course+tidak+valid`);
  }

  if (
    (startDate && !isValidDateString(startDate)) ||
    (endDate && !isValidDateString(endDate))
  ) {
    redirect(`/dashboard/courses/${id}/edit?error=Format+tanggal+tidak+valid`);
  }

  if (startDate && endDate && endDate < startDate) {
    redirect(
      `/dashboard/courses/${id}/edit?error=Tanggal+selesai+tidak+boleh+sebelum+tanggal+mulai`
    );
  }

  try {
    if (currentUser.role === "admin") {
      const selectedTeacher = parsePositiveInt(
        formData.get("teacher_id")?.toString()
      );
      if (!selectedTeacher) {
        redirect(
          `/dashboard/courses/${id}/edit?error=Pilih+teacher+yang+valid`
        );
      }
      const { rows: teacherCheck } = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'teacher'",
        [selectedTeacher]
      );
      if (teacherCheck.length === 0) {
        redirect(
          `/dashboard/courses/${id}/edit?error=Pengguna+yang+dipilih+bukan+teacher+aktif`
        );
      }
      await pool.query(
        `UPDATE courses
         SET title = $1, description = $2, category_id = $3, teacher_id = $4, start_date = $5, end_date = $6
         WHERE id = $7`,
        [title, description, categoryId, selectedTeacher, startDate, endDate, id]
      );
    } else {
      await pool.query(
        `UPDATE courses
         SET title = $1, description = $2, category_id = $3, start_date = $4, end_date = $5
         WHERE id = $6 AND teacher_id = $7`,
        [title, description, categoryId, startDate, endDate, id, currentUser.id]
      );
    }
  } catch (error) {
    if (error.code === "23503") {
      redirect(
        `/dashboard/courses/${id}/edit?error=Kategori+atau+teacher+tidak+ditemukan`
      );
    }
    throw error;
  }

  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  revalidatePath(`/courses/${id}`);
  revalidatePath("/courses");
  revalidatePath("/profile");
  revalidatePath("/");
  redirect("/dashboard/courses?success=Course+berhasil+diperbarui");
}

export async function deleteCourse(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const id = parsePositiveInt(formData.get("id")?.toString());
  if (!id) return;

  if (currentUser.role === "admin") {
    await pool.query("DELETE FROM courses WHERE id = $1", [id]);
  } else {
    await pool.query("DELETE FROM courses WHERE id = $1 AND teacher_id = $2", [
      id,
      currentUser.id,
    ]);
  }

  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  revalidatePath("/courses");
  revalidatePath("/profile");
  revalidatePath("/");
  redirect("/dashboard/courses?success=Course+berhasil+dihapus");
}

export async function createContent(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const courseId = parsePositiveInt(formData.get("course_id")?.toString());
  if (!courseId) {
    redirect("/dashboard/courses?error=Course+tidak+valid");
  }

  const title = (formData.get("title") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();
  const orderIndex =
    parsePositiveInt(formData.get("order_index")?.toString()) || 1;

  if (!title || title.length > 255 || !content) {
    redirect(
      `/dashboard/courses/${courseId}/contents?error=Judul+dan+isi+materi+wajib+diisi`
    );
  }

  const { rows: courseRows } = await pool.query(
    "SELECT id, teacher_id FROM courses WHERE id = $1",
    [courseId]
  );
  if (courseRows.length === 0) {
    redirect("/dashboard/courses");
  }
  if (
    currentUser.role === "teacher" &&
    courseRows[0].teacher_id !== currentUser.id
  ) {
    redirect("/dashboard/courses?error=Akses+ditolak");
  }

  await pool.query(
    "INSERT INTO course_contents (course_id, title, content, order_index) VALUES ($1, $2, $3, $4)",
    [courseId, title, content, orderIndex]
  );

  revalidatePath(`/dashboard/courses/${courseId}/contents`);
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath("/profile");
  revalidatePath("/");
  redirect(
    `/dashboard/courses/${courseId}/contents?success=Materi+baru+berhasil+ditambahkan`
  );
}

export async function updateContent(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const id = parsePositiveInt(formData.get("id")?.toString());
  const courseId = parsePositiveInt(formData.get("course_id")?.toString());
  if (!id || !courseId) {
    redirect("/dashboard/courses?error=Data+materi+tidak+valid");
  }

  const title = (formData.get("title") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();
  const orderIndex =
    parsePositiveInt(formData.get("order_index")?.toString()) || 1;

  if (!title || title.length > 255 || !content) {
    redirect(
      `/dashboard/courses/${courseId}/contents/${id}/edit?error=Judul+dan+isi+materi+wajib+diisi`
    );
  }

  if (currentUser.role === "admin") {
    await pool.query(
      "UPDATE course_contents SET title = $1, content = $2, order_index = $3 WHERE id = $4 AND course_id = $5",
      [title, content, orderIndex, id, courseId]
    );
  } else {
    await pool.query(
      `UPDATE course_contents cc
       SET title = $1, content = $2, order_index = $3
       FROM courses c
       WHERE cc.course_id = c.id AND cc.id = $4 AND cc.course_id = $5 AND c.teacher_id = $6`,
      [title, content, orderIndex, id, courseId, currentUser.id]
    );
  }

  revalidatePath(`/dashboard/courses/${courseId}/contents`);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/profile");
  redirect(
    `/dashboard/courses/${courseId}/contents?success=Materi+berhasil+diperbarui`
  );
}

export async function deleteContent(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const id = parsePositiveInt(formData.get("id")?.toString());
  const courseId = parsePositiveInt(formData.get("course_id")?.toString());
  if (!id || !courseId) return;

  if (currentUser.role === "admin") {
    await pool.query(
      "DELETE FROM course_contents WHERE id = $1 AND course_id = $2",
      [id, courseId]
    );
  } else {
    await pool.query(
      `DELETE FROM course_contents cc
       USING courses c
       WHERE cc.course_id = c.id AND cc.id = $1 AND cc.course_id = $2 AND c.teacher_id = $3`,
      [id, courseId, currentUser.id]
    );
  }

  // Issue certificates for enrolled students who now reached 100% completion
  const { rows: totalRows } = await pool.query(
    "SELECT COUNT(*)::int AS total FROM course_contents WHERE course_id = $1",
    [courseId]
  );
  const remainingTotal = totalRows[0]?.total || 0;
  if (remainingTotal > 0) {
    const { rows: newlyCompletedStudents } = await pool.query(
      `SELECT e.student_id
       FROM enrollments e
       JOIN completed_contents comp ON comp.enrollment_id = e.id
       JOIN course_contents mat ON comp.content_id = mat.id AND mat.course_id = e.course_id
       LEFT JOIN certificates cert ON cert.student_id = e.student_id AND cert.course_id = e.course_id
       WHERE e.course_id = $1 AND cert.id IS NULL
       GROUP BY e.student_id
       HAVING COUNT(DISTINCT comp.content_id) >= $2`,
      [courseId, remainingTotal]
    );

    const year = new Date().getFullYear();
    for (const row of newlyCompletedStudents) {
      const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
      const code = `RP-${year}-C${String(courseId).padStart(
        2,
        "0"
      )}-U${String(row.student_id).padStart(2, "0")}-${randomHex}`;
      await pool.query(
        "INSERT INTO certificates (certificate_code, student_id, course_id) VALUES ($1, $2, $3) ON CONFLICT (student_id, course_id) DO NOTHING",
        [code, row.student_id, courseId]
      );
    }
  }

  revalidatePath(`/dashboard/courses/${courseId}/contents`);
  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath("/profile");
  revalidatePath("/");
  redirect(
    `/dashboard/courses/${courseId}/contents?success=Materi+berhasil+dihapus`
  );
}
