import { runAgent } from "@/lib/agents/run-agent";
import { fail, ok } from "@/lib/api/responses";
import { websiteGenerateSchema } from "@/lib/api/schemas";
import { auditLog, rateLimitPlaceholder, sanitizeInput } from "@/lib/security";
import { ensureUserProfile } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function sectionId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

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
    const intakeResult = intake.result as {
      websiteGoal?: string;
      brandStyle?: string;
      primaryCta?: string;
    };
    const homepageResult = homepage.result as {
      homepage?: {
        heroConcept?: string;
        primaryCta?: string;
        sections?: Array<{ type: string; title: string; copy: string; cta?: string | null }>;
      };
    };
    const pagesResult = pages.result as {
      pages?: Array<{
        pageName: string;
        slug: string;
        seoTitle: string;
        sections: Array<{ type: string; title: string; copy: string; cta?: string | null }>;
      }>;
    };
    const supabase = await createClient();
    const user = await ensureUserProfile();
    let websiteProjectId: string | null = null;

    if (supabase && user) {
      const { data: lead } = await supabase.from("leads").select("business_name,industry,estimated_value").eq("id", payload.leadId).maybeSingle();
      const { data: project, error: projectError } = await supabase
        .from("website_projects")
        .insert({
          user_id: user.id,
          lead_id: payload.leadId,
          package_name: "AI Website Build",
          status: "In Progress",
          progress: 55,
          brand_style: intakeResult.brandStyle ?? "Premium, clear, conversion-focused.",
          primary_goal: intakeResult.websiteGoal ?? "Generate qualified client inquiries.",
          preview_url: `/preview/${payload.leadId}`,
          estimated_revenue: lead?.estimated_value ?? 0,
          requirements: {
            intake: intake.result,
            homepage: homepage.result,
          },
        })
        .select("id")
        .single();

      if (projectError) throw projectError;
      websiteProjectId = project.id;

      const homeSections = (homepageResult.homepage?.sections ?? []).map((section, index) => ({
        id: sectionId("home-section", index),
        type: section.type,
        title: section.title,
        copy: section.copy,
        cta: section.cta ?? null,
      }));
      const pageRows = [
        {
          user_id: user.id,
          website_project_id: project.id,
          page_name: "Home",
          slug: "/",
          status: "Draft",
          seo_title: `${lead?.business_name ?? "Business"} Website`,
          sections: homeSections,
        },
        ...(pagesResult.pages ?? []).map((page, pageIndex) => ({
          user_id: user.id,
          website_project_id: project.id,
          page_name: page.pageName,
          slug: page.slug,
          status: "Draft",
          seo_title: page.seoTitle,
          sections: page.sections.map((section, sectionIndex) => ({
            id: sectionId(`page-${pageIndex + 1}-section`, sectionIndex),
            type: section.type,
            title: section.title,
            copy: section.copy,
            cta: section.cta ?? null,
          })),
        })),
      ];

      const { error: pagesError } = await supabase.from("website_pages").insert(pageRows);
      if (pagesError) throw pagesError;

      await supabase
        .from("leads")
        .update({
          status: "Website In Progress",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.leadId);
    }

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
      websiteProjectId,
      nextStatus: "QA Review",
    });
  } catch (error) {
    return fail(error);
  }
}
