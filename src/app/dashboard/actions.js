"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

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
    !["admin", "teacher", "student"].includes(role)
  ) {
    redirect("/dashboard/users?error=Data+user+tidak+valid");
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
  redirect("/dashboard/users?success=User+baru+berhasil+ditambahkan");
}

export async function updateUser(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const id = Number(formData.get("id"));
  const username = (formData.get("username") || "").toString().trim();
  const email = (formData.get("email") || "").toString().trim().toLowerCase();
  const password = (formData.get("password") || "").toString();
  const role = (formData.get("role") || "student").toString();
  const statusInput = (formData.get("status") || "active").toString();

  if (
    !Number.isInteger(id) ||
    !username ||
    !email ||
    !["admin", "teacher", "student"].includes(role) ||
    !["active", "pending"].includes(statusInput)
  ) {
    redirect(`/dashboard/users/${id}/edit?error=Data+tidak+valid`);
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
    if (existing.role !== "teacher" || existing.status === "pending" || !approvedAt) {
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
      redirect(`/dashboard/users/${id}/edit?error=Email+sudah+digunakan+akun+lain`);
    }
    throw error;
  }

  if (role === "teacher" || role === "admin") {
    await pool.query("DELETE FROM enrollments WHERE student_id = $1", [id]);
  }

  revalidatePath("/dashboard/users");
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

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await pool.query(
    "UPDATE users SET role = 'teacher', status = 'active', approved_at = CURRENT_TIMESTAMP WHERE id = $1",
    [id]
  );
  await pool.query("DELETE FROM enrollments WHERE student_id = $1", [id]);

  revalidatePath("/dashboard/users");
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

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id === currentUser.id) {
    redirect("/dashboard/users?error=Tidak+dapat+menghapus+akun+sendiri");
  }

  await pool.query("DELETE FROM users WHERE id = $1", [id]);

  revalidatePath("/dashboard/users");
  redirect("/dashboard/users?success=User+berhasil+dihapus");
}

export async function createCategory(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const name = (formData.get("name") || "").toString().trim();
  if (!name) {
    redirect("/dashboard/categories?error=Nama+kategori+wajib+diisi");
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
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/dashboard/categories?success=Kategori+berhasil+ditambahkan");
}

export async function updateCategory(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const id = Number(formData.get("id"));
  const name = (formData.get("name") || "").toString().trim();
  if (!Number.isInteger(id) || !name) {
    redirect("/dashboard/categories?error=Data+kategori+tidak+valid");
  }

  try {
    await pool.query("UPDATE categories SET name = $1 WHERE id = $2", [name, id]);
  } catch (error) {
    if (error.code === "23505") {
      redirect(`/dashboard/categories/${id}/edit?error=Nama+kategori+sudah+ada`);
    }
    throw error;
  }

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/dashboard/categories?success=Kategori+berhasil+diperbarui");
}

export async function deleteCategory(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    redirect("/dashboard");
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  await pool.query("DELETE FROM categories WHERE id = $1", [id]);

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/courses");
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
  const categoryId = Number(formData.get("category_id"));
  const startDateRaw = (formData.get("start_date") || "").toString().trim();
  const endDateRaw = (formData.get("end_date") || "").toString().trim();

  const startDate = startDateRaw || null;
  const endDate = endDateRaw || null;

  let teacherId = currentUser.id;
  if (currentUser.role === "admin") {
    const selectedTeacher = Number(formData.get("teacher_id"));
    if (!Number.isInteger(selectedTeacher) || selectedTeacher <= 0) {
      redirect("/dashboard/courses?error=Pilih+teacher+yang+valid");
    }
    teacherId = selectedTeacher;
  }

  if (!title || !description || !Number.isInteger(categoryId)) {
    redirect("/dashboard/courses?error=Semua+field+wajib+harus+diisi");
  }

  if (startDate && endDate && endDate < startDate) {
    redirect("/dashboard/courses?error=Tanggal+selesai+tidak+boleh+sebelum+tanggal+mulai");
  }

  await pool.query(
    `INSERT INTO courses (title, description, category_id, teacher_id, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [title, description, categoryId, teacherId, startDate, endDate]
  );

  revalidatePath("/dashboard/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/dashboard/courses?success=Course+baru+berhasil+dibuat");
}

export async function updateCourse(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const id = Number(formData.get("id"));
  const title = (formData.get("title") || "").toString().trim();
  const description = (formData.get("description") || "").toString().trim();
  const categoryId = Number(formData.get("category_id"));
  const startDateRaw = (formData.get("start_date") || "").toString().trim();
  const endDateRaw = (formData.get("end_date") || "").toString().trim();

  const startDate = startDateRaw || null;
  const endDate = endDateRaw || null;

  if (!Number.isInteger(id) || !title || !description || !Number.isInteger(categoryId)) {
    redirect(`/dashboard/courses/${id}/edit?error=Data+course+tidak+valid`);
  }

  if (startDate && endDate && endDate < startDate) {
    redirect(`/dashboard/courses/${id}/edit?error=Tanggal+selesai+tidak+boleh+sebelum+tanggal+mulai`);
  }

  if (currentUser.role === "admin") {
    const selectedTeacher = Number(formData.get("teacher_id"));
    if (!Number.isInteger(selectedTeacher)) {
      redirect(`/dashboard/courses/${id}/edit?error=Pilih+teacher+yang+valid`);
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

  revalidatePath("/dashboard/courses");
  revalidatePath(`/courses/${id}`);
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/dashboard/courses?success=Course+berhasil+diperbarui");
}

export async function deleteCourse(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  if (currentUser.role === "admin") {
    await pool.query("DELETE FROM courses WHERE id = $1", [id]);
  } else {
    await pool.query("DELETE FROM courses WHERE id = $1 AND teacher_id = $2", [
      id,
      currentUser.id,
    ]);
  }

  revalidatePath("/dashboard/courses");
  revalidatePath("/courses");
  revalidatePath("/");
  redirect("/dashboard/courses?success=Course+berhasil+dihapus");
}

export async function createContent(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const courseId = Number(formData.get("course_id"));
  const title = (formData.get("title") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();
  const orderIndex = Number(formData.get("order_index")) || 1;

  if (!Number.isInteger(courseId) || !title || !content) {
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
  revalidatePath(`/courses/${courseId}`);
  redirect(
    `/dashboard/courses/${courseId}/contents?success=Materi+baru+berhasil+ditambahkan`
  );
}

export async function updateContent(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const id = Number(formData.get("id"));
  const courseId = Number(formData.get("course_id"));
  const title = (formData.get("title") || "").toString().trim();
  const content = (formData.get("content") || "").toString().trim();
  const orderIndex = Number(formData.get("order_index")) || 1;

  if (!Number.isInteger(id) || !Number.isInteger(courseId) || !title || !content) {
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
  redirect(
    `/dashboard/courses/${courseId}/contents?success=Materi+berhasil+diperbarui`
  );
}

export async function deleteContent(formData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !["admin", "teacher"].includes(currentUser.role)) {
    redirect("/dashboard");
  }

  const id = Number(formData.get("id"));
  const courseId = Number(formData.get("course_id"));
  if (!Number.isInteger(id) || !Number.isInteger(courseId)) return;

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

  revalidatePath(`/dashboard/courses/${courseId}/contents`);
  revalidatePath(`/courses/${courseId}`);
  redirect(
    `/dashboard/courses/${courseId}/contents?success=Materi+berhasil+dihapus`
  );
}
