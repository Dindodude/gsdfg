import { runAgent } from "@/lib/agents/run-agent";
import { leadScoreSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("leads-score");
    const payload = sanitizeInput(leadScoreSchema.parse(await request.json()));
    const response = await runAgent({
      agent: "lead-scoring",
      leadId: payload.leadId,
      input: payload.lead ? { lead: payload.lead } : undefined,
    });
    const result = response.result as {
      leadScore?: number;
      websiteQualityScore?: number;
      googlePresenceScore?: number;
      recommendedStatus?: string;
    };
    const supabase = await createClient();

    if (supabase && payload.leadId) {
      await supabase
        .from("leads")
        .update({
          lead_score: result.leadScore,
          current_website_quality_score: result.websiteQualityScore,
          google_presence_score: result.googlePresenceScore,
          status: result.recommendedStatus ?? "Scored",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.leadId);
    }

    auditLog("lead_scored", {
      leadId: payload.leadId,
      mode: response.mode,
      auditId: response.auditId,
    });

    return ok(response);
  } catch (error) {
    return fail(error);
  }
}
