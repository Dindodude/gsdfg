import { leadEmailEnrichSchema } from "@/lib/api/schemas";
import { ok } from "@/lib/api/responses";
import { ensureUserProfile } from "@/lib/data/queries";
import { scrapeEmailsFromWebsite } from "@/lib/integrations/email-scraper";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("leads-email-enrich");
    const payload = sanitizeInput(leadEmailEnrichSchema.parse(await request.json()));
    const supabase = await createClient();
    const user = await ensureUserProfile();

    if (!supabase || !user) {
      throw new Error("Supabase auth is required to enrich lead emails.");
    }

    let query = supabase
      .from("leads")
      .select("id,business_name,website_url,email,notes")
      .eq("user_id", user.id)
      .or("email.is.null,email.eq.");

    if (payload.leadId) {
      query = query.eq("id", payload.leadId);
    }

    const { data: leads, error } = await query.limit(payload.leadId ? 1 : 25);
    if (error) throw error;

    let updated = 0;
    let skippedNoWebsite = 0;
    const results: Array<{ leadId: string; businessName: string; email: string | null; status: string }> = [];

    for (const lead of leads ?? []) {
      if (!lead.website_url) {
        skippedNoWebsite += 1;
        results.push({
          leadId: lead.id,
          businessName: lead.business_name,
          email: null,
          status: "No website to scrape. Use an email enrichment provider or manual lookup.",
        });
        continue;
      }

      const emails = await scrapeEmailsFromWebsite(lead.website_url);
      const email = emails[0] ?? null;

      if (!email) {
        results.push({
          leadId: lead.id,
          businessName: lead.business_name,
          email: null,
          status: "No public email found on website/contact pages.",
        });
        continue;
      }

      const { error: updateError } = await supabase
        .from("leads")
        .update({
          email,
          notes: `${lead.notes ?? ""}\nEmail scraped from website/contact pages: ${email}`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (updateError) throw updateError;

      updated += 1;
      results.push({
        leadId: lead.id,
        businessName: lead.business_name,
        email,
        status: "Email found and saved.",
      });
    }

    auditLog("lead_email_enrichment_completed", {
      userId: user.id,
      leadId: payload.leadId ?? null,
      checked: leads?.length ?? 0,
      updated,
      skippedNoWebsite,
    });

    return ok({
      checked: leads?.length ?? 0,
      updated,
      skippedNoWebsite,
      results,
    });
  } catch (error) {
    auditLog("lead_email_enrichment_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Email enrichment failed.",
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }
}
