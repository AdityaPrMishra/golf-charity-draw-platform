import { buildAppUrl } from "@golf/lib";
import Link from "next/link";

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const healthUrl = apiUrl ? buildAppUrl(apiUrl, "/api/health") : null;

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16">
        <section className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Golf scores that fund real impact.
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            This repo is split into separately deployable apps: `apps/web` (frontend) and
            `apps/api` (backend).
          </p>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Backend connectivity</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Set `NEXT_PUBLIC_API_URL` in `apps/web/.env.local` to point at your deployed API.
          </p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div>
              <span className="text-zinc-500 dark:text-zinc-500">API base:</span>{" "}
              <span className="font-mono">{apiUrl ?? "(not set)"}</span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-500">Health check:</span>{" "}
              {healthUrl ? (
                <a className="font-mono underline underline-offset-4" href={healthUrl}>
                  {healthUrl}
                </a>
              ) : (
                <span className="font-mono">(not available)</span>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            Dashboard
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            Pricing
          </Link>
          <Link
            href="/charities"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            Charities
          </Link>
        </section>
      </main>
    </div>
  );
}
