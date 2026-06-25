import { leadCreateSchema } from "@/lib/api/schemas";
import { created, fail, ok } from "@/lib/api/responses";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import type { Lead } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile, getLeads } from "@/lib/data/queries";
import { mapLead } from "@/lib/data/mappers";

export const runtime = "nodejs";

export async function GET() {
  try {
    rateLimitPlaceholder("leads-list");
    const result = await getLeads();

    return ok({
      mode: result.source,
      leads: result.data,
      summary: {
        total: result.data.length,
        interested: result.data.filter((lead) => ["Interested", "Owner Talking"].includes(lead.status)).length,
        blocked: result.data.filter((lead) => lead.complianceStatus === "Blocked").length,
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
    const supabase = await createClient();
    const user = await ensureUserProfile();

    if (supabase && user) {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          user_id: user.id,
          business_name: payload.businessName,
          industry: payload.industry,
          city: payload.city,
          website_url: payload.websiteUrl ?? null,
          email: payload.email,
          phone: payload.phone,
          social_links: payload.socialLinks,
          notes: payload.notes,
          source: payload.source,
          status: "New",
          compliance_status: "Pending",
        })
        .select("*")
        .single();

      if (error) throw error;

      auditLog("lead_created_supabase", {
        leadId: data.id,
        businessName: data.business_name,
      });

      return created({ mode: "supabase", lead: mapLead(data) });
    }

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
