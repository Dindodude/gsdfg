import { fail, ok } from "@/lib/api/responses";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return ok({ mode: "mock", bootstrapped: false, reason: "Supabase is not configured." });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return ok({ bootstrapped: false, reason: "No authenticated user." });
    }

    const { error } = await supabase.from("users").upsert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email ?? "Owner",
      agency_name: "AgencyForge AI",
      role: "owner",
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    return ok({ bootstrapped: true, userId: user.id });
  } catch (error) {
    return fail(error);
  }
}
