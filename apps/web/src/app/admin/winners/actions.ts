"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
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
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) redirect("/admin/winners?error=Missing+session");
  return { token };
}

export async function setVerificationStatus(formData: FormData) {
  const { token } = await requireAdmin();
  const entryId = String(formData.get("entry_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!entryId || !["approved", "rejected", "pending"].includes(status)) {
    redirect("/admin/winners?error=Invalid+request");
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) redirect("/admin/winners?error=Missing+NEXT_PUBLIC_API_URL");

  const res = await fetch(`${apiBase}/api/admin/winners/verification`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ entry_id: entryId, status }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) redirect(`/admin/winners?error=${encodeURIComponent(json.error ?? "Failed")}`);

  redirect("/admin/winners?success=Updated");
}

export async function setPayoutStatus(formData: FormData) {
  const { token } = await requireAdmin();
  const entryId = String(formData.get("entry_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!entryId || !["paid", "unpaid"].includes(status)) {
    redirect("/admin/winners?error=Invalid+request");
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) redirect("/admin/winners?error=Missing+NEXT_PUBLIC_API_URL");

  const res = await fetch(`${apiBase}/api/admin/winners/payout`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ entry_id: entryId, status }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) redirect(`/admin/winners?error=${encodeURIComponent(json.error ?? "Failed")}`);

  redirect("/admin/winners?success=Updated");
}

