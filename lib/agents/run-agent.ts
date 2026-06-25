import OpenAI from "openai";
import { env } from "@/lib/env";
import { getAgentPrompt } from "@/lib/agents/prompts";
import { validateAgentOutput } from "@/lib/agents/output-schemas";
import type { AgentKey, AgentResponse, Lead } from "@/lib/types";
import { auditLog, createAuditId, sanitizeInput } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { mapLead } from "@/lib/data/mappers";

interface RunAgentInput {
  agent: AgentKey;
  leadId?: string;
  input?: Record<string, unknown>;
}

async function getLead(leadId?: string): Promise<Lead | undefined> {
  if (!leadId) return undefined;

  const supabase = await createClient();
  if (supabase) {
    const { data, error } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
    if (!error && data) return mapLead(data);
  }

  return undefined;
}

function parseJson(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Agent returned non-JSON content.");
  }
}

async function withRetry<T>(operation: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;

  for (let index = 0; index <= attempts; index += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (index < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (index + 1)));
      }
    }
  }

  throw lastError;
}

export async function runAgent<T = unknown>(input: RunAgentInput): Promise<AgentResponse<T>> {
  const cleanInput = sanitizeInput(input);
  const auditId = createAuditId("agent");
  const prompt = getAgentPrompt(cleanInput.agent);
  const lead = await getLead(cleanInput.leadId);

  auditLog("agent_run_started", {
    auditId,
    agent: cleanInput.agent,
    leadId: cleanInput.leadId,
    mode: "live",
  });

  if (!env.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is required to run agents.");
  }

  const client = new OpenAI({ apiKey: env.openaiApiKey });
  const payload = {
    lead,
    input: cleanInput.input,
    requiredOutputSchema: prompt.outputSchema,
  };

  const completion = await withRetry(() =>
    client.chat.completions.create({
      model: env.openaiModel,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${prompt.system}
Return only valid JSON. Do not include markdown, prose, comments, or extra keys.
The JSON must match this required shape: ${JSON.stringify(prompt.outputSchema)}`,
        },
        {
          role: "user",
          content: JSON.stringify(payload),
        },
      ],
    }),
  );

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Agent returned an empty response.");
  }

  const result = validateAgentOutput(cleanInput.agent, parseJson(content)) as T;
  const promptTokens = completion.usage?.prompt_tokens ?? 0;
  const completionTokens = completion.usage?.completion_tokens ?? 0;
  const estimatedCostUsd = 0;

  auditLog("agent_run_completed", {
    auditId,
    agent: cleanInput.agent,
    mode: "live",
    promptTokens,
    completionTokens,
    estimatedCostUsd,
    todo: "Replace cost placeholder with model pricing table.",
  });

  return {
    ok: true,
    mode: "live",
    agent: cleanInput.agent,
    result,
    usage: {
      promptTokens,
      completionTokens,
      estimatedCostUsd,
    },
    auditId,
  };
}
