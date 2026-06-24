import { runAgent } from "@/lib/agents/run-agent";
import { fail, ok } from "@/lib/api/responses";
import { websiteGenerateSchema } from "@/lib/api/schemas";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("website-generate");
    const payload = sanitizeInput(websiteGenerateSchema.parse(await request.json()));
    const intake = await runAgent({
      agent: "website-intake",
      leadId: payload.leadId,
      input: {
        ownerNotes: payload.ownerNotes,
        requirements: payload.requirements,
      },
    });
    const homepage = await runAgent({
      agent: "website-builder-1",
      leadId: payload.leadId,
      input: intake.result as Record<string, unknown>,
    });
    const pages = await runAgent({
      agent: "website-builder-2",
      leadId: payload.leadId,
      input: {
        intake: intake.result,
        homepage: homepage.result,
      },
    });

    auditLog("website_generated", {
      leadId: payload.leadId,
      intakeAuditId: intake.auditId,
      homepageAuditId: homepage.auditId,
      pagesAuditId: pages.auditId,
    });

    return ok({
      intake,
      homepage,
      pages,
      nextStatus: "QA Review",
    });
  } catch (error) {
    return fail(error);
  }
}
