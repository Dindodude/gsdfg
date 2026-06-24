import type { AgentKey, Lead, RiskLevel } from "@/lib/types";

interface MockContext {
  lead?: Lead;
  input?: Record<string, unknown>;
}

function leadName(context: MockContext) {
  return context.lead?.businessName ?? "the selected business";
}

function industry(context: MockContext) {
  return context.lead?.industry ?? "local service business";
}

function city(context: MockContext) {
  return context.lead?.city ?? "the local market";
}

function complianceFromText(text: string) {
  const lower = text.toLowerCase();
  const issuesFound: string[] = [];
  const fixesRequired: string[] = [];
  let riskLevel: RiskLevel = "Low";

  if (lower.includes("guarantee") || lower.includes("#1") || lower.includes("best in")) {
    riskLevel = "High";
    issuesFound.push("Potentially misleading claim or guarantee detected.");
    fixesRequired.push("Remove unsupported guarantee/ranking language or provide verifiable proof.");
  }

  if (!lower.includes("unsubscribe") && !lower.includes("opt out") && !lower.includes("reply stop")) {
    riskLevel = riskLevel === "High" ? "High" : "Medium";
    issuesFound.push("No clear unsubscribe or opt-out language found.");
    fixesRequired.push("Add a clear opt-out line such as reply stop or unsubscribe.");
  }

  if (!lower.includes("agencyforge") && !lower.includes("sender")) {
    riskLevel = riskLevel === "High" ? "High" : "Medium";
    issuesFound.push("Sender identity is not clear enough.");
    fixesRequired.push("Include the agency or sender identity in the message.");
  }

  return {
    riskLevel,
    status: riskLevel === "High" ? "Blocked" : riskLevel === "Medium" ? "Needs Fixes" : "Approved",
    issuesFound,
    fixesRequired,
    agentNotes:
      issuesFound.length > 0
        ? "Mock compliance review found items that must be addressed before sending or delivery."
        : "Mock compliance review found no blocking issues. CASL-style sender identity and opt-out basics are satisfied.",
  };
}

export function getMockAgentResult(agent: AgentKey, context: MockContext = {}) {
  const name = leadName(context);
  const type = industry(context);
  const market = city(context);

  const map: Record<AgentKey, unknown> = {
    "lead-finder": {
      leads: [
        {
          businessName: "Harbour Glass Repair",
          industry: "Window repair",
          city: "Hamilton, ON",
          websiteUrl: null,
          email: "hello@harbourglass.example",
          phone: "+1 289-555-0170",
          source: "Mock generated lead",
          likelyNeed: "No website and strong emergency-service intent.",
        },
      ],
    },
    "lead-scoring": {
      leadScore: context.lead?.leadScore ?? 86,
      websiteQualityScore: context.lead?.currentWebsiteQualityScore ?? 28,
      googlePresenceScore: context.lead?.googlePresenceScore ?? 72,
      reasons: [
        `${name} has visible conversion friction on mobile.`,
        `The ${type} category usually benefits from quote, booking, or contact CTAs.`,
        "Local search intent suggests a well-structured service site could produce measurable lift.",
      ],
      recommendedStatus: "Scored",
      nextAction: "Generate strategy and outreach, then run compliance before sending.",
    },
    "marketing-strategy": {
      packageAngle: `A conversion-first ${type} website for ${market}`,
      painPoints: [
        "Visitors need a faster path to contact or booking.",
        "Current brand presentation does not match the quality implied by reviews.",
        "Important service information is hard to scan on mobile.",
      ],
      offerIdea: "A premium three-to-six page website with local SEO sections and secure lead capture.",
      suggestedPriceRange: "$3,900-$7,800 depending on pages, content depth, and integrations.",
      sellingPoints: ["Better mobile trust", "Clearer quote path", "Local SEO structure", "Compliance-reviewed copy"],
    },
    outreach: {
      firstEmail: {
        subject: `Quick website idea for ${name}`,
        body: `Hi, this is AgencyForge AI. I noticed ${name} could make it easier for visitors to understand services and request next steps on mobile. We build focused websites for ${type} teams and can send a short concept if useful. Reply stop or unsubscribe to opt out.`,
      },
      firstTextMessage: `Hi, this is AgencyForge AI. I had a concise website idea for ${name} that could make mobile inquiries easier. Want me to send it over? Reply stop to opt out.`,
      followUp1: `Following up once. The idea is a cleaner service path, stronger trust proof, and a simpler contact flow for ${name}. Reply stop to opt out.`,
      followUp2: `Last note from AgencyForge AI. If website improvements are not a priority right now, no problem. Reply stop to opt out.`,
      shortDm: `Quick idea for improving ${name}'s mobile inquiry flow. Want me to send it? AgencyForge AI.`,
      complianceChecklist: ["Sender identity included", "No guarantees", "Opt-out line included", "Specific but not misleading"],
    },
    "reply-classifier": {
      classification: "Interested",
      confidence: 91,
      ownerAction: "Move lead to Owner Talking and add conversation notes after the call.",
      rationale: "Mock reply contains buying intent and a request for more detail.",
    },
    "website-intake": {
      websiteGoal: `Turn ${name}'s interested prospects into booked calls or quote requests.`,
      requiredPages: ["Home", "About", "Services", "Contact", "FAQ", "Local landing page"],
      brandStyle: `Premium, clear, trust-led visual system for a ${type}.`,
      services: ["Core service", "Premium package", "Emergency or fast-response offer", "Maintenance or recurring option"],
      primaryCta: "Request a quote",
      contentPlan: ["Homepage proof and CTA", "Service detail pages", "Local SEO landing page", "FAQ and objection handling"],
      missingInfoChecklist: ["Logo files", "Service photos", "Final pricing bands", "Privacy policy preferences"],
    },
    "website-builder-1": {
      homepage: {
        heroConcept: `${name} positioned as the easiest trusted choice in ${market}.`,
        primaryCta: "Request a quote",
        sections: [
          {
            type: "hero",
            title: `A cleaner path from first visit to booked ${type} service`,
            copy: "Lead with the strongest service promise, trust proof, and a single high-confidence CTA.",
            cta: "Request a quote",
          },
          {
            type: "services",
            title: "Services built for high-intent visitors",
            copy: "Three to six service cards, each written around customer problems and next steps.",
            cta: "View services",
          },
          {
            type: "proof",
            title: "Trust signals that reduce hesitation",
            copy: "Reviews, credentials, local service area, process clarity, and secure contact handling.",
            cta: null,
          },
        ],
        serviceCards: [
          { title: "Fast service requests", copy: "A short form and CTA path for visitors ready to act." },
          { title: "Local proof", copy: "Service-area and review sections that support buyer trust." },
          { title: "Mobile-first layout", copy: "Designed around the device most prospects use first." },
        ],
      },
    },
    "website-builder-2": {
      pages: ["About", "Services", "Contact", "FAQ", "Local landing page"].map((page) => ({
        pageName: page,
        slug: `/${page.toLowerCase().replaceAll(" ", "-")}`,
        seoTitle: `${page} | ${name}`,
        sections: [
          {
            type: "content",
            title: `${page} for ${name}`,
            copy: `Structured ${page.toLowerCase()} copy for a ${type} in ${market}, with clear CTAs and local trust proof.`,
            cta: page === "Contact" ? "Request a quote" : null,
          },
        ],
      })),
    },
    qa: {
      passed: true,
      issues: [
        {
          severity: "Low",
          area: "Accessibility",
          detail: "Confirm final brand color contrast after image selection.",
          fix: "Run a contrast pass before client delivery.",
        },
      ],
      readyForCompliance: true,
      summary: "Mock QA found no blocking issues. Draft can move to compliance review.",
    },
    "security-compliance": complianceFromText(JSON.stringify(context.input ?? context.lead ?? "")),
    delivery: {
      clientPreviewMessage: `Hi, your ${name} preview is ready. It includes the planned pages, conversion path, and compliance-reviewed copy for review.`,
      websiteSummary: `A premium ${type} website draft focused on clear positioning, local trust, and contact conversion.`,
      whatWasBuilt: ["Homepage structure", "Core page drafts", "FAQ", "Contact flow", "Local SEO copy"],
      revisionRequestMessage: "Please send revision notes in one list so the website team can process them in a clean pass.",
      nextSteps: ["Client review", "Revision pass", "Final compliance check", "Launch preparation"],
    },
  };

  return map[agent];
}
