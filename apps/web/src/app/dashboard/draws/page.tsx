import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardDrawsPage() {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: entries, error } = await supabase
    .from("draw_entries")
    .select(
      "id, match_count, is_winner, prize_amount, payout_status, verification_status, proof_url, created_at, draws:draw_id (draw_month, status, drawn_numbers, prize_pool_5match, prize_pool_4match, prize_pool_3match)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(24);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Draws</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Your draw participation and results.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="underline underline-offset-4" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error.message}
          </div>
        ) : null}

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">History</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <thead className="text-left text-zinc-500 dark:text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2">Drawn</th>
                  <th className="px-3 py-2">Match</th>
                  <th className="px-3 py-2">Prize</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries && entries.length ? (
                  entries.map((e: any) => (
                    <tr
                      key={e.id}
                      className="rounded-xl border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/30"
                    >
                      <td className="px-3 py-3 font-mono">
                        {String(e.draws?.draw_month ?? "-").slice(0, 7)}
                      </td>
                      <td className="px-3 py-3 font-mono">
                        {(e.draws?.drawn_numbers ?? []).join(", ")}
                      </td>
                      <td className="px-3 py-3 font-mono">{e.match_count ?? 0}</td>
                      <td className="px-3 py-3 font-mono">
                        {typeof e.prize_amount === "number" ? e.prize_amount.toFixed(2) : "0.00"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">
                            {e.is_winner ? "Winner" : "No win"}
                          </span>
                          {e.is_winner ? (
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">
                              verification: {e.verification_status ?? "-"} · payout:{" "}
                              {e.payout_status ?? "-"}
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-6 text-zinc-600 dark:text-zinc-400" colSpan={5}>
                      No draw entries yet. Once an admin publishes a draw, your entry will appear
                      here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

