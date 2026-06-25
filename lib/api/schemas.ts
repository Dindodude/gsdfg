import { z } from "zod";

export const agentKeySchema = z.enum([
  "lead-finder",
  "lead-scoring",
  "marketing-strategy",
  "outreach",
  "reply-classifier",
  "website-intake",
  "website-builder-1",
  "website-builder-2",
  "qa",
  "security-compliance",
  "delivery",
]);

export const leadStatusSchema = z.enum([
  "New",
  "Scored",
  "Outreach Ready",
  "Outreach Sent",
  "Replied",
  "Interested",
  "Owner Talking",
  "Send to Website Team",
  "Website In Progress",
  "QA Review",
  "Compliance Review",
  "Client Preview Ready",
  "Revision Requested",
  "Closed Won",
  "Closed Lost",
]);

export const leadCreateSchema = z.object({
  businessName: z.string().min(2),
  industry: z.string().min(2),
  city: z.string().min(2),
  websiteUrl: z.string().url().nullable().optional(),
  email: z.string().email(),
  phone: z.string().min(7),
  socialLinks: z.array(z.string()).default([]),
  source: z.string().default("Manual import"),
  notes: z.string().default(""),
});

export const runAgentSchema = z.object({
  agent: agentKeySchema,
  leadId: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
});

export const leadScoreSchema = z.object({
  leadId: z.string().optional(),
  lead: leadCreateSchema.partial().optional(),
});

export const leadFindSchema = z.object({
  industry: z.string().min(2).default("barber shop"),
  city: z.string().min(2).default("Hamilton, ON"),
  limit: z.number().int().min(1).max(20).default(10),
});

export const outreachGenerateSchema = z.object({
  leadId: z.string(),
  strategy: z.record(z.string(), z.unknown()).optional(),
});

export const replyClassifySchema = z.object({
  leadId: z.string().optional(),
  replyText: z.string().min(2),
  channel: z.enum(["Email", "SMS", "DM"]).default("Email"),
});

export const websiteGenerateSchema = z.object({
  leadId: z.string(),
  ownerNotes: z.string().default(""),
  requirements: z.record(z.string(), z.unknown()).optional(),
});

export const complianceReviewSchema = z.object({
  leadId: z.string().optional(),
  targetType: z.enum(["Outreach", "Website Content", "Contact Form", "Privacy", "Delivery"]),
  targetName: z.string().min(2),
  content: z.string().min(2),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const qaReviewSchema = z.object({
  websiteProjectId: z.string().optional(),
  leadId: z.string().optional(),
  content: z.string().min(2),
});

export const deliveryPrepareSchema = z.object({
  websiteProjectId: z.string().optional(),
  leadId: z.string().optional(),
  complianceApproved: z.boolean().default(false),
  previewUrl: z.string().optional(),
});
