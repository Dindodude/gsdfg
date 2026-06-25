export type LeadStatus =
  | "New"
  | "Scored"
  | "Outreach Ready"
  | "Outreach Sent"
  | "Replied"
  | "Interested"
  | "Owner Talking"
  | "Send to Website Team"
  | "Website In Progress"
  | "QA Review"
  | "Compliance Review"
  | "Client Preview Ready"
  | "Revision Requested"
  | "Closed Won"
  | "Closed Lost";

export type ComplianceStatus = "Pending" | "Approved" | "Blocked" | "Needs Fixes";
export type RiskLevel = "Low" | "Medium" | "High";
export type AgentStatus = "Idle" | "Running" | "Complete" | "Needs Review" | "Blocked";
export type AgentRunStatus = "queued" | "running" | "completed" | "failed" | "blocked";
export type TaskPriority = "Low" | "Medium" | "High" | "Critical";

export type AgentKey =
  | "lead-finder"
  | "lead-scoring"
  | "marketing-strategy"
  | "outreach"
  | "reply-classifier"
  | "website-intake"
  | "website-builder-1"
  | "website-builder-2"
  | "qa"
  | "security-compliance"
  | "delivery";

export type ReplyClassification =
  | "Interested"
  | "Not interested"
  | "Needs more info"
  | "Call requested"
  | "Wrong contact"
  | "Do not contact";

export interface Lead {
  id: string;
  businessName: string;
  industry: string;
  city: string;
  websiteUrl: string | null;
  email: string;
  phone: string;
  socialLinks: string[];
  currentWebsiteQualityScore: number;
  googlePresenceScore: number;
  googleReviewCount?: number | null;
  hasWebsite?: boolean;
  leadScore: number;
  status: LeadStatus;
  notes: string;
  source: string;
  lastContacted: string | null;
  nextFollowUpDate: string | null;
  complianceStatus: ComplianceStatus;
  estimatedValue: number;
  owner: string;
}

export interface AgentDefinition {
  key: AgentKey;
  name: string;
  purpose: string;
  status: AgentStatus;
  model: string;
  lastRun: string;
  successRate: number;
  avgDuration: string;
  outputLabel: string;
}

export interface AgentRun {
  id: string;
  agentKey: AgentKey;
  agentName: string;
  leadId?: string;
  leadName?: string;
  status: AgentRunStatus;
  startedAt: string;
  completedAt?: string;
  summary: string;
  riskLevel?: RiskLevel;
  costEstimate: number;
}

export interface OutreachMessage {
  id: string;
  leadId: string;
  leadName: string;
  channel: "Email" | "SMS" | "DM";
  subject?: string;
  body: string;
  status: "Draft" | "Approved" | "Sent" | "Blocked";
  complianceStatus: ComplianceStatus;
  scheduledFor: string;
  sentAt: string | null;
}

export interface Reply {
  id: string;
  leadId: string;
  leadName: string;
  channel: "Email" | "SMS" | "DM";
  message: string;
  classification: ReplyClassification;
  receivedAt: string;
  confidence: number;
}

export interface WebsiteSection {
  id: string;
  type: "hero" | "services" | "proof" | "process" | "faq" | "contact" | "content";
  title: string;
  copy: string;
  cta?: string;
}

export interface WebsitePageDraft {
  id: string;
  pageName: "Home" | "About" | "Services" | "Contact" | "FAQ" | "Local landing page";
  slug: string;
  status: "Draft" | "Ready for QA" | "QA Review" | "Client Preview Ready";
  seoTitle: string;
  sections: WebsiteSection[];
}

export interface WebsiteProject {
  id: string;
  leadId: string;
  leadName: string;
  industry: string;
  packageName: string;
  status: "Intake" | "In Progress" | "QA Review" | "Compliance Review" | "Client Preview Ready" | "Revision Requested" | "Delivered";
  progress: number;
  brandStyle: string;
  primaryGoal: string;
  pages: WebsitePageDraft[];
  previewUrl: string;
  estimatedRevenue: number;
  updatedAt: string;
}

export interface ComplianceReview {
  id: string;
  targetType: "Outreach" | "Website Content" | "Contact Form" | "Privacy" | "Delivery";
  targetName: string;
  leadId?: string;
  riskLevel: RiskLevel;
  issuesFound: string[];
  fixesRequired: string[];
  status: "Approved" | "Blocked" | "Needs Fixes";
  timestamp: string;
  agentNotes: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: "Open" | "In Progress" | "Done";
  dueAt: string;
  relatedLead?: string;
  action: string;
}

export interface ActivityLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  severity: "info" | "success" | "warning" | "critical";
}

export interface Settings {
  agencyName: string;
  ownerName: string;
  senderEmail: string;
  senderPhone: string;
  mockMode: boolean;
  complianceRegion: "Canada" | "United States" | "Mixed";
}

export interface AgentResponse<T = unknown> {
  ok: boolean;
  mode: "live";
  agent: AgentKey;
  result: T;
  usage: {
    promptTokens: number;
    completionTokens: number;
    estimatedCostUsd: number;
  };
  auditId: string;
}
