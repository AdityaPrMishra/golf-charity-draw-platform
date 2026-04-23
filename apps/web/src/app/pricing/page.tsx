import Link from "next/link";
import { PricingClient } from "./PricingClient";

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Choose a plan to activate your subscription.
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            <Link className="underline underline-offset-4" href="/dashboard">
              Dashboard
            </Link>
            <Link className="underline underline-offset-4" href="/login">
              Sign in
            </Link>
          </div>
        </header>

        <PricingClient />
      </main>
    </div>
  );
}

