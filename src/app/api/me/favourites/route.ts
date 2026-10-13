import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { CATEGORIES } from "@/lib/categories";
import { getFavourites, setFavourites } from "@/lib/favourites";

const bodySchema = z.object({
  categories: z.array(z.enum(CATEGORIES)).max(CATEGORIES.length),
});

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  try {
    return Response.json({ categories: await getFavourites(auth.id) });
  } catch (error) {
    console.error("GET /api/me/favourites failed:", error);
    return Response.json({ error: "Could not load favourites" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireUser(request);
  if (auth instanceof Response) return auth;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "categories must be a list of valid categories" }, { status: 400 });
  }
  const unique = [...new Set(parsed.data.categories)];

  try {
    return Response.json({ categories: await setFavourites(auth.id, unique) });
  } catch (error) {
    if ((error as { code?: string }).code === "23503") {
      // The token points to a user that no longer exists (e.g. after db:reset)
      return Response.json({ error: "Your session is out of date. Please log in again." }, { status: 401 });
    }
    console.error("PUT /api/me/favourites failed:", error);
    return Response.json({ error: "Could not save favourites" }, { status: 500 });
  }
}