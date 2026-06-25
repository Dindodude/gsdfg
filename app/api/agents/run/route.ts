import { runAgentSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { runAgent } from "@/lib/agents/run-agent";
import { auditLog, rateLimitPlaceholder } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/data/queries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("agents-run");
    const payload = runAgentSchema.parse(await request.json());
    const response = await runAgent(payload);
    const supabase = await createClient();
    const user = await ensureUserProfile();

    if (supabase && user) {
      const { data: agent } = await supabase.from("agents").select("id").eq("key", payload.agent).maybeSingle();
      await supabase.from("agent_runs").insert({
        user_id: user.id,
        agent_id: agent?.id ?? null,
        lead_id: payload.leadId ?? null,
        status: "completed",
        input: payload.input ?? {},
        output: response.result as Record<string, unknown>,
        token_usage: response.usage,
        cost_estimate: response.usage.estimatedCostUsd,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }

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
