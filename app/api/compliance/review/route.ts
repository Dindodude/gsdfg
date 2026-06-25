import { runAgent } from "@/lib/agents/run-agent";
import { complianceReviewSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/data/queries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("compliance-review");
    const payload = sanitizeInput(complianceReviewSchema.parse(await request.json()));
    const response = await runAgent({
      agent: "security-compliance",
      leadId: payload.leadId,
      input: {
        targetType: payload.targetType,
        targetName: payload.targetName,
        content: payload.content,
        metadata: payload.metadata,
      },
    });
    const result = response.result as { status?: string; riskLevel?: string };
    const supabase = await createClient();
    const user = await ensureUserProfile();

    if (supabase && user) {
      await supabase.from("compliance_reviews").insert({
        user_id: user.id,
        lead_id: payload.leadId ?? null,
        target_type: payload.targetType,
        target_name: payload.targetName,
        risk_level: result.riskLevel ?? "Medium",
        issues_found: (response.result as { issuesFound?: string[] }).issuesFound ?? [],
        fixes_required: (response.result as { fixesRequired?: string[] }).fixesRequired ?? [],
        status: result.status ?? "Needs Fixes",
        agent_notes: (response.result as { agentNotes?: string }).agentNotes ?? "",
      });
    }

    auditLog("compliance_review_completed", {
      leadId: payload.leadId,
      targetType: payload.targetType,
      targetName: payload.targetName,
      status: result.status,
      riskLevel: result.riskLevel,
      auditId: response.auditId,
    });

    return ok({
      review: response,
      blocked: result.status === "Blocked" || result.riskLevel === "High",
    });
  } catch (error) {
    return fail(error);
  }
}
