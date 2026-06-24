import { leadCreateSchema } from "@/lib/api/schemas";
import { created, fail, ok } from "@/lib/api/responses";
import { leads } from "@/lib/mock-data";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  try {
    rateLimitPlaceholder("leads-list");
    return ok({
      mode: "mock",
      leads,
      summary: {
        total: leads.length,
        interested: leads.filter((lead) => ["Interested", "Owner Talking"].includes(lead.status)).length,
        blocked: leads.filter((lead) => lead.complianceStatus === "Blocked").length,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("leads-create");
    const payload = sanitizeInput(leadCreateSchema.parse(await request.json()));
    const lead: Lead = {
      id: `lead-${crypto.randomUUID()}`,
      businessName: payload.businessName,
      industry: payload.industry,
      city: payload.city,
      websiteUrl: payload.websiteUrl ?? null,
      email: payload.email,
      phone: payload.phone,
      socialLinks: payload.socialLinks,
      currentWebsiteQualityScore: 0,
      googlePresenceScore: 0,
      leadScore: 0,
      status: "New",
      notes: payload.notes,
      source: payload.source,
      lastContacted: null,
      nextFollowUpDate: null,
      complianceStatus: "Pending",
      estimatedValue: 0,
      owner: "Unknown",
    };

    auditLog("lead_created_mock", {
      leadId: lead.id,
      businessName: lead.businessName,
      todo: "Persist to Supabase leads table when configured.",
    });

    return created({ mode: "mock", lead });
  } catch (error) {
    return fail(error);
  }
}
