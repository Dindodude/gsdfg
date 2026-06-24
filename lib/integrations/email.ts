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
    auditLog("email_mock_send", {
      provider: "resend",
      to: input.to,
      subject: input.subject,
      todo: "Set RESEND_API_KEY or wire SendGrid with SENDGRID_API_KEY.",
    });

    return { mode: "mock" as const, id: `mock-email-${crypto.randomUUID()}` };
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
