import { runAgent } from "@/lib/agents/run-agent";
import { qaReviewSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/data/queries";

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
    const result = response.result as {
      passed?: boolean;
      issues?: Array<{ severity: "Low" | "Medium" | "High"; area: string; detail: string; fix: string }>;
      readyForCompliance?: boolean;
      summary?: string;
    };
    const supabase = await createClient();
    const user = await ensureUserProfile();

    if (supabase && user && payload.websiteProjectId) {
      const hasHighIssue = (result.issues ?? []).some((issue) => issue.severity === "High");
      await supabase
        .from("website_projects")
        .update({
          status: result.passed && !hasHighIssue ? "Compliance Review" : "QA Review",
          progress: result.passed && !hasHighIssue ? 78 : 68,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.websiteProjectId);

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        actor: "QA Agent",
        action: result.passed ? "completed QA review" : "flagged QA issues",
        target: payload.websiteProjectId,
        severity: hasHighIssue ? "warning" : "success",
        metadata: response.result as Record<string, unknown>,
      });

      if ((result.issues ?? []).length > 0) {
        await supabase.from("tasks").insert({
          user_id: user.id,
          lead_id: payload.leadId ?? null,
          title: "Review QA findings",
          description: result.summary ?? "QA Agent found issues that need review.",
          priority: hasHighIssue ? "High" : "Medium",
          status: "Open",
          action: "Open website QA review",
          due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

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
