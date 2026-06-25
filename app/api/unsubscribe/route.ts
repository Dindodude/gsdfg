import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { getSupabaseServerClient } from "@/lib/integrations/supabase";
import { auditLog, rateLimitPlaceholder } from "@/lib/security";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe";

const unsubscribeSchema = z.object({
  token: z.string().min(10),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("unsubscribe");
    const payload = unsubscribeSchema.parse(await request.json());
    const verified = verifyUnsubscribeToken(payload.token);

    if (!verified) {
      return ok(
        {
          unsubscribed: false,
          reason: "Invalid or expired unsubscribe link.",
        },
        400,
      );
    }

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      auditLog("unsubscribe_mock", {
        email: verified.email,
        userId: verified.userId,
      });

      return ok({
        unsubscribed: true,
        mode: "mock",
        email: verified.email,
      });
    }

    const { error } = await supabase.from("suppression_list").upsert(
      {
        user_id: verified.userId,
        contact_type: "Email",
        email: verified.email,
        reason: "unsubscribe",
        source: "unsubscribe_page",
        metadata: {
          tokenVerified: true,
        },
      },
      { onConflict: "user_id,email" },
    );

    if (error) throw error;

    auditLog("unsubscribe_completed", {
      email: verified.email,
      userId: verified.userId,
    });

    return ok({
      unsubscribed: true,
      email: verified.email,
    });
  } catch (error) {
    return fail(error);
  }
}
