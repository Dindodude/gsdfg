import { ok } from "@/lib/api/responses";
import { env, isOpenAIConfigured } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    configured: isOpenAIConfigured(),
    mode: isOpenAIConfigured() ? "live" : "not_configured",
    model: env.openaiModel,
  });
}
