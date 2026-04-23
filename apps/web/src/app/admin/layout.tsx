import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-black/10 bg-white p-4 text-sm dark:border-white/10 dark:bg-zinc-950">
          <div className="px-2 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-500">
            Admin panel
          </div>
          <nav className="mt-2 flex flex-col">
            <Link className="rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10" href="/admin/reports">
              Reports
            </Link>
            <Link className="rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10" href="/admin/users">
              Users
            </Link>
            <Link className="rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10" href="/admin/charities">
              Charities
            </Link>
            <Link className="rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10" href="/admin/draws">
              Draws
            </Link>
            <Link className="rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10" href="/admin/winners">
              Winners
            </Link>
          </nav>
          <div className="mt-4 border-t border-black/10 pt-4 dark:border-white/10">
            <Link className="rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/10" href="/dashboard">
              ← Back to dashboard
            </Link>
          </div>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}

