import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { addReminder, removeReminder } from "@/lib/reminders";

type Context = { params: Promise<{ id: string }> };
const idSchema = z.coerce.number().int().positive();

async function parseEventId(context: Context): Promise<number | null> {
  const result = idSchema.safeParse((await context.params).id);
  return result.success ? result.data : null;
}

function isStaleUser(error: unknown) {
  return (error as { code?: string }).code === "23503"; // token's user no longer exists
}

export async function PUT(request: NextRequest, context: Context) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const eventId = await parseEventId(context);
  if (!eventId) return Response.json({ error: "Invalid event id" }, { status: 400 });

  try {
    const ok = await addReminder(auth.id, eventId);
    if (!ok) {
      return Response.json({ error: "Event not found or no longer upcoming" }, { status: 404 });
    }
    return Response.json({ eventId, reminded: true });
  } catch (error) {
    if (isStaleUser(error)) {
      return Response.json({ error: "Your session is out of date. Please log in again." }, { status: 401 });
    }
    console.error("PUT reminder failed:", error);
    return Response.json({ error: "Could not save reminder" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const eventId = await parseEventId(context);
  if (!eventId) return Response.json({ error: "Invalid event id" }, { status: 400 });

  try {
    await removeReminder(auth.id, eventId);
    return Response.json({ eventId, reminded: false });
  } catch (error) {
    console.error("DELETE reminder failed:", error);
    return Response.json({ error: "Could not remove reminder" }, { status: 500 });
  }
}