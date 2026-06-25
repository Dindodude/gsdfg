import { leadFindSchema } from "@/lib/api/schemas";
import { fail, ok } from "@/lib/api/responses";
import { runAgent } from "@/lib/agents/run-agent";
import { ensureUserProfile } from "@/lib/data/queries";
import { mapLead } from "@/lib/data/mappers";
import { findPlacesLeads } from "@/lib/integrations/google-places";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("leads-find");
    const payload = sanitizeInput(leadFindSchema.parse(await request.json()));
    const supabase = await createClient();
    const user = await ensureUserProfile();

    if (!supabase || !user) {
      throw new Error("Supabase auth is required to save found leads.");
    }

    const foundLeads = await findPlacesLeads(payload);

    if (foundLeads.length === 0) {
      return ok({
        found: 0,
        inserted: 0,
        leads: [],
      });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert(
        foundLeads.map((lead) => ({
          user_id: user.id,
          business_name: lead.businessName,
          industry: lead.industry,
          city: lead.city,
          website_url: lead.websiteUrl,
          email: lead.email,
          phone: lead.phone,
          social_links: lead.socialLinks,
          current_website_quality_score: lead.currentWebsiteQualityScore,
          google_presence_score: lead.googlePresenceScore,
          lead_score: lead.leadScore,
          status: "New",
          notes: lead.notes,
          source: lead.source,
          compliance_status: "Pending",
          estimated_value: lead.estimatedValue,
        })),
      )
      .select("*");

    if (error) throw error;

    const inserted = data ?? [];
    const topLeads = inserted
      .sort((a, b) => Number(b.lead_score ?? 0) - Number(a.lead_score ?? 0))
      .slice(0, 3);

    for (const lead of topLeads) {
      await runAgent({
        agent: "lead-scoring",
        leadId: String(lead.id),
        input: {
          source: "Google Places Text Search",
          lead: mapLead(lead),
        },
      });
    }

    auditLog("leads_found_google_places", {
      userId: user.id,
      industry: payload.industry,
      city: payload.city,
      found: foundLeads.length,
      inserted: inserted.length,
      scored: topLeads.length,
    });

    return ok({
      found: foundLeads.length,
      inserted: inserted.length,
      scored: topLeads.length,
      leads: inserted.map(mapLead),
    });
  } catch (error) {
    return fail(error);
  }
}
