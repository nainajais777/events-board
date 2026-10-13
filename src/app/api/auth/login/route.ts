import { NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "@/lib/db";
import { AUTH_COOKIE, authCookieOptions, signToken, verifyPassword } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(72),
});

type UserRow = { id: number; email: string; role: "user" | "admin"; password_hash: string };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  try {
    const result = await pool.query<UserRow>(
      "SELECT id, email, role, password_hash FROM users WHERE email = $1",
      [email]
    );
    const row = result.rows[0];
    const valid = row ? await verifyPassword(password, row.password_hash) : false;
    if (!row || !valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const user = { id: row.id, email: row.email, role: row.role };
    const token = await signToken(user);
    const response = NextResponse.json({ token, user });
    response.cookies.set(AUTH_COOKIE, token, authCookieOptions);
    return response;
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);
    return NextResponse.json({ error: "Could not log in" }, { status: 500 });
  }
}