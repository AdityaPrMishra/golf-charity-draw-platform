"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DrawType = "random" | "algorithmic";

export function AdminDrawsClient() {
  const [drawType, setDrawType] = useState<DrawType>("random");
  const [drawMonth, setDrawMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [busy, setBusy] = useState<"simulate" | "publish" | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  const canRun = useMemo(() => Boolean(apiBase && drawMonth), [apiBase, drawMonth]);

  async function call(endpoint: "simulate" | "publish") {
    setError(null);
    setResult(null);
    setBusy(endpoint);
    try {
      if (!apiBase) throw new Error("Missing NEXT_PUBLIC_API_URL");
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("You must be signed in.");

      const controller = new AbortController();
      const timeoutMs = 25000;
      const t = window.setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(`${apiBase}/api/draws/${endpoint}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ draw_month: drawMonth, draw_type: drawType }),
        signal: controller.signal,
      }).finally(() => window.clearTimeout(t));

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Request failed");
      setResult(json);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        setError("Timed out after 25s. API may be hung or Supabase is slow.");
      } else {
        setError(e instanceof Error ? e.message : "Request failed");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Draw month</span>
          <input
            type="month"
            value={drawMonth}
            onChange={(e) => setDrawMonth(e.target.value)}
            className="h-11 rounded-xl border border-black/10 bg-white px-3 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Draw type</span>
          <select
            value={drawType}
            onChange={(e) => setDrawType(e.target.value as DrawType)}
            className="h-11 rounded-xl border border-black/10 bg-white px-3 outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
          >
            <option value="random">Random</option>
            <option value="algorithmic">Algorithmic</option>
          </select>
        </label>

        <div className="flex items-end gap-3">
          <button
            disabled={!canRun || busy !== null}
            onClick={() => call("simulate")}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-black/10 bg-white px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            {busy === "simulate" ? "Simulating…" : "Simulate"}
          </button>
          <button
            disabled={!canRun || busy !== null}
            onClick={() => call("publish")}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            {busy === "publish" ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {result ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="font-medium">Result</div>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-black/5 p-4 text-xs dark:bg-white/5">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

