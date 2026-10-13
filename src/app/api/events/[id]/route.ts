import { z } from "zod";
import { getPublicEvent } from "@/lib/events";

const idSchema = z.coerce.number().int().positive();

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const parsed = idSchema.safeParse((await params).id);
  if (!parsed.success) {
    return Response.json({ error: "Invalid event id" }, { status: 400 });
  }
  try {
    const event = await getPublicEvent(parsed.data);
    if (!event) return Response.json({ error: "Event not found" }, { status: 404 });
    return Response.json({ event });
  } catch (error) {
    console.error("GET /api/events/[id] failed:", error);
    return Response.json({ error: "Could not load event" }, { status: 500 });
  }
}