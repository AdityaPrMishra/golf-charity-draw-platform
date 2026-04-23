import Link from "next/link";
import { signUp } from "../actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Create account</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Start with email + password.
          </p>
        </header>

        {sp.error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {sp.error}
          </div>
        ) : null}

        <form action={signUp} className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Email</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-11 rounded-xl border border-black/10 bg-transparent px-3 outline-none ring-0 focus:border-zinc-400 dark:border-white/10 dark:focus:border-white/30"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Password</span>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="h-11 rounded-xl border border-black/10 bg-transparent px-3 outline-none ring-0 focus:border-zinc-400 dark:border-white/10 dark:focus:border-white/30"
              />
            </label>

            <button
              type="submit"
              className="mt-2 inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Create account
            </button>
          </div>
        </form>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link className="underline underline-offset-4" href="/login">
            Sign in
          </Link>
          .
        </p>
      </main>
    </div>
  );
}

