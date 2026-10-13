import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { createEvent, listAllEvents } from "@/lib/events";

const createSchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.enum(CATEGORIES),
  city: z.string().trim().min(1).max(60),
  startsAt: z
    .string()
    .datetime({ offset: true })
    .refine((value) => new Date(value).getTime() > Date.now(), "Event must be in the future"),
  pricePaise: z.number().int().min(0).max(1_000_000_000),
  description: z.string().trim().min(1).max(2000),
  imageUrl: z
    .string()
    .trim()
    .url()
    .max(500)
    .refine((value) => /^https?:\/\//i.test(value), "Image URL must start with http:// or https://"),
});

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    return Response.json({ events: await listAllEvents() });
  } catch (error) {
    console.error("GET /api/admin/events failed:", error);
    return Response.json({ error: "Could not load events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request); // authorize BEFORE reading the body
  if (auth instanceof Response) return auth;

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid event details",
        details: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      },
      { status: 400 }
    );
  }

  try {
    const event = await createEvent(parsed.data);
    return Response.json({ event }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/events failed:", error);
    return Response.json({ error: "Could not create event" }, { status: 500 });
  }
}