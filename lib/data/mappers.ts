import type {
  AgentDefinition,
  AgentRun,
  ComplianceReview,
  Lead,
  OutreachMessage,
  Reply,
  Settings,
  Task,
  WebsitePageDraft,
  WebsiteProject,
} from "@/lib/types";

type Row = Record<string, unknown>;

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function sections(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function mapLead(row: Row): Lead {
  return {
    id: String(row.id),
    businessName: String(row.business_name ?? ""),
    industry: String(row.industry ?? ""),
    city: String(row.city ?? ""),
    websiteUrl: row.website_url ? String(row.website_url) : null,
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    socialLinks: stringArray(row.social_links),
    currentWebsiteQualityScore: Number(row.current_website_quality_score ?? 0),
    googlePresenceScore: Number(row.google_presence_score ?? 0),
    googleReviewCount: row.google_review_count === null || row.google_review_count === undefined ? null : Number(row.google_review_count),
    hasWebsite: Boolean(row.has_website ?? row.website_url),
    leadScore: Number(row.lead_score ?? 0),
    status: String(row.status ?? "New") as Lead["status"],
    notes: String(row.notes ?? ""),
    source: String(row.source ?? "Manual import"),
    lastContacted: row.last_contacted ? String(row.last_contacted) : null,
    nextFollowUpDate: row.next_follow_up_date ? String(row.next_follow_up_date) : null,
    complianceStatus: String(row.compliance_status ?? "Pending") as Lead["complianceStatus"],
    estimatedValue: Number(row.estimated_value ?? 0),
    owner: String(row.owner_name ?? "Unknown"),
  };
}

export function mapAgent(row: Row): AgentDefinition {
  return {
    key: String(row.key) as AgentDefinition["key"],
    name: String(row.name ?? ""),
    purpose: String(row.purpose ?? ""),
    status: String(row.status ?? "Idle") as AgentDefinition["status"],
    model: String(row.model ?? "gpt-4.1-mini"),
    lastRun: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    successRate: Number(row.success_rate ?? 90),
    avgDuration: String(row.avg_duration ?? "1m 00s"),
    outputLabel: String(row.output_label ?? "JSON outputs"),
  };
}

export function mapAgentRun(row: Row): AgentRun {
  return {
    id: String(row.id),
    agentKey: String(row.agent_key ?? "lead-scoring") as AgentRun["agentKey"],
    agentName: String(row.agent_name ?? row.agent_key ?? "Agent"),
    leadId: row.lead_id ? String(row.lead_id) : undefined,
    leadName: row.lead_name ? String(row.lead_name) : undefined,
    status: String(row.status ?? "queued") as AgentRun["status"],
    startedAt: String(row.started_at ?? new Date().toISOString()),
    completedAt: row.completed_at ? String(row.completed_at) : undefined,
    summary: String(row.summary ?? "Agent run saved in Supabase."),
    riskLevel: row.risk_level ? (String(row.risk_level) as AgentRun["riskLevel"]) : undefined,
    costEstimate: Number(row.cost_estimate ?? 0),
  };
}

export function mapOutreachMessage(row: Row): OutreachMessage {
  return {
    id: String(row.id),
    leadId: String(row.lead_id ?? ""),
    leadName: String(row.lead_name ?? "Lead"),
    channel: String(row.channel ?? "Email") as OutreachMessage["channel"],
    subject: row.subject ? String(row.subject) : undefined,
    body: String(row.body ?? ""),
    status: String(row.status ?? "Draft") as OutreachMessage["status"],
    complianceStatus: String(row.compliance_status ?? "Pending") as OutreachMessage["complianceStatus"],
    scheduledFor: String(row.scheduled_for ?? row.created_at ?? new Date().toISOString()),
    sentAt: row.sent_at ? String(row.sent_at) : null,
  };
}

export function mapReply(row: Row): Reply {
  return {
    id: String(row.id),
    leadId: String(row.lead_id ?? ""),
    leadName: String(row.lead_name ?? "Lead"),
    channel: String(row.channel ?? "Email") as Reply["channel"],
    message: String(row.message ?? ""),
    classification: String(row.classification ?? "Needs more info") as Reply["classification"],
    receivedAt: String(row.received_at ?? new Date().toISOString()),
    confidence: Number(row.confidence ?? 0),
  };
}

export function mapComplianceReview(row: Row): ComplianceReview {
  return {
    id: String(row.id),
    targetType: String(row.target_type ?? "Outreach") as ComplianceReview["targetType"],
    targetName: String(row.target_name ?? ""),
    leadId: row.lead_id ? String(row.lead_id) : undefined,
    riskLevel: String(row.risk_level ?? "Low") as ComplianceReview["riskLevel"],
    issuesFound: stringArray(row.issues_found),
    fixesRequired: stringArray(row.fixes_required),
    status: String(row.status ?? "Needs Fixes") as ComplianceReview["status"],
    timestamp: String(row.created_at ?? new Date().toISOString()),
    agentNotes: String(row.agent_notes ?? ""),
  };
}

export function mapTask(row: Row): Task {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    priority: String(row.priority ?? "Medium") as Task["priority"],
    status: String(row.status ?? "Open") as Task["status"],
    dueAt: String(row.due_at ?? row.created_at ?? new Date().toISOString()),
    relatedLead: row.related_lead ? String(row.related_lead) : undefined,
    action: String(row.action ?? "Open"),
  };
}

export function mapWebsiteProject(row: Row, pages: WebsitePageDraft[] = []): WebsiteProject {
  return {
    id: String(row.id),
    leadId: String(row.lead_id ?? ""),
    leadName: String(row.lead_name ?? "Lead"),
    industry: String(row.industry ?? "Business"),
    packageName: String(row.package_name ?? "Website Package"),
    status: String(row.status ?? "Intake") as WebsiteProject["status"],
    progress: Number(row.progress ?? 0),
    brandStyle: String(row.brand_style ?? ""),
    primaryGoal: String(row.primary_goal ?? ""),
    pages,
    previewUrl: String(row.preview_url ?? ""),
    estimatedRevenue: Number(row.estimated_revenue ?? 0),
    updatedAt: String(row.updated_at ?? new Date().toISOString()),
  };
}

export function mapWebsitePage(row: Row): WebsitePageDraft {
  return {
    id: String(row.id),
    pageName: String(row.page_name ?? "Home") as WebsitePageDraft["pageName"],
    slug: String(row.slug ?? "/"),
    status: String(row.status ?? "Draft") as WebsitePageDraft["status"],
    seoTitle: String(row.seo_title ?? ""),
    sections: sections(row.sections) as WebsitePageDraft["sections"],
  };
}

export function mapSettings(row: Row | null): Settings {
  return {
    agencyName: String(row?.agency_name ?? "AgencyForge AI"),
    ownerName: String(row?.owner_name ?? "Owner"),
    senderEmail: String(row?.sender_email ?? "hello@agencyforge.ai"),
    senderPhone: String(row?.sender_phone ?? "+1 647-555-0191"),
    mockMode: Boolean(row?.mock_mode ?? true),
    complianceRegion: String(row?.compliance_region ?? "Canada") as Settings["complianceRegion"],
  };
}
