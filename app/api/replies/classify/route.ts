import { runAgent } from "@/lib/agents/run-agent";
import { fail, ok } from "@/lib/api/responses";
import { replyClassifySchema } from "@/lib/api/schemas";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("reply-classify");
    const payload = sanitizeInput(replyClassifySchema.parse(await request.json()));
    const response = await runAgent({
      agent: "reply-classifier",
      leadId: payload.leadId,
      input: {
        replyText: payload.replyText,
        channel: payload.channel,
      },
    });

    auditLog("reply_classified", {
      leadId: payload.leadId,
      channel: payload.channel,
      auditId: response.auditId,
    });

    return ok(response);
  } catch (error) {
    return fail(error);
  }
}
