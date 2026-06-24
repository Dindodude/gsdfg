import { runAgent } from "@/lib/agents/run-agent";
import { qaReviewSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("qa-review");
    const payload = sanitizeInput(qaReviewSchema.parse(await request.json()));
    const response = await runAgent({
      agent: "qa",
      leadId: payload.leadId,
      input: {
        websiteProjectId: payload.websiteProjectId,
        content: payload.content,
      },
    });

    auditLog("qa_review_completed", {
      websiteProjectId: payload.websiteProjectId,
      leadId: payload.leadId,
      auditId: response.auditId,
    });

    return ok(response);
  } catch (error) {
    return fail(error);
  }
}
