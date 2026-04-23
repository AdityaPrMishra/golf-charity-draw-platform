import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createCharity, deleteCharity, updateCharity } from "./actions";

export default async function AdminCharitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  noStore();
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: charities, error } = await supabase
    .from("charities")
    .select("id, name, description, website_url, is_featured, upcoming_events, created_at")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Charities</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Create and manage charity listings.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link className="underline underline-offset-4" href="/charities">
            Public directory
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
        <h2 className="text-lg font-medium">Create charity</h2>
        <form action={createCharity} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Name</span>
            <input
              name="name"
              required
              className="h-11 rounded-xl border border-black/10 bg-transparent px-3 outline-none focus:border-zinc-400 dark:border-white/10 dark:focus:border-white/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Website</span>
            <input
              name="website_url"
              placeholder="https://…"
              className="h-11 rounded-xl border border-black/10 bg-transparent px-3 outline-none focus:border-zinc-400 dark:border-white/10 dark:focus:border-white/30"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="text-zinc-600 dark:text-zinc-400">Description</span>
            <textarea
              name="description"
              rows={3}
              className="rounded-xl border border-black/10 bg-transparent px-3 py-2 outline-none focus:border-zinc-400 dark:border-white/10 dark:focus:border-white/30"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input name="is_featured" type="checkbox" />
            <span className="text-zinc-600 dark:text-zinc-400">Featured</span>
          </label>
          <div className="flex items-end justify-end">
            <button className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
              Create
            </button>
          </div>
          <label className="flex flex-col gap-2 text-sm md:col-span-2">
            <span className="text-zinc-600 dark:text-zinc-400">Upcoming events (JSON array)</span>
            <textarea
              name="upcoming_events"
              rows={4}
              placeholder='[{"title":"Event","date":"2026-05-20","description":"..."}]'
              className="font-mono rounded-xl border border-black/10 bg-transparent px-3 py-2 text-xs outline-none focus:border-zinc-400 dark:border-white/10 dark:focus:border-white/30"
            />
          </label>
        </form>
      </section>

      <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
        <h2 className="text-lg font-medium">Existing</h2>
        <div className="mt-4 flex flex-col gap-4">
          {(charities ?? []).map((c: any) => (
            <div key={c.id} className="rounded-2xl border border-black/10 p-4 dark:border-white/10">
              <form action={updateCharity} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="id" value={c.id} />
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Name</span>
                  <input
                    name="name"
                    defaultValue={c.name ?? ""}
                    className="h-10 rounded-xl border border-black/10 bg-transparent px-3 outline-none dark:border-white/10"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Website</span>
                  <input
                    name="website_url"
                    defaultValue={c.website_url ?? ""}
                    className="h-10 rounded-xl border border-black/10 bg-transparent px-3 outline-none dark:border-white/10"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm md:col-span-2">
                  <span className="text-zinc-600 dark:text-zinc-400">Description</span>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={c.description ?? ""}
                    className="rounded-xl border border-black/10 bg-transparent px-3 py-2 outline-none dark:border-white/10"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input name="is_featured" type="checkbox" defaultChecked={Boolean(c.is_featured)} />
                  <span className="text-zinc-600 dark:text-zinc-400">Featured</span>
                </label>
                <div className="flex items-center justify-end gap-2">
                  <button className="h-10 rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                    Save
                  </button>
                </div>
                <label className="flex flex-col gap-2 text-sm md:col-span-2">
                  <span className="text-zinc-600 dark:text-zinc-400">Upcoming events (JSON array)</span>
                  <textarea
                    name="upcoming_events"
                    rows={3}
                    defaultValue={JSON.stringify(c.upcoming_events ?? [], null, 2)}
                    className="font-mono rounded-xl border border-black/10 bg-transparent px-3 py-2 text-xs outline-none dark:border-white/10"
                  />
                </label>
              </form>

              <form action={deleteCharity} className="mt-3 flex justify-end">
                <input type="hidden" name="id" value={c.id} />
                <button className="h-9 rounded-xl border border-black/10 bg-white px-3 text-xs hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                  Delete
                </button>
              </form>
            </div>
          ))}
          {(charities ?? []).length === 0 ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">No charities yet.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

