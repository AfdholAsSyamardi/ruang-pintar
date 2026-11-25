import { NextResponse } from "next/server";
import { decrypt, SESSION_COOKIE_NAME } from "./lib/session";

export async function proxy(request) {
  const path = request.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith("/dashboard") || path.startsWith("/profile");

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$|.*\\.svg$|favicon.ico).*)"],
};
