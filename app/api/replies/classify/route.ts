import { runAgent } from "@/lib/agents/run-agent";
import { fail, ok } from "@/lib/api/responses";
import { replyClassifySchema } from "@/lib/api/schemas";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/data/queries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("reply-classify");
    const payload = sanitizeInput(replyClassifySchema.parse(await request.json()));
    const response = await runAgent({
      agent: "reply-classifier",
      leadId: payload.leadId,
      input: {
        replyText: payload.replyText,
        channel: payload.channel,
      },
    });
    const result = response.result as {
      classification?: string;
      confidence?: number;
      ownerAction?: string;
    };
    const supabase = await createClient();
    const user = await ensureUserProfile();

    if (supabase && user && payload.leadId) {
      await supabase.from("replies").insert({
        user_id: user.id,
        lead_id: payload.leadId,
        channel: payload.channel,
        message: payload.replyText,
        classification: result.classification ?? "Needs more info",
        confidence: result.confidence ?? 0,
        received_at: new Date().toISOString(),
      });

      if (["Interested", "Call requested", "Needs more info"].includes(result.classification ?? "")) {
        await supabase
          .from("leads")
          .update({
            status: result.classification === "Interested" || result.classification === "Call requested" ? "Interested" : "Replied",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.leadId);

        await supabase.from("tasks").insert({
          user_id: user.id,
          lead_id: payload.leadId,
          title: "Follow up with interested lead",
          description: result.ownerAction ?? "Reply Classifier Agent detected buying intent.",
          priority: result.classification === "Call requested" ? "Critical" : "High",
          status: "Open",
          action: "Open conversation notes",
          due_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    auditLog("reply_classified", {
      leadId: payload.leadId,
      channel: payload.channel,
      auditId: response.auditId,
    });

    return ok(response);
  } catch (error) {
    return fail(error);
  }
}
