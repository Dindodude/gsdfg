import { runAgentSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { runAgent } from "@/lib/agents/run-agent";
import { auditLog, rateLimitPlaceholder } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("agents-run");
    const payload = runAgentSchema.parse(await request.json());
    const response = await runAgent(payload);

    auditLog("api_agents_run", {
      agent: payload.agent,
      leadId: payload.leadId,
      mode: response.mode,
      auditId: response.auditId,
    });

    return ok(response);
  } catch (error) {
    return fail(error);
  }
}
