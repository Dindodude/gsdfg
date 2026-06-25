import twilio from "twilio";
import { env } from "@/lib/env";
import { auditLog } from "@/lib/security";

export async function sendSmsReadyMessage(input: { to: string; body: string }) {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioFromNumber) {
    auditLog("sms_send_missing_credentials", {
      provider: "twilio",
      to: input.to,
      required: "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER",
    });

    throw new Error("Twilio credentials are required to send SMS.");
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
