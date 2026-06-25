import { Resend } from "resend";
import { env } from "@/lib/env";
import { auditLog } from "@/lib/security";

export async function sendEmailReadyMessage(input: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!env.resendApiKey) {
    auditLog("email_send_missing_credentials", {
      provider: "resend",
      to: input.to,
      subject: input.subject,
      required: "RESEND_API_KEY",
    });

    throw new Error("RESEND_API_KEY is required to send email.");
  }

  const resend = new Resend(env.resendApiKey);
  const response = await resend.emails.send(input);

  auditLog("email_sent", {
    provider: "resend",
    to: input.to,
    subject: input.subject,
    responseId: response.data?.id,
  });

  return { mode: "live" as const, id: response.data?.id ?? null };
}
