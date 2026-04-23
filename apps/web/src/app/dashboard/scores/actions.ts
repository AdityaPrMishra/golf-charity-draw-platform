"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function toISODate(value: FormDataEntryValue | null) {
  if (!value) return null;
  const s = String(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function toInt(value: FormDataEntryValue | null) {
  if (value === null) return null;
  const n = Number(String(value));
  return Number.isFinite(n) ? Math.trunc(n) : null;
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
    redirect("/dashboard?locked=scores");
  }

  return { supabase, userId: user.id };
}

export async function upsertScore(formData: FormData) {
  const { supabase, userId } = await requireActiveSubscriber();

  const scoreDate = toISODate(formData.get("score_date"));
  const score = toInt(formData.get("score"));

  if (!scoreDate || score === null) {
    redirect("/dashboard/scores?error=Invalid+input");
  }
  if (score < 1 || score > 45) {
    redirect("/dashboard/scores?error=Score+must+be+between+1+and+45");
  }

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  if (scoreDate > todayStr) {
    redirect("/dashboard/scores?error=Date+cannot+be+in+the+future");
  }

  const { error } = await supabase.from("scores").upsert(
    {
      user_id: userId,
      score,
      score_date: scoreDate,
    },
    { onConflict: "user_id,score_date" }
  );

  if (error) {
    redirect(`/dashboard/scores?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/scores?success=Saved");
}

export async function deleteScore(formData: FormData) {
  const { supabase, userId } = await requireActiveSubscriber();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/dashboard/scores?error=Missing+id");

  const { error } = await supabase.from("scores").delete().eq("id", id).eq("user_id", userId);
  if (error) {
    redirect(`/dashboard/scores?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/scores?success=Deleted");
}

