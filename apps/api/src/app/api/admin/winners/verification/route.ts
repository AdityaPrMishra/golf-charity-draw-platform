import { NextResponse } from "next/server";
import { withCors } from "@/lib/http/cors";
import { requireAdmin } from "@/lib/supabase/admin-check";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { verificationDecision } from "@/lib/email/templates";

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
    | { entry_id?: string; status?: "approved" | "rejected" | "pending" }
    | null;

  const entryId = body?.entry_id;
  const status = body?.status;
  if (!entryId || !status) {
    return withCors(NextResponse.json({ error: "Invalid request" }, { status: 400 }), origin);
  }

  const supabase = createAdminClient();
  const { data: entry, error: e1 } = await supabase
    .from("draw_entries")
    .select("id, user_id, draws:draw_id (draw_month)")
    .eq("id", entryId)
    .maybeSingle();
  if (e1 || !entry) {
    return withCors(
      NextResponse.json({ error: e1?.message ?? "Not found" }, { status: 404 }),
      origin
    );
  }

  const userId = (entry as any).user_id as string | undefined;
  const { data: prof, error: profErr } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId ?? "")
    .maybeSingle();
  if (profErr) {
    // eslint-disable-next-line no-console
    console.error("[admin/winners/verification] profile lookup failed", profErr);
  }

  const { error: e2 } = await supabase
    .from("draw_entries")
    .update({ verification_status: status })
    .eq("id", entryId);
  if (e2) return withCors(NextResponse.json({ error: e2.message }, { status: 400 }), origin);

  const email = prof?.email as string | undefined;
  const drawMonth = String((entry as any).draws?.draw_month ?? "").slice(0, 7);
  if (email && (status === "approved" || status === "rejected")) {
    // eslint-disable-next-line no-console
    console.log("[email] verificationDecision", { to: email, status, entryId });
    await sendEmail({
      to: email,
      subject: `Verification ${status} (${drawMonth})`,
      html: verificationDecision(drawMonth, status, process.env.NEXT_PUBLIC_APP_URL ?? ""),
    });
  }

  return withCors(NextResponse.json({ ok: true, emailed: Boolean(email) && status !== "pending" }), origin);
}

