import { runAgent } from "@/lib/agents/run-agent";
import { fail, ok } from "@/lib/api/responses";
import { outreachGenerateSchema } from "@/lib/api/schemas";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("outreach-generate");
    const payload = sanitizeInput(outreachGenerateSchema.parse(await request.json()));
    const outreach = await runAgent({
      agent: "outreach",
      leadId: payload.leadId,
      input: {
        strategy: payload.strategy,
        requirement: "Generate first email, first SMS, two follow-ups, and short DM.",
      },
    });
    const compliance = await runAgent({
      agent: "security-compliance",
      leadId: payload.leadId,
      input: outreach.result as Record<string, unknown>,
    });

    auditLog("outreach_generated", {
      leadId: payload.leadId,
      outreachAuditId: outreach.auditId,
      complianceAuditId: compliance.auditId,
      complianceMode: compliance.mode,
    });

    return ok({
      outreach,
      compliance,
      blocked: (compliance.result as { status?: string }).status === "Blocked",
    });
  } catch (error) {
    return fail(error);
  }
}
