export function layout(title: string, bodyHtml: string) {
  return `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; background:#0b0b0f; padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
      <div style="padding:20px 22px;border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="color:#fff;font-size:16px;font-weight:600;letter-spacing:-0.01em;">${title}</div>
      </div>
      <div style="padding:22px;color:rgba(255,255,255,0.86);font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:18px 22px;border-top:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.55);font-size:12px;">
        You’re receiving this because you have an account on Golf Charity Draw.
      </div>
    </div>
  </div>`;
}

export function subscriptionActive(plan: string | null) {
  return layout(
    "Subscription active",
    `
      <p>Your subscription is now <b>active</b>.</p>
      <p>Plan: <b>${plan ?? "—"}</b></p>
      <p>You can now enter scores, choose a charity, and participate in the monthly draw.</p>
    `
  );
}

export function subscriptionStatusChanged(status: string, plan: string | null) {
  return layout(
    "Subscription update",
    `
      <p>Your subscription status changed to <b>${status}</b>.</p>
      <p>Plan: <b>${plan ?? "—"}</b></p>
    `
  );
}

export function drawPublished(drawMonth: string, drawnNumbers: number[], appUrl: string) {
  return layout(
    "Draw results published",
    `
      <p>The draw for <b>${drawMonth}</b> has been published.</p>
      <p>Winning numbers: <b>${drawnNumbers.join(", ")}</b></p>
      <p><a style="color:#7dd3fc" href="${appUrl}/dashboard/draws">View your results →</a></p>
    `
  );
}

export function winnerNotification(drawMonth: string, matchCount: number, prize: number, appUrl: string) {
  return layout(
    "You’ve won",
    `
      <p>You matched <b>${matchCount}</b> numbers in the <b>${drawMonth}</b> draw.</p>
      <p>Prize: <b>${prize.toFixed(2)}</b></p>
      <p>Please upload proof so we can verify your win.</p>
      <p><a style="color:#7dd3fc" href="${appUrl}/dashboard/winnings">Upload proof →</a></p>
    `
  );
}

export function verificationDecision(drawMonth: string, decision: "approved" | "rejected", appUrl: string) {
  return layout(
    `Verification ${decision}`,
    `
      <p>Your proof for the <b>${drawMonth}</b> draw was <b>${decision}</b>.</p>
      <p><a style="color:#7dd3fc" href="${appUrl}/dashboard/winnings">View status →</a></p>
    `
  );
}

export function payoutConfirmed(drawMonth: string, appUrl: string) {
  return layout(
    "Payout confirmed",
    `
      <p>Your payout for the <b>${drawMonth}</b> draw has been marked as <b>paid</b>.</p>
      <p><a style="color:#7dd3fc" href="${appUrl}/dashboard/winnings">View details →</a></p>
    `
  );
}

