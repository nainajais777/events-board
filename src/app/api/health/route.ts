import { connection } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  await connection();

  try {
    const result = await pool.query("SELECT NOW() AS db_time");
    return Response.json({ status: "ok", dbTime: result.rows[0].db_time });
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json(
      { status: "error", message: "Database unavailable" },
      { status: 503 }
    );
  }
}
