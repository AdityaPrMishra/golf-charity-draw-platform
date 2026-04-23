"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Entry = {
  id: string;
  draw_id: string;
  user_id: string;
  match_count: number | null;
  prize_amount: number | null;
  verification_status: "pending" | "approved" | "rejected" | null;
  payout_status: "unpaid" | "paid" | null;
  proof_url: string | null;
  created_at: string;
  draws?: { draw_month: string; drawn_numbers: number[] | null; status: string } | null;
};

export function WinningsClient({ entries }: { entries: Entry[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function uploadProof(entry: Entry, file: File) {
    setError(null);
    setOk(null);
    setBusyId(entry.id);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) throw new Error("Not signed in.");

      const ext = file.name.split(".").pop() || "bin";
      const safeName = `proof.${ext}`.replace(/[^\w.\-]/g, "_");
      const path = `${user.id}/${entry.id}/${Date.now()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("winner-proofs")
        .upload(path, file, { upsert: true, contentType: file.type || undefined });
      if (upErr) throw new Error(upErr.message);

      const { data: signed, error: signErr } = await supabase.storage
        .from("winner-proofs")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      if (signErr) throw new Error(signErr.message);

      const proofUrl = signed?.signedUrl;
      if (!proofUrl) throw new Error("Could not create signed URL.");

      const { error: updErr } = await supabase
        .from("draw_entries")
        .update({ proof_url: proofUrl, verification_status: "pending" })
        .eq("id", entry.id);
      if (updErr) throw new Error(updErr.message);

      setOk("Proof uploaded. Awaiting admin verification.");
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {ok}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2 text-sm">
          <thead className="text-left text-zinc-500 dark:text-zinc-500">
            <tr>
              <th className="px-3 py-2">Month</th>
              <th className="px-3 py-2">Match</th>
              <th className="px-3 py-2">Prize</th>
              <th className="px-3 py-2">Verification</th>
              <th className="px-3 py-2 text-right">Proof</th>
            </tr>
          </thead>
          <tbody>
            {entries.length ? (
              entries.map((e) => (
                <tr
                  key={e.id}
                  className="rounded-xl border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/30"
                >
                  <td className="px-3 py-3 font-mono">
                    {String(e.draws?.draw_month ?? "-").slice(0, 7)}
                  </td>
                  <td className="px-3 py-3 font-mono">{e.match_count ?? 0}</td>
                  <td className="px-3 py-3 font-mono">
                    {typeof e.prize_amount === "number" ? e.prize_amount.toFixed(2) : "0.00"}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs">
                        {e.verification_status ?? "pending"}
                      </span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        payout: {e.payout_status ?? "unpaid"}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {e.proof_url ? (
                      <a
                        className="text-xs underline underline-offset-4"
                        href={e.proof_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View
                      </a>
                    ) : (
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          disabled={busyId !== null}
                          onChange={(ev) => {
                            const f = ev.target.files?.[0];
                            if (!f) return;
                            uploadProof(e, f);
                          }}
                        />
                        <span className="rounded-lg border border-black/10 bg-white px-3 py-1.5 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                          {busyId === e.id ? "Uploading…" : "Upload proof"}
                        </span>
                      </label>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3 py-6 text-zinc-600 dark:text-zinc-400" colSpan={5}>
                  No winnings yet. When you match 3+ numbers, you’ll be able to upload proof here.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

