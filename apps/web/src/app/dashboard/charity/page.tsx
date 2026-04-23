import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateCharitySettings } from "./actions";

export default async function CharitySettingsPage({
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
    .select("subscription_status, charity_id, charity_contribution_percent")
    .eq("id", user.id)
    .maybeSingle();

  const locked = profile?.subscription_status !== "active";

  const { data: charities } = await supabase
    .from("charities")
    .select("id, name, is_featured")
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">Charity</h1>
            <Link className="text-sm underline underline-offset-4" href="/dashboard">
              Back to dashboard
            </Link>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Choose where your subscription contribution goes (minimum 10%).
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
          <h2 className="text-lg font-medium">Your settings</h2>

          {locked ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Charity settings are locked until your subscription is active.
              </p>
              <Link
                href="/pricing"
                className="inline-flex h-11 w-fit items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Subscribe to unlock
              </Link>
            </div>
          ) : (
            <form action={updateCharitySettings} className="mt-4 flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Charity</span>
                <select
                  name="charity_id"
                  defaultValue={profile?.charity_id ?? ""}
                  className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
                >
                  <option value="">— Select a charity —</option>
                  {(charities ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.is_featured ? " (Featured)" : ""}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-zinc-500 dark:text-zinc-500">
                  Browse details on{" "}
                  <Link className="underline underline-offset-4" href="/charities">
                    /charities
                  </Link>
                  .
                </span>
              </label>

              <label className="flex flex-col gap-2 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Contribution % (10–100)</span>
                <input
                  name="charity_contribution_percent"
                  type="number"
                  min={10}
                  max={100}
                  required
                  defaultValue={profile?.charity_contribution_percent ?? 10}
                  className="h-11 rounded-xl border border-black/10 bg-transparent px-3 outline-none focus:border-zinc-400 dark:border-white/10 dark:focus:border-white/30"
                />
              </label>

              <div className="flex items-center gap-3">
                <button className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                  Save settings
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

