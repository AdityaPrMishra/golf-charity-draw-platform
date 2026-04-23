import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { setPayoutStatus, setVerificationStatus } from "./actions";

export default async function AdminWinnersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  noStore();
  const sp = await searchParams;

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: winners, error } = await supabase
    .from("draw_entries")
    .select(
      "id, user_id, match_count, prize_amount, verification_status, payout_status, proof_url, created_at, draws:draw_id (draw_month, status, drawn_numbers)"
    )
    .eq("is_winner", true)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin · Winners</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Review proof uploads, approve/reject, and mark payouts.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="underline underline-offset-4" href="/admin/draws">
              Admin draws
            </Link>
            <Link className="underline underline-offset-4" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </header>

        {sp.error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {sp.error}
          </div>
        ) : null}
        {sp.success ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            {sp.success}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error.message}
          </div>
        ) : null}

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Winners</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <thead className="text-left text-zinc-500 dark:text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Match</th>
                  <th className="px-3 py-2">Prize</th>
                  <th className="px-3 py-2">Proof</th>
                  <th className="px-3 py-2">Verification</th>
                  <th className="px-3 py-2">Payout</th>
                </tr>
              </thead>
              <tbody>
                {(winners ?? []).length ? (
                  (winners ?? []).map((w: any) => (
                    <tr
                      key={w.id}
                      className="rounded-xl border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/30"
                    >
                      <td className="px-3 py-3 font-mono">
                        {String(w.draws?.draw_month ?? "-").slice(0, 7)}
                      </td>
                      <td className="px-3 py-3 font-mono">{String(w.user_id).slice(0, 8)}…</td>
                      <td className="px-3 py-3 font-mono">{w.match_count ?? 0}</td>
                      <td className="px-3 py-3 font-mono">
                        {typeof w.prize_amount === "number" ? w.prize_amount.toFixed(2) : "0.00"}
                      </td>
                      <td className="px-3 py-3">
                        {w.proof_url ? (
                          <a
                            className="text-xs underline underline-offset-4"
                            href={w.proof_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-500">No proof</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <form action={setVerificationStatus} className="flex items-center gap-2">
                          <input type="hidden" name="entry_id" value={w.id} />
                          <select
                            name="status"
                            defaultValue={w.verification_status ?? "pending"}
                            className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs outline-none dark:border-white/10 dark:bg-zinc-950"
                          >
                            <option value="pending">pending</option>
                            <option value="approved">approved</option>
                            <option value="rejected">rejected</option>
                          </select>
                          <button className="h-9 rounded-lg border border-black/10 bg-white px-3 text-xs hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                            Save
                          </button>
                        </form>
                      </td>
                      <td className="px-3 py-3">
                        <form action={setPayoutStatus} className="flex items-center gap-2">
                          <input type="hidden" name="entry_id" value={w.id} />
                          <select
                            name="status"
                            defaultValue={w.payout_status ?? "unpaid"}
                            className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs outline-none dark:border-white/10 dark:bg-zinc-950"
                          >
                            <option value="unpaid">unpaid</option>
                            <option value="paid">paid</option>
                          </select>
                          <button className="h-9 rounded-lg border border-black/10 bg-white px-3 text-xs hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                            Save
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-6 text-zinc-600 dark:text-zinc-400" colSpan={7}>
                      No winners yet. Publish a draw and match 3+ numbers to generate winners.
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

