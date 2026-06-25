import { Resend } from "resend";
import { ok } from "@/lib/api/responses";
import { env } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/integrations/supabase";
import { auditLog, safeError } from "@/lib/security";
import { normalizeEmail } from "@/lib/unsubscribe";

export const runtime = "nodejs";

type ResendWebhookEvent = ReturnType<Resend["webhooks"]["verify"]>;

function getHeader(request: Request, name: string) {
  return request.headers.get(name) ?? "";
}

function extractEmail(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? normalizeEmail(match[0]) : normalizeEmail(value);
}

function eventToDeliveryPatch(event: ResendWebhookEvent) {
  const timestamp = event.created_at ?? new Date().toISOString();

  switch (event.type) {
    case "email.delivered":
      return { delivery_status: "Delivered", delivered_at: timestamp, last_event_at: timestamp };
    case "email.delivery_delayed":
      return { delivery_status: "Delivery Delayed", last_event_at: timestamp };
    case "email.bounced":
      return { delivery_status: "Bounced", bounced_at: timestamp, last_event_at: timestamp };
    case "email.complained":
      return { delivery_status: "Complained", complained_at: timestamp, last_event_at: timestamp };
    case "email.failed":
      return { delivery_status: "Failed", failed_at: timestamp, last_event_at: timestamp };
    case "email.suppressed":
      return { delivery_status: "Suppressed", last_event_at: timestamp };
    case "email.opened":
      return { delivery_status: "Opened", last_event_at: timestamp };
    case "email.clicked":
      return { delivery_status: "Clicked", last_event_at: timestamp };
    case "email.sent":
      return { delivery_status: "Sent", last_event_at: timestamp };
    default:
      return { last_event_at: timestamp };
  }
}

async function verifyEvent(request: Request, payload: string) {
  if (!env.resendWebhookSecret) {
    if (process.env.NODE_ENV === "development") {
      return JSON.parse(payload) as ResendWebhookEvent;
    }

    throw new Error("RESEND_WEBHOOK_SECRET is not configured.");
  }

  const resend = new Resend(env.resendApiKey ?? "re_missing");

  return resend.webhooks.verify({
    payload,
    webhookSecret: env.resendWebhookSecret,
    headers: {
      id: getHeader(request, "svix-id"),
      timestamp: getHeader(request, "svix-timestamp"),
      signature: getHeader(request, "svix-signature"),
    },
  });
}

async function upsertSuppression(input: {
  userId: string;
  email: string;
  reason: string;
  source: string;
  metadata: unknown;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("suppression_list").upsert(
    {
      user_id: input.userId,
      contact_type: "Email",
      email: normalizeEmail(input.email),
      reason: input.reason,
      source: input.source,
      metadata: input.metadata,
    },
    { onConflict: "user_id,email" },
  );
}

async function recordInboundReply(event: ResendWebhookEvent) {
  if (event.type !== "email.received") return;

  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  const fromEmail = extractEmail(event.data.from);
  const { data: lead } = await supabase
    .from("leads")
    .select("id,user_id,business_name")
    .eq("email", fromEmail)
    .maybeSingle();

  if (!lead) {
    auditLog("resend_inbound_reply_unmatched", {
      fromEmail,
      subject: event.data.subject,
    });
    return;
  }

  await supabase.from("replies").insert({
    user_id: lead.user_id,
    lead_id: lead.id,
    channel: "Email",
    message: event.data.subject ? `Inbound email received: ${event.data.subject}` : "Inbound email received.",
    classification: "Needs more info",
    confidence: 50,
    received_at: event.created_at,
  });

  await supabase.from("leads").update({ status: "Replied" }).eq("id", lead.id);

  await supabase.from("tasks").insert({
    user_id: lead.user_id,
    lead_id: lead.id,
    title: `Review inbound email from ${lead.business_name}`,
    description: event.data.subject ?? "A lead replied by email.",
    priority: "High",
    status: "Open",
    action: "Open lead conversation",
    due_at: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const event = await verifyEvent(request, payload);
    const supabase = getSupabaseServerClient();
    const providerMessageId = "email_id" in event.data ? event.data.email_id : undefined;
    let message:
      | {
          id: string;
          user_id: string;
          lead_id: string;
        }
      | null = null;

    if (supabase && providerMessageId) {
      const { data } = await supabase
        .from("outreach_messages")
        .select("id,user_id,lead_id")
        .eq("provider_message_id", providerMessageId)
        .maybeSingle();

      message = data;

      await supabase.from("email_events").insert({
        user_id: message?.user_id ?? null,
        outreach_message_id: message?.id ?? null,
        provider_message_id: providerMessageId,
        event_type: event.type,
        payload: event,
      });

      if (message) {
        await supabase.from("outreach_messages").update(eventToDeliveryPatch(event)).eq("id", message.id);
      }
    }

    if ((event.type === "email.bounced" || event.type === "email.complained" || event.type === "email.suppressed") && message) {
      const recipient = "to" in event.data && Array.isArray(event.data.to) ? event.data.to[0] : null;

      if (recipient) {
        await upsertSuppression({
          userId: message.user_id,
          email: recipient,
          reason: event.type.replace("email.", ""),
          source: "resend_webhook",
          metadata: event,
        });
      }
    }

    await recordInboundReply(event);

    auditLog("resend_webhook_processed", {
      eventType: event.type,
      providerMessageId,
      matchedMessageId: message?.id ?? null,
    });

    return ok({
      received: true,
      eventType: event.type,
      matched: Boolean(message),
    });
  } catch (error) {
    auditLog("resend_webhook_failed", {
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        ok: false,
        error: safeError(error),
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }
}
