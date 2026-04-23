import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminReportsPage() {
  noStore();
  const supabase = await createClient();

  const [{ count: userCount }, { count: activeCount }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active"),
  ]).then((r) => r.map((x: any) => ({ count: x.count ?? 0 })));

  const { data: lastDraw } = await supabase
    .from("draws")
    .select("draw_month, status, draw_type, drawn_numbers, total_prize_pool, jackpot_rollover, jackpot_amount")
    .order("draw_month", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prizePoolPerSub = Number(process.env.NEXT_PUBLIC_PRIZE_POOL_PER_SUBSCRIBER ?? "5");
  const estPool = (Number.isFinite(prizePoolPerSub) ? prizePoolPerSub : 5) * (activeCount ?? 0);

  const { data: charityTotals } = await supabase
    .from("charity_contributions")
    .select("amount, charity_id, charities:charity_id (name)")
    .limit(5000);

  const totals = new Map<string, { name: string; total: number }>();
  for (const row of charityTotals ?? []) {
    const cid = (row as any).charity_id as string | null;
    const name = (row as any).charities?.name as string | undefined;
    const amt = Number((row as any).amount ?? 0);
    if (!cid) continue;
    const key = cid;
    const prev = totals.get(key) ?? { name: name ?? "Unknown", total: 0 };
    totals.set(key, { name: prev.name, total: prev.total + (Number.isFinite(amt) ? amt : 0) });
  }
  const topCharities = Array.from(totals.values()).sort((a, b) => b.total - a.total).slice(0, 10);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Key metrics at a glance.</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link className="underline underline-offset-4" href="/admin/users">
            Users
          </Link>
          <Link className="underline underline-offset-4" href="/admin/charities">
            Charities
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500">Total users</div>
          <div className="mt-2 text-3xl font-semibold">{userCount ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500">Active subscribers</div>
          <div className="mt-2 text-3xl font-semibold">{activeCount ?? 0}</div>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="text-xs text-zinc-500">Estimated monthly prize pool</div>
          <div className="mt-2 text-3xl font-semibold">{estPool.toFixed(2)}</div>
          <div className="mt-2 text-xs text-zinc-500">
            Based on {activeCount ?? 0} × {Number.isFinite(prizePoolPerSub) ? prizePoolPerSub : 5}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Latest draw</h2>
          {lastDraw ? (
            <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div>
                <span className="text-zinc-500">Month:</span>{" "}
                <span className="font-mono">{String(lastDraw.draw_month).slice(0, 7)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Status:</span>{" "}
                <span className="font-mono">{lastDraw.status}</span>
              </div>
              <div>
                <span className="text-zinc-500">Type:</span>{" "}
                <span className="font-mono">{lastDraw.draw_type}</span>
              </div>
              <div>
                <span className="text-zinc-500">Numbers:</span>{" "}
                <span className="font-mono">{(lastDraw.drawn_numbers ?? []).join(", ")}</span>
              </div>
              <div>
                <span className="text-zinc-500">Prize pool:</span>{" "}
                <span className="font-mono">{Number(lastDraw.total_prize_pool ?? 0).toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Rollover:</span>{" "}
                <span className="font-mono">
                  {lastDraw.jackpot_rollover ? "yes" : "no"} ·{" "}
                  {Number(lastDraw.jackpot_amount ?? 0).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No draws yet.</p>
          )}
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Top charities (contributions)</h2>
          {topCharities.length ? (
            <div className="mt-4 flex flex-col gap-2 text-sm">
              {topCharities.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-4">
                  <span className="text-zinc-600 dark:text-zinc-400">{c.name}</span>
                  <span className="font-mono">{c.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              No charity contributions recorded yet.
            </p>
          )}
          <p className="mt-4 text-xs text-zinc-500">
            Charity contribution tracking will be finalized when we wire invoice-based contribution
            recording.
          </p>
        </div>
      </section>
    </div>
  );
}

