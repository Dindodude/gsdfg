import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auditLog, safeError } from "@/lib/security";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      ok: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function fail(error: unknown, status = 500) {
  if (error instanceof ZodError) {
    auditLog("validation_failed", {
      issues: error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Invalid request payload.",
        issues: error.issues,
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    );
  }

  auditLog("api_error", {
    error: error instanceof Error ? error.message : String(error),
  });

  return NextResponse.json(
    {
      ok: false,
      error: safeError(error),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}
