"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/validation";

export async function enrollCourse(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const courseId = parsePositiveInt(formData.get("course_id")?.toString());
  const redirectToRaw = formData.get("redirect_to")?.toString() || "";
  const safeRedirectTo = redirectToRaw.startsWith("/") ? redirectToRaw : "";

  if (!courseId) {
    redirect("/courses");
  }

  if (user.role !== "student") {
    redirect(`/courses/${courseId}`);
  }

  const { rows: courseRows } = await pool.query(
    "SELECT id FROM courses WHERE id = $1",
    [courseId]
  );
  if (courseRows.length === 0) {
    redirect("/courses");
  }

  await pool.query(
    "INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) ON CONFLICT (student_id, course_id) DO NOTHING",
    [user.id, courseId]
  );

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/profile");
  revalidatePath("/dashboard");

  if (safeRedirectTo) {
    redirect(safeRedirectTo);
  }
}

export async function markAsDone(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const courseId = parsePositiveInt(formData.get("course_id")?.toString());
  const contentId = parsePositiveInt(formData.get("content_id")?.toString());
  const nextContentId = parsePositiveInt(
    formData.get("next_content_id")?.toString()
  );

  if (!courseId) {
    redirect("/courses");
  }

  if (user.role !== "student" || !contentId) {
    redirect(`/courses/${courseId}`);
  }

  const { rows: contentRows } = await pool.query(
    "SELECT id FROM course_contents WHERE id = $1 AND course_id = $2",
    [contentId, courseId]
  );
  if (contentRows.length === 0) {
    redirect(`/courses/${courseId}`);
  }

  let { rows: enrollRows } = await pool.query(
    "SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2",
    [user.id, courseId]
  );

  if (enrollRows.length === 0) {
    const inserted = await pool.query(
      "INSERT INTO enrollments (student_id, course_id) VALUES ($1, $2) ON CONFLICT (student_id, course_id) DO NOTHING RETURNING id",
      [user.id, courseId]
    );
    if (inserted.rows.length > 0) {
      enrollRows = inserted.rows;
    } else {
      const refetch = await pool.query(
        "SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2",
        [user.id, courseId]
      );
      enrollRows = refetch.rows;
    }
  }

  const enrollmentId = enrollRows[0]?.id;
  if (!enrollmentId) return;

  await pool.query(
    "INSERT INTO completed_contents (enrollment_id, content_id) VALUES ($1, $2) ON CONFLICT (enrollment_id, content_id) DO NOTHING",
    [enrollmentId, contentId]
  );

  const totalRes = await pool.query(
    "SELECT COUNT(*)::int AS total FROM course_contents WHERE course_id = $1",
    [courseId]
  );
  const doneRes = await pool.query(
    `SELECT COUNT(DISTINCT cc.content_id)::int AS completed
     FROM completed_contents cc
     JOIN course_contents mat ON cc.content_id = mat.id
     WHERE cc.enrollment_id = $1 AND mat.course_id = $2`,
    [enrollmentId, courseId]
  );

  const totalContents = totalRes.rows[0]?.total || 0;
  const completedContents = doneRes.rows[0]?.completed || 0;

  if (totalContents > 0 && completedContents >= totalContents) {
    const existingCert = await pool.query(
      "SELECT id FROM certificates WHERE student_id = $1 AND course_id = $2",
      [user.id, courseId]
    );

    if (existingCert.rows.length === 0) {
      const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
      const code = `RP-${new Date().getFullYear()}-C${String(courseId).padStart(
        2,
        "0"
      )}-U${String(user.id).padStart(2, "0")}-${randomHex}`;

      await pool.query(
        "INSERT INTO certificates (certificate_code, student_id, course_id) VALUES ($1, $2, $3) ON CONFLICT (student_id, course_id) DO NOTHING",
        [code, user.id, courseId]
      );
    }
  }

  revalidatePath("/");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath("/profile");
  revalidatePath("/dashboard");

  if (nextContentId) {
    redirect(`/courses/${courseId}?materi=${nextContentId}`);
  } else {
    redirect(`/courses/${courseId}?materi=${contentId}`);
  }
}

export async function addComment(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const courseId = parsePositiveInt(formData.get("course_id")?.toString());
  const contentId = parsePositiveInt(formData.get("content_id")?.toString());
  const commentText = (formData.get("comment_text") || "").toString().trim();

  if (!courseId || !contentId || !commentText) {
    return;
  }

  const { rows: contentRows } = await pool.query(
    "SELECT id FROM course_contents WHERE id = $1 AND course_id = $2",
    [contentId, courseId]
  );
  if (contentRows.length === 0) {
    redirect(`/courses/${courseId}`);
  }

  await pool.query(
    "INSERT INTO comments (content_id, user_id, comment_text) VALUES ($1, $2, $3)",
    [contentId, user.id, commentText]
  );

  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}?materi=${contentId}#diskusi`);
}

export async function deleteComment(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const commentId = parsePositiveInt(formData.get("comment_id")?.toString());
  const courseId = parsePositiveInt(formData.get("course_id")?.toString());
  const contentId = parsePositiveInt(formData.get("content_id")?.toString());

  if (!commentId || !courseId || !contentId) return;

  if (user.role === "admin") {
    await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
  } else {
    await pool.query("DELETE FROM comments WHERE id = $1 AND user_id = $2", [
      commentId,
      user.id,
    ]);
  }

  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}?materi=${contentId}#diskusi`);
}

export async function unenrollCourse(formData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "student") {
    redirect("/profile");
  }

  const courseId = parsePositiveInt(formData.get("course_id")?.toString());
  if (!courseId) {
    redirect("/profile");
  }

  await pool.query(
    "DELETE FROM certificates WHERE student_id = $1 AND course_id = $2",
    [user.id, courseId]
  );

  await pool.query(
    "DELETE FROM completed_contents WHERE enrollment_id IN (SELECT id FROM enrollments WHERE student_id = $1 AND course_id = $2)",
    [user.id, courseId]
  );

  await pool.query(
    "DELETE FROM enrollments WHERE student_id = $1 AND course_id = $2",
    [user.id, courseId]
  );

  revalidatePath("/");
  revalidatePath("/courses");
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  redirect("/profile");
}
