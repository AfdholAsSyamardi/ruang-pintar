import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";
import { encrypt, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      "SELECT id, username, email, password, role, status, approved_at FROM users WHERE LOWER(email) = LOWER($1)",
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    const user = rows[0];
    const isBcryptHash = user.password.startsWith("$2");
    const isPasswordValid = isBcryptHash
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Email atau kata sandi salah." },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    const token = await encrypt(sessionPayload);

    const response = NextResponse.json(
      {
        message: "Login berhasil!",
        user: sessionPayload,
      },
      { status: 200 }
    );

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error("Error POST /api/login:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
