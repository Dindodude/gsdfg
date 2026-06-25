import { leadFindSchema } from "@/lib/api/schemas";
import { ok } from "@/lib/api/responses";
import { runAgent } from "@/lib/agents/run-agent";
import { ensureUserProfile } from "@/lib/data/queries";
import { mapLead } from "@/lib/data/mappers";
import { findPlacesLeads } from "@/lib/integrations/google-places";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function leadFinderErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === "object" && "message" in error
        ? String(error.message)
        : String(error);
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";

  if (message.includes("GOOGLE_PLACES_API_KEY")) {
    return "GOOGLE_PLACES_API_KEY is missing in Vercel.";
  }

  if (message.includes("Google Places lead search failed")) {
    return message;
  }

  if (message.includes("Supabase auth")) {
    return "Sign in with Supabase before finding leads.";
  }

  if (message.includes("OPENAI_API_KEY")) {
    return "OPENAI_API_KEY is missing, so found leads could not be scored.";
  }

  if (message.includes("google_review_count") || message.includes("has_website") || message.includes("external_source_id")) {
    return "Supabase migration 004 is missing. Run supabase/migrations/004_lead_targeting_metadata.sql, then redeploy.";
  }

  if (message.includes("ON CONFLICT") || code === "42P10") {
    return "Supabase lead dedupe index is missing or outdated. Run the latest Supabase migrations, then redeploy.";
  }

  if (message && message !== "[object Object]") {
    return message;
  }

  return "Lead finding failed. Check Supabase migrations and Vercel environment variables.";
}

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

    await supabase
      .from("leads")
      .delete()
      .eq("user_id", user.id)
      .eq("source", "Google Places Text Search")
      .not("notes", "ilike", "%Target match: 100-200 reviews and no website%");

    if (foundLeads.length === 0) {
      return ok({
        found: 0,
        inserted: 0,
        leads: [],
      });
    }

    const externalSourceIds = foundLeads.map((lead) => lead.externalSourceId).filter((id): id is string => Boolean(id));

    if (externalSourceIds.length > 0) {
      const { error: dedupeDeleteError } = await supabase
        .from("leads")
        .delete()
        .eq("user_id", user.id)
        .eq("source", "Google Places Text Search")
        .in("external_source_id", externalSourceIds);

      if (dedupeDeleteError) throw dedupeDeleteError;
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
          google_review_count: lead.reviewCount,
          has_website: lead.hasWebsite,
          external_source_id: lead.externalSourceId,
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
    let scored = 0;
    let scoringWarning: string | null = null;

    for (const lead of topLeads) {
      try {
        await runAgent({
          agent: "lead-scoring",
          leadId: String(lead.id),
          input: {
            source: "Google Places Text Search",
            lead: mapLead(lead),
          },
        });
        scored += 1;
      } catch (error) {
        scoringWarning = leadFinderErrorMessage(error);
        auditLog("lead_finder_scoring_warning", {
          leadId: lead.id,
          warning: scoringWarning,
        });
      }
    }

    auditLog("leads_found_google_places", {
      userId: user.id,
      industry: payload.industry,
      city: payload.city,
      found: foundLeads.length,
      inserted: inserted.length,
      scored,
      scoringWarning,
    });

    return ok({
      found: foundLeads.length,
      inserted: inserted.length,
      scored,
      scoringWarning,
      leads: inserted.map(mapLead),
    });
  } catch (error) {
    auditLog("lead_finder_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        ok: false,
        error: leadFinderErrorMessage(error),
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }
}
