import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { CARD_THEMES, MAX_STICKERS, STICKER_IDS } from "@/lib/card-options";
import { getCardDesign, saveCardDesign } from "@/lib/card-designs";
import { getPublicEvent } from "@/lib/events";

type Context = { params: Promise<{ id: string }> };
const idSchema = z.coerce.number().int().positive();
const designSchema = z.object({
  theme: z.enum(CARD_THEMES),
  stickers: z
    .array(z.enum(STICKER_IDS))
    .max(MAX_STICKERS)
    .refine((list) => new Set(list).size === list.length, "Each sticker can be used once"),
});

export async function GET(request: NextRequest, context: Context) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const id = idSchema.safeParse((await context.params).id);
  if (!id.success) return Response.json({ error: "Invalid event id" }, { status: 400 });

  try {
    return Response.json({ design: await getCardDesign(auth.id, id.data) });
  } catch (error) {
    console.error("GET card-design failed:", error);
    return Response.json({ error: "Could not load card design" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Context) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const id = idSchema.safeParse((await context.params).id);
  const body = designSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) {
    return Response.json(
      { error: "Choose a valid theme and up to 3 different stickers" },
      { status: 400 }
    );
  }

  try {
    if (!(await getPublicEvent(id.data))) {
      return Response.json({ error: "Event not found" }, { status: 404 });
    }
    return Response.json({ design: await saveCardDesign(auth.id, id.data, body.data) });
  } catch (error) {
    if ((error as { code?: string }).code === "23503") {
      return Response.json({ error: "Your session is out of date. Please log in again." }, { status: 401 });
    }
    console.error("PUT card-design failed:", error);
    return Response.json({ error: "Could not save card design" }, { status: 500 });
  }
}