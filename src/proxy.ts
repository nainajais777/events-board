import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (request.nextUrl.pathname.startsWith("/admin") && user.role !== "admin") {
    return NextResponse.redirect(new URL("/events", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/favourites", "/feed"],
};