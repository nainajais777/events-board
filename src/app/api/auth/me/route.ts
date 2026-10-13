import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return Response.json({ error: "Not logged in" }, { status: 401 });
  }
  return Response.json({ user });
}