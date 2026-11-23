import { NextResponse } from "next/server";
import { decrypt, SESSION_COOKIE_NAME } from "./lib/session";

export async function middleware(request) {
  const path = request.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith("/dashboard") || path.startsWith("/profile");
  const isAuthRoute = path === "/login" || path === "/register";

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isAuthRoute && session) {
    const dest = session.role === "student" ? "/profile" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|favicon.ico).*)"],
};
