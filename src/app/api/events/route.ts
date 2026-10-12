import type { NextRequest } from "next/server";
import { z } from "zod";
import { CATEGORIES } from "@/lib/categories";
import { listUpcomingEvents } from "@/lib/events";

const querySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(6),
});

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const parsed = querySchema.safeParse({
    category: params.get("category") || undefined,
    city: params.get("city") || undefined,
    q: params.get("q") || undefined,
    page: params.get("page") || undefined,
    pageSize: params.get("pageSize") || undefined,
  });

  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid query parameters",
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  try {
    const data = await listUpcomingEvents(parsed.data);
    return Response.json(data);
  } catch (error) {
    console.error("GET /api/events failed:", error);
    return Response.json({ error: "Could not load events" }, { status: 500 });
  }
}