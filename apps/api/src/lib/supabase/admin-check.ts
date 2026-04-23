import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromAuthHeader } from "@/lib/supabase/auth";

export async function requireAdmin(authorizationHeader: string | null) {
  const user = await getUserFromAuthHeader(authorizationHeader);
  if (!user) return { ok: false as const, error: "Unauthorized", status: 401 as const };

  const supabase = createAdminClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message, status: 500 as const };
  if (profile?.role !== "admin")
    return { ok: false as const, error: "Forbidden", status: 403 as const };

  return { ok: true as const, user };
}

