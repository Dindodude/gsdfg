import { z } from "zod";
import { fail, ok } from "@/lib/api/responses";
import { sendEmailReadyMessage } from "@/lib/integrations/email";
import { sendSmsReadyMessage } from "@/lib/integrations/sms";
import { auditLog, rateLimitPlaceholder } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";

const outreachSendSchema = z.object({
  messageId: z.string().min(1),
});

export const runtime = "nodejs";

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

    let providerResponse: { mode: "mock" | "live"; id?: string | null; sid?: string };

    if (message.channel === "Email") {
      providerResponse = await sendEmailReadyMessage({
        to: message.leads.email,
        from: "AgencyForge AI <hello@agencyforge.ai>",
        subject: message.subject ?? "Quick website idea",
        text: message.body,
        html: `<p>${String(message.body).replaceAll("\n", "<br />")}</p>`,
      });
    } else if (message.channel === "SMS") {
      providerResponse = await sendSmsReadyMessage({
        to: message.leads.phone,
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
        sent_at: new Date().toISOString(),
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
