import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { setEventActive } from "@/lib/events";

const idSchema = z.coerce.number().int().positive();
const patchSchema = z.object({ isActive: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const idResult = idSchema.safeParse((await params).id);
  const body = await request.json().catch(() => null);
  const bodyResult = patchSchema.safeParse(body);
  if (!idResult.success || !bodyResult.success) {
    return Response.json({ error: "Provide a valid event id and isActive true/false" }, { status: 400 });
  }

  try {
    const event = await setEventActive(idResult.data, bodyResult.data.isActive);
    if (!event) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }
    return Response.json({ event });
  } catch (error) {
    console.error("PATCH /api/admin/events/[id] failed:", error);
    return Response.json({ error: "Could not update event" }, { status: 500 });
  }
}