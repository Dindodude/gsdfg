import { runAgent } from "@/lib/agents/run-agent";
import { deliveryPrepareSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/data/queries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("delivery-prepare");
    const payload = sanitizeInput(deliveryPrepareSchema.parse(await request.json()));
    const supabase = await createClient();
    const user = await ensureUserProfile();
    let complianceApproved = payload.complianceApproved;

    if (supabase && user && payload.leadId) {
      const { data: review } = await supabase
        .from("compliance_reviews")
        .select("id,status,risk_level")
        .eq("lead_id", payload.leadId)
        .in("target_type", ["Website Content", "Delivery"])
        .eq("status", "Approved")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      complianceApproved = Boolean(review && review.risk_level !== "High");
    }

    if (!complianceApproved) {
      auditLog("delivery_blocked_by_compliance", {
        websiteProjectId: payload.websiteProjectId,
        leadId: payload.leadId,
      });

      return ok({
        blocked: true,
        reason: "Delivery cannot be prepared until Security & Compliance Agent approves the website content.",
      });
    }

    const response = await runAgent({
      agent: "delivery",
      leadId: payload.leadId,
      input: {
        websiteProjectId: payload.websiteProjectId,
        previewUrl: payload.previewUrl,
      },
    });

    if (supabase && user) {
      if (payload.websiteProjectId) {
        await supabase
          .from("website_projects")
          .update({
            status: "Client Preview Ready",
            progress: 96,
            preview_url: payload.previewUrl ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.websiteProjectId);
      }

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        actor: "Delivery Agent",
        action: "prepared client delivery",
        target: payload.websiteProjectId ?? payload.leadId ?? "website project",
        severity: "success",
        metadata: response.result as Record<string, unknown>,
      });

      await supabase.from("tasks").insert({
        user_id: user.id,
        lead_id: payload.leadId ?? null,
        title: "Send client preview",
        description: "Delivery Agent prepared the preview message and next steps.",
        priority: "High",
        status: "Open",
        action: "Send client preview",
        due_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      });
    }

    auditLog("delivery_prepared", {
      websiteProjectId: payload.websiteProjectId,
      leadId: payload.leadId,
      auditId: response.auditId,
    });

    return ok({
      blocked: false,
      delivery: response,
    });
  } catch (error) {
    return fail(error);
  }
}
