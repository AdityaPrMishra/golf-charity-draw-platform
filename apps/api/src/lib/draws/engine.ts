import { createAdminClient } from "@/lib/supabase/admin";

type DrawType = "random" | "algorithmic";
type DrawStatus = "simulated" | "published";

const TIER_SPLITS = {
  five: 0.4,
  four: 0.35,
  three: 0.25,
} as const;

async function withTimeout<T>(promiseLike: PromiseLike<T>, ms: number, label: string): Promise<T> {
  let t: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<T>((_, reject) => {
    t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms (${label})`)), ms);
  });
  try {
    return await Promise.race([Promise.resolve(promiseLike as any), timeout]);
  } finally {
    if (t) clearTimeout(t);
  }
}

function firstOfMonthISO(input: string) {
  // Accept YYYY-MM or YYYY-MM-01. Normalize to YYYY-MM-01.
  const m = input.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const yyyy = m[1];
  const mm = m[2];
  return `${yyyy}-${mm}-01`;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function drawUniqueNumbers(count: number, min: number, max: number) {
  const set = new Set<number>();
  while (set.size < count) set.add(randomInt(min, max));
  return Array.from(set);
}

function intersectionCount(a: number[], b: number[]) {
  const setB = new Set(b);
  const setA = new Set(a);
  let c = 0;
  for (const v of setA) if (setB.has(v)) c += 1;
  return c;
}

function yieldToEventLoop() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function computeAlgorithmicNumbersFromEligible(eligibleScores: number[][]) {
  // Weighted by frequency of scores across eligible users' current 5-score snapshots.
  const freq = new Map<number, number>();
  let i = 0;
  for (const scores of eligibleScores) {
    for (const s of scores) freq.set(s, (freq.get(s) ?? 0) + 1);
    i += 1;
    if (i % 5000 === 0) await yieldToEventLoop();
  }

  // If no data, fallback to random.
  if (freq.size === 0) return drawUniqueNumbers(5, 1, 45);

  // Deterministic + fast: pick 5 most frequent unique scores.
  // This avoids any chance of long/degenerate sampling loops.
  const entries = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
  const top5 = entries.slice(0, 5).map(([score]) => score);
  if (top5.length === 5) return top5;
  // If less than 5 unique values exist, fill remaining randomly.
  const filled = new Set<number>(top5);
  for (const n of drawUniqueNumbers(5, 1, 45)) filled.add(n);
  return Array.from(filled).slice(0, 5);
}

export async function runDraw(params: {
  draw_month: string; // YYYY-MM or YYYY-MM-01
  draw_type: DrawType;
  status: DrawStatus;
}) {
  const started = Date.now();
  const drawMonth = firstOfMonthISO(params.draw_month);
  if (!drawMonth) {
    return { ok: false as const, error: "Invalid draw_month (use YYYY-MM or YYYY-MM-01)" };
  }

  const supabase = createAdminClient();
  const timeoutMs = Number(process.env.DRAW_ENGINE_TIMEOUT_MS ?? "20000");
  const log = (step: string) => {
    // eslint-disable-next-line no-console
    console.log(`[draw-engine] ${step} +${Date.now() - started}ms`);
  };

  // Active subscribers with 5 scores
  log("profiles(active) start");
  const { data: activeProfiles, error: profErr } = (await withTimeout(
    supabase.from("profiles").select("id").eq("subscription_status", "active"),
    timeoutMs,
    "profiles(active)"
  )) as any;
  log("profiles(active) done");
  if (profErr) return { ok: false as const, error: profErr.message };

  const activeIds = (activeProfiles ?? []).map((p: any) => p.id as string);
  if (activeIds.length === 0) {
    return { ok: false as const, error: "No active subscribers found" };
  }

  // Fetch latest 5 scores per user (we'll do it in JS due to limited SQL in client).
  log("scores(activeIds) start");
  const { data: scoreRows, error: scoreErr } = (await withTimeout(
    supabase
      .from("scores")
      .select("user_id, score, score_date, created_at")
      .in("user_id", activeIds)
      .order("score_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5000),
    timeoutMs,
    "scores(activeIds)"
  )) as any;
  log("scores(activeIds) done");
  if (scoreErr) return { ok: false as const, error: scoreErr.message };

  const byUser = new Map<string, number[]>();
  for (const row of scoreRows ?? []) {
    const userId = (row as any).user_id as string;
    const score = (row as any).score as number;
    if (!byUser.has(userId)) byUser.set(userId, []);
    const arr = byUser.get(userId)!;
    if (arr.length < 5) arr.push(score);
  }

  const eligible = Array.from(byUser.entries()).filter(([, scores]) => scores.length === 5);
  if (eligible.length === 0) {
    return { ok: false as const, error: "No eligible users with 5 scores" };
  }

  // Prize pool
  const perSub = Number(process.env.PRIZE_POOL_PER_SUBSCRIBER ?? "5");
  const basePool = Number.isFinite(perSub) ? perSub * eligible.length : 5 * eligible.length;

  // Rollover: carry previous jackpot_amount if previous published draw flagged rollover
  log("draws(prev) start");
  const { data: prevDraw } = (await withTimeout(
    supabase
      .from("draws")
      .select("jackpot_rollover, jackpot_amount")
      .eq("status", "published")
      .order("draw_month", { ascending: false })
      .limit(1)
      .maybeSingle(),
    timeoutMs,
    "draws(prev)"
  )) as any;
  log("draws(prev) done");

  const carry =
    prevDraw?.jackpot_rollover && typeof prevDraw.jackpot_amount === "number"
      ? prevDraw.jackpot_amount
      : 0;

  // Draw numbers
  log(`draw_numbers(${params.draw_type}) start`);
  const drawnNumbers =
    params.draw_type === "algorithmic"
      ? await computeAlgorithmicNumbersFromEligible(eligible.map(([, scores]) => scores))
      : drawUniqueNumbers(5, 1, 45);
  log(`draw_numbers(${params.draw_type}) done`);

  // Create/update draw row
  const totalPrizePool = basePool;
  const prize5 = basePool * TIER_SPLITS.five + carry;
  const prize4 = basePool * TIER_SPLITS.four;
  const prize3 = basePool * TIER_SPLITS.three;

  const { data: drawRow, error: drawErr } = (await withTimeout(
    supabase
      .from("draws")
      .upsert(
        {
          draw_month: drawMonth,
          status: params.status,
          draw_type: params.draw_type,
          drawn_numbers: drawnNumbers,
          jackpot_rollover: false,
          jackpot_amount: carry,
          total_prize_pool: totalPrizePool,
          prize_pool_5match: prize5,
          prize_pool_4match: prize4,
          prize_pool_3match: prize3,
        },
        { onConflict: "draw_month" }
      )
      .select(
        "id, draw_month, status, draw_type, drawn_numbers, prize_pool_5match, prize_pool_4match, prize_pool_3match, jackpot_amount"
      )
      .single(),
    timeoutMs,
    "draws(upsert)"
  )) as any;
  log("draws(upsert) done");
  if (drawErr) return { ok: false as const, error: drawErr.message };

  // Remove existing entries for this draw_month (idempotent for re-simulate)
  log("draw_entries(delete existing) start");
  await withTimeout(
    supabase.from("draw_entries").delete().eq("draw_id", drawRow.id),
    timeoutMs,
    "draw_entries(delete existing)"
  );
  log("draw_entries(delete existing) done");

  // Build entries with match counts
  const entries = eligible.map(([userId, scores]) => {
    const match = intersectionCount(scores, drawnNumbers);
    const matchCount = match === 5 || match === 4 || match === 3 ? match : 0;
    return {
      draw_id: drawRow.id,
      user_id: userId,
      user_scores: scores,
      match_count: matchCount,
      is_winner: matchCount >= 3,
      prize_amount: 0,
      verification_status: matchCount >= 3 ? "pending" : null,
      payout_status: matchCount >= 3 ? "unpaid" : "unpaid",
    };
  });

  // Determine winners per tier
  const winners5 = entries.filter((e) => e.match_count === 5);
  const winners4 = entries.filter((e) => e.match_count === 4);
  const winners3 = entries.filter((e) => e.match_count === 3);

  const payTier = (arr: typeof entries, pool: number) => {
    if (arr.length === 0) return;
    const each = pool / arr.length;
    for (const e of arr) e.prize_amount = each;
  };

  payTier(winners4, prize4);
  payTier(winners3, prize3);

  let jackpotRollover = false;
  let jackpotAmount = 0;
  if (winners5.length === 0) {
    jackpotRollover = true;
    jackpotAmount = prize5; // carry forward full 5-match pool
  } else {
    payTier(winners5, prize5);
  }

  // Insert entries
  log("draw_entries(insert) start");
  const { error: insErr } = (await withTimeout(
    supabase.from("draw_entries").insert(entries),
    timeoutMs,
    "draw_entries(insert)"
  )) as any;
  log("draw_entries(insert) done");
  if (insErr) return { ok: false as const, error: insErr.message };

  // Update draw rollover fields after winners computed
  log("draws(update rollover) start");
  const { error: updDrawErr } = (await withTimeout(
    supabase
      .from("draws")
      .update({
        jackpot_rollover: jackpotRollover,
        jackpot_amount: jackpotAmount,
      })
      .eq("id", drawRow.id),
    timeoutMs,
    "draws(update rollover)"
  )) as any;
  log("draws(update rollover) done");
  if (updDrawErr) return { ok: false as const, error: updDrawErr.message };

  return {
    ok: true as const,
    draw: {
      id: drawRow.id,
      draw_month: drawMonth,
      status: params.status,
      draw_type: params.draw_type,
      drawn_numbers: drawnNumbers,
      eligible_users: eligible.length,
      winners: {
        match5: winners5.length,
        match4: winners4.length,
        match3: winners3.length,
      },
      rollover: jackpotRollover,
      jackpot_amount: jackpotAmount,
    },
  };
}

