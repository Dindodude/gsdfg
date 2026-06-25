import { z } from "zod";
import type { AgentKey } from "@/lib/types";

const riskLevelSchema = z.enum(["Low", "Medium", "High"]);
const complianceStatusSchema = z.enum(["Approved", "Needs Fixes", "Blocked"]);
const leadStatusSchema = z.enum(["Scored", "Outreach Ready"]);
const replyClassificationSchema = z.enum([
  "Interested",
  "Not interested",
  "Needs more info",
  "Call requested",
  "Wrong contact",
  "Do not contact",
]);

const websiteSectionSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  copy: z.string().min(1),
  cta: z.string().nullable().optional(),
});

export const agentOutputSchemas = {
  "lead-finder": z.object({
    leads: z.array(
      z.object({
        businessName: z.string().min(1),
        industry: z.string().min(1),
        city: z.string().min(1),
        websiteUrl: z.string().nullable(),
        email: z.string().min(1),
        phone: z.string().min(1),
        source: z.string().min(1),
        likelyNeed: z.string().min(1),
      }),
    ),
  }),
  "lead-scoring": z.object({
    leadScore: z.number().min(0).max(100),
    websiteQualityScore: z.number().min(0).max(100),
    googlePresenceScore: z.number().min(0).max(100),
    reasons: z.array(z.string().min(1)),
    recommendedStatus: leadStatusSchema,
    nextAction: z.string().min(1),
  }),
  "marketing-strategy": z.object({
    packageAngle: z.string().min(1),
    painPoints: z.array(z.string().min(1)),
    offerIdea: z.string().min(1),
    suggestedPriceRange: z.string().min(1),
    sellingPoints: z.array(z.string().min(1)),
  }),
  outreach: z.object({
    firstEmail: z.object({
      subject: z.string().min(1),
      body: z.string().min(1),
    }),
    firstTextMessage: z.string().min(1),
    followUp1: z.string().min(1),
    followUp2: z.string().min(1),
    shortDm: z.string().min(1),
    complianceChecklist: z.array(z.string().min(1)),
  }),
  "reply-classifier": z.object({
    classification: replyClassificationSchema,
    confidence: z.number().min(0).max(100),
    ownerAction: z.string().min(1),
    rationale: z.string().min(1),
  }),
  "website-intake": z.object({
    websiteGoal: z.string().min(1),
    requiredPages: z.array(z.string().min(1)),
    brandStyle: z.string().min(1),
    services: z.array(z.string().min(1)),
    primaryCta: z.string().min(1),
    contentPlan: z.array(z.string().min(1)),
    missingInfoChecklist: z.array(z.string().min(1)),
  }),
  "website-builder-1": z.object({
    homepage: z.object({
      heroConcept: z.string().min(1),
      primaryCta: z.string().min(1),
      sections: z.array(websiteSectionSchema),
      serviceCards: z.array(
        z.object({
          title: z.string().min(1),
          copy: z.string().min(1),
        }),
      ),
    }),
  }),
  "website-builder-2": z.object({
    pages: z.array(
      z.object({
        pageName: z.string().min(1),
        slug: z.string().min(1),
        seoTitle: z.string().min(1),
        sections: z.array(websiteSectionSchema),
      }),
    ),
  }),
  qa: z.object({
    passed: z.boolean(),
    issues: z.array(
      z.object({
        severity: z.enum(["Low", "Medium", "High"]),
        area: z.string().min(1),
        detail: z.string().min(1),
        fix: z.string().min(1),
      }),
    ),
    readyForCompliance: z.boolean(),
    summary: z.string().min(1),
  }),
  "security-compliance": z.object({
    riskLevel: riskLevelSchema,
    status: complianceStatusSchema,
    issuesFound: z.array(z.string()),
    fixesRequired: z.array(z.string()),
    agentNotes: z.string().min(1),
  }),
  delivery: z.object({
    clientPreviewMessage: z.string().min(1),
    websiteSummary: z.string().min(1),
    whatWasBuilt: z.array(z.string().min(1)),
    revisionRequestMessage: z.string().min(1),
    nextSteps: z.array(z.string().min(1)),
  }),
} satisfies Record<AgentKey, z.ZodType>;

export type AgentOutput<TAgent extends AgentKey> = z.infer<(typeof agentOutputSchemas)[TAgent]>;

export function validateAgentOutput(agent: AgentKey, output: unknown) {
  const schema = agentOutputSchemas[agent];
  const parsed = schema.safeParse(output);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Agent ${agent} returned invalid JSON shape: ${issues}`);
  }

  return parsed.data;
}
