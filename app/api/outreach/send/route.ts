import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { env } from "@/lib/env";
import { sendEmailReadyMessage } from "@/lib/integrations/email";
import { sendSmsReadyMessage } from "@/lib/integrations/sms";
import { auditLog, rateLimitPlaceholder } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { buildUnsubscribeUrl, normalizeEmail } from "@/lib/unsubscribe";

const outreachSendSchema = z.object({
  messageId: z.string().min(1),
});

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function appendUnsubscribeText(body: string, unsubscribeUrl: string) {
  if (body.toLowerCase().includes("unsubscribe")) {
    return body;
  }

  return `${body.trim()}\n\nIf this is not useful, you can unsubscribe here: ${unsubscribeUrl}`;
}

function buildEmailHtml(body: string, unsubscribeUrl: string) {
  return `<p>${escapeHtml(body).replaceAll("\n", "<br />")}</p><p style="font-size:12px;color:#71717a">If this is not useful, <a href="${escapeHtml(
    unsubscribeUrl,
  )}">unsubscribe here</a>.</p>`;
}

export async function POST(request: Request) {
  try {
    rateLimitPlaceholder("outreach-send");
    const payload = outreachSendSchema.parse(await request.json());
    const supabase = await createClient();

    if (!supabase) {
      return ok({
        sent: false,
        mode: "mock",
        reason: "Supabase is not configured, so no persisted message can be sent.",
      });
    }

    const { data: message, error } = await supabase
      .from("outreach_messages")
      .select("*, leads(email, phone, business_name)")
      .eq("id", payload.messageId)
      .single();

    if (error) throw error;

    const lead = Array.isArray(message.leads) ? message.leads[0] : message.leads;

    if (message.compliance_status !== "Approved" || message.status === "Blocked") {
      auditLog("outreach_send_blocked", {
        messageId: payload.messageId,
        complianceStatus: message.compliance_status,
        status: message.status,
      });

      return ok({
        sent: false,
        blocked: true,
        reason: "Message is not compliance-approved.",
      });
    }

    if (message.channel === "Email" && lead?.email) {
      const normalizedEmail = normalizeEmail(lead.email);
      const { data: suppression, error: suppressionError } = await supabase
        .from("suppression_list")
        .select("id, reason, source")
        .eq("user_id", message.user_id)
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (suppressionError) throw suppressionError;

      if (suppression) {
        auditLog("outreach_send_blocked_suppressed_email", {
          messageId: payload.messageId,
          email: normalizedEmail,
          reason: suppression.reason,
          source: suppression.source,
        });

        return ok({
          sent: false,
          blocked: true,
          reason: "Recipient is on the email suppression list.",
        });
      }
    }

    if (message.channel === "SMS" && lead?.phone) {
      const { data: suppression, error: suppressionError } = await supabase
        .from("suppression_list")
        .select("id, reason, source")
        .eq("user_id", message.user_id)
        .eq("phone", lead.phone)
        .maybeSingle();

      if (suppressionError) throw suppressionError;

      if (suppression) {
        auditLog("outreach_send_blocked_suppressed_phone", {
          messageId: payload.messageId,
          phone: lead.phone,
          reason: suppression.reason,
          source: suppression.source,
        });

        return ok({
          sent: false,
          blocked: true,
          reason: "Recipient is on the SMS suppression list.",
        });
      }
    }

    let providerResponse: { mode: "mock" | "live"; id?: string | null; sid?: string };

    if (message.channel === "Email") {
      if (!lead?.email) {
        return ok({
          sent: false,
          blocked: true,
          reason: "Lead is missing an email address.",
        });
      }

      if (env.resendApiKey && !env.outreachFromEmail) {
        return ok({
          sent: false,
          blocked: true,
          reason: "OUTREACH_FROM_EMAIL is required before live email can be sent.",
        });
      }

      const unsubscribeUrl = buildUnsubscribeUrl({
        email: lead.email,
        userId: message.user_id,
      });
      const text = appendUnsubscribeText(message.body, unsubscribeUrl);

      providerResponse = await sendEmailReadyMessage({
        to: lead.email,
        from: env.outreachFromEmail
          ? `${env.outreachFromName} <${env.outreachFromEmail}>`
          : "AgencyForge AI <mock@agencyforge.local>",
        subject: message.subject ?? "Quick website idea",
        text,
        html: buildEmailHtml(text, unsubscribeUrl),
      });
    } else if (message.channel === "SMS") {
      if (!lead?.phone) {
        return ok({
          sent: false,
          blocked: true,
          reason: "Lead is missing a phone number.",
        });
      }

      providerResponse = await sendSmsReadyMessage({
        to: lead.phone,
        body: message.body,
      });
    } else {
      providerResponse = {
        mode: "mock",
        id: `mock-dm-${crypto.randomUUID()}`,
      };
    }

    await supabase
      .from("outreach_messages")
      .update({
        status: "Sent",
        delivery_status: "Sent",
        sent_at: new Date().toISOString(),
        last_event_at: new Date().toISOString(),
        provider_message_id: providerResponse.id ?? providerResponse.sid ?? null,
      })
      .eq("id", payload.messageId);

    await supabase.from("leads").update({ status: "Outreach Sent", last_contacted: new Date().toISOString() }).eq("id", message.lead_id);

    auditLog("outreach_sent", {
      messageId: payload.messageId,
      channel: message.channel,
      providerMode: providerResponse.mode,
    });

    return ok({
      sent: true,
      provider: providerResponse,
    });
  } catch (error) {
    return fail(error);
  }
}
