import { runAgent } from "@/lib/agents/run-agent";
import { fail, ok } from "@/lib/api/responses";
import { outreachGenerateSchema } from "@/lib/api/schemas";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import { ensureUserProfile } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

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
    const outreachResult = outreach.result as {
      firstEmail: { subject: string; body: string };
      firstTextMessage: string;
      followUp1: string;
      followUp2: string;
      shortDm: string;
    };
    const complianceResult = compliance.result as {
      riskLevel?: "Low" | "Medium" | "High";
      status?: "Approved" | "Needs Fixes" | "Blocked";
      issuesFound?: string[];
      fixesRequired?: string[];
      agentNotes?: string;
    };
    const supabase = await createClient();
    const user = await ensureUserProfile();
    const savedMessageIds: string[] = [];

    if (supabase && user) {
      await supabase.from("compliance_reviews").insert({
        user_id: user.id,
        lead_id: payload.leadId,
        target_type: "Outreach",
        target_name: "Generated outreach message set",
        risk_level: complianceResult.riskLevel ?? "Medium",
        issues_found: complianceResult.issuesFound ?? [],
        fixes_required: complianceResult.fixesRequired ?? [],
        status: complianceResult.status ?? "Needs Fixes",
        agent_notes: complianceResult.agentNotes ?? "",
      });

      const messageStatus = complianceResult.status === "Approved" ? "Approved" : complianceResult.status === "Blocked" ? "Blocked" : "Draft";
      const complianceStatus = complianceResult.status ?? "Needs Fixes";
      const now = Date.now();
      const messages = [
        {
          user_id: user.id,
          lead_id: payload.leadId,
          channel: "Email",
          subject: outreachResult.firstEmail.subject,
          body: outreachResult.firstEmail.body,
          status: messageStatus,
          compliance_status: complianceStatus,
          scheduled_for: new Date(now).toISOString(),
        },
        {
          user_id: user.id,
          lead_id: payload.leadId,
          channel: "SMS",
          body: outreachResult.firstTextMessage,
          status: messageStatus,
          compliance_status: complianceStatus,
          scheduled_for: new Date(now + 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          lead_id: payload.leadId,
          channel: "Email",
          subject: "Following up",
          body: outreachResult.followUp1,
          status: messageStatus,
          compliance_status: complianceStatus,
          scheduled_for: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          lead_id: payload.leadId,
          channel: "Email",
          subject: "Last note",
          body: outreachResult.followUp2,
          status: messageStatus,
          compliance_status: complianceStatus,
          scheduled_for: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          user_id: user.id,
          lead_id: payload.leadId,
          channel: "DM",
          body: outreachResult.shortDm,
          status: messageStatus,
          compliance_status: complianceStatus,
          scheduled_for: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
        },
      ];

      const { data, error } = await supabase.from("outreach_messages").insert(messages).select("id");
      if (error) throw error;
      savedMessageIds.push(...(data ?? []).map((message) => message.id));

      await supabase
        .from("leads")
        .update({
          status: complianceResult.status === "Blocked" ? "Compliance Review" : "Outreach Ready",
          compliance_status: complianceStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.leadId);
    }

    auditLog("outreach_generated", {
      leadId: payload.leadId,
      outreachAuditId: outreach.auditId,
      complianceAuditId: compliance.auditId,
      complianceMode: compliance.mode,
    });

    return ok({
      outreach,
      compliance,
      savedMessageIds,
      blocked: complianceResult.status === "Blocked",
    });
  } catch (error) {
    return fail(error);
  }
}
