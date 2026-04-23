"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function clampPercent(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? ""));
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 10 || i > 100) return null;
  return i;
}

async function requireActiveSubscriber() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.subscription_status !== "active") {
    redirect("/dashboard?locked=charity");
  }

  return { supabase, userId: user.id };
}

export async function updateCharitySettings(formData: FormData) {
  const { supabase, userId } = await requireActiveSubscriber();

  const charityId = String(formData.get("charity_id") ?? "").trim() || null;
  const percent = clampPercent(formData.get("charity_contribution_percent"));
  if (percent === null) {
    redirect("/dashboard/charity?error=Contribution+percent+must+be+10–100");
  }

  // Validate charity id exists (or allow null to clear).
  if (charityId) {
    const { data: exists, error: e1 } = await supabase
      .from("charities")
      .select("id")
      .eq("id", charityId)
      .maybeSingle();
    if (e1 || !exists) {
      redirect("/dashboard/charity?error=Invalid+charity");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      charity_id: charityId,
      charity_contribution_percent: percent,
    })
    .eq("id", userId);

  if (error) {
    redirect(`/dashboard/charity?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/charity?success=Saved");
}

