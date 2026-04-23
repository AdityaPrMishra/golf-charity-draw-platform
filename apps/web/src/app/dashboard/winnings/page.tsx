import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WinningsClient } from "./WinningsClient";

export default async function WinningsPage() {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_status !== "active") redirect("/dashboard?locked=winnings");

  const { data: entries } = await supabase
    .from("draw_entries")
    .select(
      "id, draw_id, user_id, match_count, prize_amount, verification_status, payout_status, proof_url, created_at, draws:draw_id (draw_month, status, drawn_numbers)"
    )
    .eq("user_id", user.id)
    .eq("is_winner", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Winnings</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Upload proof for wins and track verification + payout status.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="underline underline-offset-4" href="/dashboard">
              Dashboard
            </Link>
            <Link className="underline underline-offset-4" href="/dashboard/draws">
              Draws
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <WinningsClient entries={(entries ?? []) as any} />
        </section>
      </main>
    </div>
  );
}

