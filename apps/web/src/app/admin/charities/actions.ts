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

function parseEvents(raw: string) {
  if (!raw.trim()) return null;
  const v = JSON.parse(raw);
  if (!Array.isArray(v)) throw new Error("upcoming_events must be a JSON array");
  return v;
}

export async function createCharity(formData: FormData) {
  const supabase = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const website_url = String(formData.get("website_url") ?? "").trim() || null;
  const is_featured = String(formData.get("is_featured") ?? "") === "on";
  const upcomingRaw = String(formData.get("upcoming_events") ?? "");

  if (!name) redirect("/admin/charities?error=Name+is+required");

  let upcoming_events: any = null;
  try {
    upcoming_events = parseEvents(upcomingRaw);
  } catch (e) {
    redirect(`/admin/charities?error=${encodeURIComponent(e instanceof Error ? e.message : "Invalid events JSON")}`);
  }

  const { error } = await supabase.from("charities").insert({
    name,
    description,
    website_url,
    is_featured,
    upcoming_events,
  });
  if (error) redirect(`/admin/charities?error=${encodeURIComponent(error.message)}`);
  redirect("/admin/charities?success=Created");
}

export async function updateCharity(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const website_url = String(formData.get("website_url") ?? "").trim() || null;
  const is_featured = String(formData.get("is_featured") ?? "") === "on";
  const upcomingRaw = String(formData.get("upcoming_events") ?? "");

  if (!id) redirect("/admin/charities?error=Missing+id");
  if (!name) redirect("/admin/charities?error=Name+is+required");

  let upcoming_events: any = null;
  try {
    upcoming_events = parseEvents(upcomingRaw);
  } catch (e) {
    redirect(`/admin/charities?error=${encodeURIComponent(e instanceof Error ? e.message : "Invalid events JSON")}`);
  }

  const { error } = await supabase
    .from("charities")
    .update({ name, description, website_url, is_featured, upcoming_events })
    .eq("id", id);
  if (error) redirect(`/admin/charities?error=${encodeURIComponent(error.message)}`);
  redirect("/admin/charities?success=Updated");
}

export async function deleteCharity(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/admin/charities?error=Missing+id");
  const { error } = await supabase.from("charities").delete().eq("id", id);
  if (error) redirect(`/admin/charities?error=${encodeURIComponent(error.message)}`);
  redirect("/admin/charities?success=Deleted");
}

