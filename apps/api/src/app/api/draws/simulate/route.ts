import { NextResponse } from "next/server";
import { runDraw } from "@/lib/draws/engine";
import { requireAdmin } from "@/lib/supabase/admin-check";
import { withCors } from "@/lib/http/cors";

export async function OPTIONS(request: Request) {
  return withCors(new NextResponse(null, { status: 204 }), request.headers.get("origin"));
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const admin = await requireAdmin(request.headers.get("authorization"));
  if (!admin.ok) {
    return withCors(NextResponse.json({ error: admin.error }, { status: admin.status }), origin);
  }

  const body = (await request.json().catch(() => null)) as
    | { draw_month?: string; draw_type?: "random" | "algorithmic" }
    | null;

  const draw_month = body?.draw_month ?? new Date().toISOString().slice(0, 7); // YYYY-MM
  const draw_type = body?.draw_type ?? "random";

  try {
    const result = await runDraw({ draw_month, draw_type, status: "simulated" });
    if (!result.ok) {
      return withCors(NextResponse.json({ error: result.error }, { status: 400 }), origin);
    }
    return withCors(NextResponse.json(result), origin);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Draw simulation failed";
    return withCors(NextResponse.json({ error: message }, { status: 500 }), origin);
  }
}

