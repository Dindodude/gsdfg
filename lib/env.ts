export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  outreachFromEmail: process.env.OUTREACH_FROM_EMAIL,
  outreachFromName: process.env.OUTREACH_FROM_NAME ?? "AgencyForge AI",
  resendApiKey: process.env.RESEND_API_KEY,
  resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET,
  unsubscribeSecret: process.env.UNSUBSCRIBE_SECRET,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
};

export function isOpenAIConfigured() {
  return Boolean(env.openaiApiKey);
}
