import { ok } from "@/lib/api/responses";
import { env, isMockMode } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  return ok({
    configured: Boolean(env.openaiApiKey),
    mode: isMockMode() ? "mock" : "live",
    model: env.openaiModel,
  });
}
