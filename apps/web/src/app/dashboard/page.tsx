import { redirect } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../(auth)/actions/auth";

export default async function DashboardPage() {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, role, subscription_status, subscription_plan, subscription_renewal_date, email",
    )
    .eq("id", data.user.id)
    .maybeSingle();

  const status = profile?.subscription_status ?? "inactive";
  const isAdmin = profile?.role === "admin";

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="flex items-start justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Signed in as <span className="font-mono">{data.user.email}</span>
            </p>
            <nav className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link className="underline underline-offset-4" href="/">
                Home
              </Link>
              <Link className="underline underline-offset-4" href="/charities">
                Charities
              </Link>
              <Link className="underline underline-offset-4" href="/pricing">
                Pricing
              </Link>
            </nav>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            {isAdmin ? (
              <Link
                href="/admin/reports"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Admin panel
              </Link>
            ) : null}
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Subscription</h2>
          <div className="mt-2 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <div>
              <span className="text-zinc-500 dark:text-zinc-500">Status:</span>{" "}
              <span className="font-mono">{status}</span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-500">Plan:</span>{" "}
              <span className="font-mono">{profile?.subscription_plan ?? "-"}</span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-500">Renewal:</span>{" "}
              <span className="font-mono">{profile?.subscription_renewal_date ?? "-"}</span>
            </div>
          </div>

          {status !== "active" ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Subscribe to unlock
              </Link>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                After checkout + webhook, this will turn <span className="font-mono">active</span>.
              </p>
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/scores"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Manage scores
              </Link>
              <Link
                href="/dashboard/charity"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Charity settings
              </Link>
              <Link
                href="/dashboard/draws"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Draw history
              </Link>
              <Link
                href="/dashboard/winnings"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
              >
                Winnings
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

