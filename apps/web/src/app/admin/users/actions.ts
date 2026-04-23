"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") redirect("/dashboard");
  return supabase;
}

export async function updateUser(formData: FormData) {
  const supabase = await requireAdmin();

  const userId = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "");
  const subscription_status = String(formData.get("subscription_status") ?? "");
  const subscription_plan = String(formData.get("subscription_plan") ?? "");
  const charity_contribution_percent = Number(formData.get("charity_contribution_percent") ?? "");

  if (!userId) redirect("/admin/users?error=Missing+user");

  const payload: any = {};
  if (role && ["admin", "subscriber"].includes(role)) payload.role = role;
  if (subscription_status && ["active", "inactive", "cancelled", "lapsed"].includes(subscription_status))
    payload.subscription_status = subscription_status;
  if (subscription_plan && ["monthly", "yearly"].includes(subscription_plan)) payload.subscription_plan = subscription_plan;
  if (Number.isFinite(charity_contribution_percent)) payload.charity_contribution_percent = charity_contribution_percent;

  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  if (error) redirect(`/admin/users?error=${encodeURIComponent(error.message)}`);
  redirect("/admin/users?success=Updated");
}

