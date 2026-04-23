import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { drawPublished, winnerNotification } from "@/lib/email/templates";

export async function notifyDrawPublished(params: {
  drawId: string;
  drawMonth: string; // YYYY-MM-01
  drawnNumbers: number[];
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const supabase = createAdminClient();

  // Load all entries + emails
  const { data: entries, error } = await supabase
    .from("draw_entries")
    .select("id, user_id, match_count, is_winner, prize_amount, profiles:user_id (email)")
    .eq("draw_id", params.drawId)
    .limit(100000);
  if (error) throw new Error(error.message);

  const drawMonthShort = params.drawMonth.slice(0, 7);

  // Notify all participants
  for (const e of entries ?? []) {
    const email = (e as any).profiles?.email as string | undefined;
    if (!email) continue;
    await sendEmail({
      to: email,
      subject: `Draw results published (${drawMonthShort})`,
      html: drawPublished(drawMonthShort, params.drawnNumbers, appUrl),
    });
  }

  // Notify winners with upload link
  for (const e of entries ?? []) {
    if (!(e as any).is_winner) continue;
    const email = (e as any).profiles?.email as string | undefined;
    if (!email) continue;
    const matchCount = (e as any).match_count ?? 0;
    const prize = typeof (e as any).prize_amount === "number" ? (e as any).prize_amount : 0;
    await sendEmail({
      to: email,
      subject: `You’ve won (${drawMonthShort})`,
      html: winnerNotification(drawMonthShort, matchCount, prize, appUrl),
    });
  }
}

