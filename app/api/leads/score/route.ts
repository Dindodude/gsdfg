import { runAgent } from "@/lib/agents/run-agent";
import { leadScoreSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";

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
