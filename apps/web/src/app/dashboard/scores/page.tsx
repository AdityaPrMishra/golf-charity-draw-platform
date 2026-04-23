import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteScore, upsertScore } from "./actions";

export default async function ScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  noStore();
  const sp = await searchParams;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  const locked = profile?.subscription_status !== "active";

  const { data: scores } = locked
    ? { data: [] as Array<{ id: string; score: number; score_date: string; created_at: string }> }
    : await supabase
        .from("scores")
        .select("id, score, score_date, created_at")
        .eq("user_id", user.id)
        .order("score_date", { ascending: false })
        .limit(5);

  const count = scores?.length ?? 0;

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const maxDate = `${yyyy}-${mm}-${dd}`;

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">Scores</h1>
            <Link className="text-sm underline underline-offset-4" href="/dashboard">
              Back to dashboard
            </Link>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Stableford score range: <span className="font-mono">1–45</span> · {count} of{" "}
            <span className="font-mono">5</span> saved (most recent only)
          </p>
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

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Add / edit a score</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            One score per date. Submitting the same date updates the existing entry.
          </p>

          {locked ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Scores are locked until your subscription is active.
              </p>
              <Link
                href="/pricing"
                className="inline-flex h-11 w-fit items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Subscribe to unlock
              </Link>
            </div>
          ) : (
            <form action={upsertScore} className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Date</span>
                <input
                  name="score_date"
                  type="date"
                  required
                  max={maxDate}
                  className="h-11 rounded-xl border border-black/10 bg-transparent px-3 outline-none focus:border-zinc-400 dark:border-white/10 dark:focus:border-white/30"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Score (1–45)</span>
                <input
                  name="score"
                  type="number"
                  required
                  min={1}
                  max={45}
                  className="h-11 rounded-xl border border-black/10 bg-transparent px-3 outline-none focus:border-zinc-400 dark:border-white/10 dark:focus:border-white/30"
                />
              </label>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                >
                  Save score
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Your latest scores</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2 text-sm">
              <thead className="text-left text-zinc-500 dark:text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Score</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scores && scores.length ? (
                  scores.map((s) => (
                    <tr
                      key={s.id}
                      className="rounded-xl border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/30"
                    >
                      <td className="px-3 py-3 font-mono">{s.score_date}</td>
                      <td className="px-3 py-3 font-mono">{s.score}</td>
                      <td className="px-3 py-3 text-right">
                        {locked ? null : (
                          <form action={deleteScore} className="inline">
                            <input type="hidden" name="id" value={s.id} />
                            <button
                              type="submit"
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-black/5 dark:text-zinc-200 dark:hover:bg-white/10"
                            >
                              Delete
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-6 text-zinc-600 dark:text-zinc-400" colSpan={3}>
                      No scores yet.
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

