import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

type UnsubscribePayload = {
  email: string;
  userId: string;
};

function getSecret() {
  return env.unsubscribeSecret ?? env.supabaseServiceRoleKey ?? "agencyforge-local-unsubscribe-secret";
}

function signPayload(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createUnsubscribeToken(input: UnsubscribePayload) {
  const payload = Buffer.from(
    JSON.stringify({
      email: normalizeEmail(input.email),
      userId: input.userId,
    }),
  ).toString("base64url");
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  const [payload, signature] = token.split(".");

  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as UnsubscribePayload;

    if (!parsed.email || !parsed.userId) return null;

    return {
      email: normalizeEmail(parsed.email),
      userId: parsed.userId,
    };
  } catch {
    return null;
  }
}

export function buildUnsubscribeUrl(input: UnsubscribePayload) {
  const token = createUnsubscribeToken(input);
  const url = new URL("/unsubscribe", env.appUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("email", normalizeEmail(input.email));

  return url.toString();
}
