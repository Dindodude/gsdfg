const MAX_STRING_LENGTH = 6000;

export function sanitizeText(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .slice(0, MAX_STRING_LENGTH)
    .trim();
}

export function sanitizeInput<T>(input: T): T {
  if (typeof input === "string") {
    return sanitizeText(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeInput(item)) as T;
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, sanitizeInput(value)]),
    ) as T;
  }

  return input;
}

export function createAuditId(prefix = "audit") {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function auditLog(event: string, details: Record<string, unknown>) {
  const record = {
    event,
    details,
    timestamp: new Date().toISOString(),
  };

  console.info("[audit]", JSON.stringify(record));
  return record;
}

export function rateLimitPlaceholder(identifier: string) {
  auditLog("rate_limit_checked", {
    identifier,
    strategy: "placeholder",
    allowed: true,
    todo: "Replace with Upstash, Supabase table counters, or Vercel WAF rules.",
  });

  return { allowed: true, remaining: 100 };
}

export function safeError(error: unknown) {
  if (error instanceof Error) {
    return process.env.NODE_ENV === "development" ? error.message : "Request failed.";
  }

  return "Request failed.";
}
