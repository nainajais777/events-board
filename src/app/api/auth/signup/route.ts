import { z } from "zod";
import { pool } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid signup details",
        details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  try {
    const passwordHash = await hashPassword(password);
    const result = await pool.query<{ id: number; email: string; role: "user" | "admin" }>(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role",
      [email, passwordHash]
    );
    return Response.json({ user: result.rows[0] }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    console.error("POST /api/auth/signup failed:", error);
    return Response.json({ error: "Could not create account" }, { status: 500 });
  }
}