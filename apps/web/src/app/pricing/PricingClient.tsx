"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Plan = "monthly" | "yearly";

export function PricingClient() {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: Plan) {
    setError(null);
    setLoading(plan);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("You must be signed in to subscribe.");

      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      if (!apiBase) throw new Error("Missing NEXT_PUBLIC_API_URL");

      const res = await fetch(`${apiBase}/api/stripe/create-checkout-session`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to start checkout.");
      if (!json.url) throw new Error("Stripe checkout URL missing.");

      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Monthly</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Subscribe monthly. Cancel anytime.
          </p>
          <button
            onClick={() => startCheckout("monthly")}
            disabled={loading !== null}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {loading === "monthly" ? "Starting…" : "Subscribe monthly"}
          </button>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Yearly</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Subscribe yearly at a discount.
          </p>
          <button
            onClick={() => startCheckout("yearly")}
            disabled={loading !== null}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            {loading === "yearly" ? "Starting…" : "Subscribe yearly"}
          </button>
        </div>
      </div>
    </div>
  );
}

