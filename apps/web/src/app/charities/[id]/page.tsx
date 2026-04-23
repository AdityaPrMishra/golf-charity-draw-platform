import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CharityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;

  const supabase = await createClient();
  const { data: charity } = await supabase
    .from("charities")
    .select("id, name, description, website_url, is_featured, upcoming_events, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!charity) notFound();

  const events = Array.isArray(charity.upcoming_events) ? charity.upcoming_events : [];

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-4xl font-semibold tracking-tight">{charity.name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <Link className="underline underline-offset-4" href="/charities">
                Back
              </Link>
              <Link className="underline underline-offset-4" href="/dashboard/charity">
                Select in dashboard
              </Link>
            </div>
          </div>
          {charity.is_featured ? (
            <span className="w-fit rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-200">
              Featured
            </span>
          ) : null}
        </header>

        {charity.description ? (
          <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
            <h2 className="text-lg font-medium">About</h2>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {charity.description}
            </p>
          </section>
        ) : null}

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Website</h2>
          {charity.website_url ? (
            <a
              className="mt-3 inline-flex text-sm underline underline-offset-4"
              href={charity.website_url}
              target="_blank"
              rel="noreferrer"
            >
              {charity.website_url}
            </a>
          ) : (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Not provided.</p>
          )}
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Upcoming events</h2>
          {events.length ? (
            <div className="mt-4 flex flex-col gap-3">
              {events.map((e: any, idx: number) => (
                <div
                  key={`${idx}-${String(e?.title ?? "event")}`}
                  className="rounded-xl border border-black/10 bg-zinc-50 p-4 dark:border-white/10 dark:bg-zinc-900/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{String(e?.title ?? "Event")}</div>
                    {e?.date ? <div className="font-mono text-xs">{String(e.date)}</div> : null}
                  </div>
                  {e?.description ? (
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {String(e.description)}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">No events listed.</p>
          )}
        </section>
      </main>
    </div>
  );
}

