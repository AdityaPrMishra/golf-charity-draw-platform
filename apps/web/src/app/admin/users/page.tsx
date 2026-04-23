import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateUser } from "./actions";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string; success?: string }>;
}) {
  noStore();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();

  const supabase = await createClient();
  const { data: rows, error } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, subscription_status, subscription_plan, charity_contribution_percent, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(500);

  const filtered =
    (rows ?? []).filter((r: any) => {
      if (!q) return true;
      return (
        String(r.email ?? "").toLowerCase().includes(q) ||
        String(r.full_name ?? "").toLowerCase().includes(q) ||
        String(r.id ?? "").toLowerCase().includes(q)
      );
    }) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Search and manage profiles, roles, and subscription flags.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link className="underline underline-offset-4" href="/admin/reports">
            Reports
          </Link>
        </div>
      </header>

      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search by email, name, or id…"
          className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-white/10 dark:bg-zinc-950 dark:focus:border-white/30"
        />
        <button className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
          Search
        </button>
      </form>

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

      <section className="rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-2 text-sm">
            <thead className="text-left text-zinc-500 dark:text-zinc-500">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Sub</th>
                <th className="px-3 py-2">% Charity</th>
                <th className="px-3 py-2 text-right">Save</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((u: any) => (
                  <tr
                    key={u.id}
                    className="rounded-xl border border-black/10 bg-zinc-50 dark:border-white/10 dark:bg-zinc-900/30"
                  >
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{u.full_name || "—"}</span>
                        <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          {u.email}
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">
                          {String(u.id).slice(0, 8)}…
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3" colSpan={4}>
                      <form action={updateUser} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <select
                          name="role"
                          defaultValue={u.role ?? "subscriber"}
                          className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs outline-none dark:border-white/10 dark:bg-zinc-950"
                        >
                          <option value="subscriber">subscriber</option>
                          <option value="admin">admin</option>
                        </select>
                        <select
                          name="subscription_status"
                          defaultValue={u.subscription_status ?? "inactive"}
                          className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs outline-none dark:border-white/10 dark:bg-zinc-950"
                        >
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                          <option value="cancelled">cancelled</option>
                          <option value="lapsed">lapsed</option>
                        </select>
                        <select
                          name="subscription_plan"
                          defaultValue={u.subscription_plan ?? ""}
                          className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs outline-none dark:border-white/10 dark:bg-zinc-950"
                        >
                          <option value="">—</option>
                          <option value="monthly">monthly</option>
                          <option value="yearly">yearly</option>
                        </select>
                        <input
                          name="charity_contribution_percent"
                          type="number"
                          min={10}
                          max={100}
                          defaultValue={u.charity_contribution_percent ?? 10}
                          className="h-9 w-24 rounded-lg border border-black/10 bg-white px-2 text-xs outline-none dark:border-white/10 dark:bg-zinc-950"
                        />
                        <button className="ml-auto h-9 rounded-lg bg-zinc-950 px-3 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-3 py-6 text-zinc-600 dark:text-zinc-400" colSpan={5}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

