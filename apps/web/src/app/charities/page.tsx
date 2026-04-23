import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  noStore();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();

  const supabase = await createClient();
  const { data: charities, error } = await supabase
    .from("charities")
    .select("id, name, description, website_url, is_featured, created_at")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  const filtered =
    charities?.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    }) ?? [];

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-4xl font-semibold tracking-tight">Charities</h1>
            <div className="flex items-center gap-4 text-sm">
              <Link className="underline underline-offset-4" href="/">
                Home
              </Link>
              <Link className="underline underline-offset-4" href="/dashboard">
                Dashboard
              </Link>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Browse the directory and choose who your subscription supports.
          </p>
        </header>

        <form className="flex gap-3">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search charities…"
            className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
          />
          <button className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
            Search
          </button>
        </form>

        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error.message}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          {filtered.length ? (
            filtered.map((c) => (
              <Link
                key={c.id}
                href={`/charities/${c.id}`}
                className="group rounded-2xl border border-black/10 bg-white p-6 transition hover:border-black/20 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-white/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-medium">{c.name}</h2>
                    {c.is_featured ? (
                      <span className="w-fit rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-200">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <span className="text-sm text-zinc-500 group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-300">
                    View →
                  </span>
                </div>
                {c.description ? (
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {c.description}
                  </p>
                ) : null}
                {c.website_url ? (
                  <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                    {c.website_url}
                  </p>
                ) : null}
              </Link>
            ))
          ) : (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              No charities found.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

