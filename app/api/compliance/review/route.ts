import { runAgent } from "@/lib/agents/run-agent";
import { complianceReviewSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";

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
