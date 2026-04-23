import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDrawsClient } from "./AdminDrawsClient";

export default async function AdminDrawsPage() {
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
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Admin · Draws</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Simulate and publish monthly draws.
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link className="underline underline-offset-4" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </header>

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
          <AdminDrawsClient />
        </section>
      </main>
    </div>
  );
}

