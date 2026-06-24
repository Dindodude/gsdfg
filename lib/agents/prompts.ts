import type { AgentKey } from "@/lib/types";

export interface AgentPrompt {
  title: string;
  system: string;
  outputSchema: Record<string, unknown>;
}

const complianceRules = [
  "Do not approve spam-like outreach.",
  "Sender identity must be included in outbound messages.",
  "Unsubscribe or opt-out language must be present for cold outreach.",
  "Marketing claims must be accurate, non-misleading, and free of fake guarantees.",
  "Do not copy copyrighted content.",
  "Do not request unnecessary personal data.",
  "Contact forms must use secure handling and include a privacy note when collecting personal data.",
  "Flag privacy policy requirements for contact forms, analytics, and personal data collection.",
  "Flag terms, disclaimers, or professional-license notices when needed.",
  "Apply basic CASL-style awareness for Canada and basic privacy/PIPEDA-style awareness.",
  "Flag cookie or analytics notice needs when tracking is used.",
  "High-risk items must be blocked until fixed.",
];

export const agentPrompts: Record<AgentKey, AgentPrompt> = {
  "lead-finder": {
    title: "Lead Finder Agent",
    system:
      "You find or import businesses that may need websites. For this MVP, return realistic mock leads or normalize manually imported lead records. Future integrations may include Google Maps, CSV imports, and external lead APIs.",
    outputSchema: {
      leads: [
        {
          businessName: "string",
          industry: "string",
          city: "string",
          websiteUrl: "string|null",
          email: "string",
          phone: "string",
          source: "string",
          likelyNeed: "string",
        },
      ],
    },
  },
  "lead-scoring": {
    title: "Lead Scoring Agent",
    system:
      "Score leads from 0-100 based on weak or missing website, poor mobile experience, missing booking/contact forms, low Google presence, weak branding, slow site, missing SEO basics, and business type likely to buy.",
    outputSchema: {
      leadScore: 0,
      websiteQualityScore: 0,
      googlePresenceScore: 0,
      reasons: ["string"],
      recommendedStatus: "Scored",
      nextAction: "string",
    },
  },
  "marketing-strategy": {
    title: "Marketing Strategy Agent",
    system:
      "Create a practical strategy brief for selling a website package to this business. Include pain points, package angle, offer idea, suggested price range, and main selling points.",
    outputSchema: {
      packageAngle: "string",
      painPoints: ["string"],
      offerIdea: "string",
      suggestedPriceRange: "string",
      sellingPoints: ["string"],
    },
  },
  outreach: {
    title: "Outreach Agent",
    system:
      "Generate concise cold outreach that is clear, specific, respectful, and compliant. Include first email, first SMS, follow-up 1, follow-up 2, and a short DM. Do not make fake claims or guarantees.",
    outputSchema: {
      firstEmail: { subject: "string", body: "string" },
      firstTextMessage: "string",
      followUp1: "string",
      followUp2: "string",
      shortDm: "string",
      complianceChecklist: ["string"],
    },
  },
  "reply-classifier": {
    title: "Reply Classifier Agent",
    system:
      "Classify the reply as Interested, Not interested, Needs more info, Call requested, Wrong contact, or Do not contact. Return confidence and owner action.",
    outputSchema: {
      classification: "Interested|Not interested|Needs more info|Call requested|Wrong contact|Do not contact",
      confidence: 0,
      ownerAction: "string",
      rationale: "string",
    },
  },
  "website-intake": {
    title: "Website Intake Agent",
    system:
      "After the owner talks to an interested lead, convert owner notes into a website intake plan: goal, required pages, brand style, services, CTA, content plan, and missing information checklist.",
    outputSchema: {
      websiteGoal: "string",
      requiredPages: ["Home", "About", "Services", "Contact", "FAQ", "Local landing page"],
      brandStyle: "string",
      services: ["string"],
      primaryCta: "string",
      contentPlan: ["string"],
      missingInfoChecklist: ["string"],
    },
  },
  "website-builder-1": {
    title: "Website Builder Agent 1",
    system:
      "Create the homepage structure, conversion copy, sections, CTA layout, hero concept, and service cards. Return website layout JSON suitable for preview and export.",
    outputSchema: {
      homepage: {
        heroConcept: "string",
        primaryCta: "string",
        sections: [{ type: "string", title: "string", copy: "string", cta: "string|null" }],
        serviceCards: [{ title: "string", copy: "string" }],
      },
    },
  },
  "website-builder-2": {
    title: "Website Builder Agent 2",
    system:
      "Create full website page drafts for About, Services, Contact, FAQ, and Local landing page. Include SEO title, sections, copy, and CTA per page.",
    outputSchema: {
      pages: [
        {
          pageName: "string",
          slug: "string",
          seoTitle: "string",
          sections: [{ type: "string", title: "string", copy: "string", cta: "string|null" }],
        },
      ],
    },
  },
  qa: {
    title: "QA Agent",
    system:
      "Check spelling, grammar, broken links, missing CTAs, mobile layout, page consistency, form validation, speed issues, and accessibility basics. Return pass/fail and fixes.",
    outputSchema: {
      passed: true,
      issues: [{ severity: "Low|Medium|High", area: "string", detail: "string", fix: "string" }],
      readyForCompliance: true,
      summary: "string",
    },
  },
  "security-compliance": {
    title: "Security & Compliance Agent",
    system: `You are the mandatory security and compliance reviewer. Run before outreach and before website delivery. Rules:\n${complianceRules
      .map((rule) => `- ${rule}`)
      .join("\n")}`,
    outputSchema: {
      riskLevel: "Low|Medium|High",
      status: "Approved|Needs Fixes|Blocked",
      issuesFound: ["string"],
      fixesRequired: ["string"],
      agentNotes: "string",
    },
  },
  delivery: {
    title: "Delivery Agent",
    system:
      "Prepare the client preview message, website summary, what was built, revision request link/message, and next steps. Do not send until compliance is approved.",
    outputSchema: {
      clientPreviewMessage: "string",
      websiteSummary: "string",
      whatWasBuilt: ["string"],
      revisionRequestMessage: "string",
      nextSteps: ["string"],
    },
  },
};

export function getAgentPrompt(agent: AgentKey) {
  return agentPrompts[agent];
}
