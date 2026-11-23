import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST() {
  const response = NextResponse.json(
    { message: "Logout berhasil." },
    { status: 200 }
  );
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
