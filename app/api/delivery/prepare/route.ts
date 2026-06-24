import { runAgent } from "@/lib/agents/run-agent";
import { deliveryPrepareSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("delivery-prepare");
    const payload = sanitizeInput(deliveryPrepareSchema.parse(await request.json()));

    if (!payload.complianceApproved) {
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
