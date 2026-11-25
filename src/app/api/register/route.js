import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { isValidEmail } from "@/lib/validation";

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Format permintaan tidak valid." },
        { status: 400 }
      );
    }

    const username =
      typeof body?.username === "string" ? body.username.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const registerAs =
      typeof body?.registerAs === "string" ? body.registerAs : "student";

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Nama lengkap, email, dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    if (username.length > 100 || email.length > 100) {
      return NextResponse.json(
        { message: "Nama lengkap dan email maksimal 100 karakter." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "Format email tidak valid." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Kata sandi minimal harus 6 karakter." },
        { status: 400 }
      );
    }

    if (!["student", "teacher"].includes(registerAs)) {
      return NextResponse.json(
        { message: "Pilihan pendaftaran tidak valid." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const initialRole = "student";
    const initialStatus = registerAs === "teacher" ? "pending" : "active";

    await pool.query(
      "INSERT INTO users (username, email, password, role, status) VALUES ($1, $2, $3, $4, $5)",
      [username, email, hashedPassword, initialRole, initialStatus]
    );

    const message =
      registerAs === "teacher"
        ? "Pendaftaran Pengajar berhasil! Anda masuk sebagai Siswa terlebih dahulu sambil menunggu verifikasi Admin."
        : "Registrasi Siswa berhasil! Silakan masuk dengan akun Anda.";

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "Email sudah terdaftar. Silakan gunakan email lain." },
        { status: 409 }
      );
    }
    console.error("Error POST /api/register:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
