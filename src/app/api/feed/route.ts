import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getFavourites } from "@/lib/favourites";
import { listUpcomingEvents } from "@/lib/events";

const PAGE_SIZE = 6;
const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1) });

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const parsed = querySchema.safeParse({ page: request.nextUrl.searchParams.get("page") || undefined });
  if (!parsed.success) {
    return Response.json({ error: "page must be a whole number of 1 or more" }, { status: 400 });
  }

  try {
    const categories = await getFavourites(auth.id);
    if (categories.length === 0) {
      return Response.json({
        categories,
        events: [],
        pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 0 },
      });
    }
    const data = await listUpcomingEvents({ categories, page: parsed.data.page, pageSize: PAGE_SIZE });
    return Response.json({ categories, ...data });
  } catch (error) {
    console.error("GET /api/feed failed:", error);
    return Response.json({ error: "Could not load your feed" }, { status: 500 });
  }
}