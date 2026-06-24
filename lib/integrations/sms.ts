import twilio from "twilio";
import { env } from "@/lib/env";
import { auditLog } from "@/lib/security";

export async function sendSmsReadyMessage(input: { to: string; body: string }) {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioFromNumber) {
    auditLog("sms_mock_send", {
      provider: "twilio",
      to: input.to,
      todo: "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.",
    });

    return { mode: "mock" as const, sid: `mock-sms-${crypto.randomUUID()}` };
  }

  const client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  const message = await client.messages.create({
    to: input.to,
    from: env.twilioFromNumber,
    body: input.body,
  });

  auditLog("sms_sent", {
    provider: "twilio",
    to: input.to,
    sid: message.sid,
  });

  return { mode: "live" as const, sid: message.sid };
}
