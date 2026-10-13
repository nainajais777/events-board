import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

export const AUTH_COOKIE = "token";
const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export type AuthUser = { id: number; email: string; role: "user" | "admin" };

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  const secret = getSecret(); // outside try: a missing secret must crash loudly, not look like "logged out"
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const id = Number(payload.sub);
    const { email, role } = payload;
    if (!Number.isInteger(id) || typeof email !== "string" || (role !== "user" && role !== "admin")) {
      return null;
    }
    return { id, email, role };
  } catch {
    return null; // bad signature, expired, or malformed
  }
}

// Mobile apps send "Authorization: Bearer <token>"; the web app sends the httpOnly cookie.
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : request.cookies.get(AUTH_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}

export const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TOKEN_TTL_SECONDS,
};
// Use at the top of every admin API: returns the admin, or a ready-made 401/403 response.
export async function requireAdmin(request: NextRequest): Promise<AuthUser | Response> {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }
  return user;
}