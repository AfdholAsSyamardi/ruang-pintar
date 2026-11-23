import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = body?.username?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password || "";
    const registerAs = body?.registerAs || "student";

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Nama lengkap, email, dan kata sandi wajib diisi." },
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
