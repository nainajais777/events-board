import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { listReminderEventIds } from "@/lib/reminders";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  try {
    return Response.json({ eventIds: await listReminderEventIds(auth.id) });
  } catch (error) {
    console.error("GET /api/me/reminders failed:", error);
    return Response.json({ error: "Could not load reminders" }, { status: 500 });
  }
}