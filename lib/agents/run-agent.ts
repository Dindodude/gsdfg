import OpenAI from "openai";
import { env, isMockMode } from "@/lib/env";
import { getMockAgentResult } from "@/lib/agents/mock-responses";
import { getAgentPrompt } from "@/lib/agents/prompts";
import { validateAgentOutput } from "@/lib/agents/output-schemas";
import { leads } from "@/lib/mock-data";
import type { AgentKey, AgentResponse, Lead } from "@/lib/types";
import { auditLog, createAuditId, sanitizeInput } from "@/lib/security";
import { createClient } from "@/lib/supabase/server";
import { mapLead } from "@/lib/data/mappers";

interface RunAgentInput {
  agent: AgentKey;
  leadId?: string;
  input?: Record<string, unknown>;
}

function getMockLead(leadId?: string): Lead | undefined {
  return leadId ? leads.find((lead) => lead.id === leadId) : undefined;
}

async function getLead(leadId?: string): Promise<Lead | undefined> {
  if (!leadId) return undefined;

  const supabase = await createClient();
  if (supabase) {
    const { data, error } = await supabase.from("leads").select("*").eq("id", leadId).maybeSingle();
    if (!error && data) return mapLead(data);
  }

  return getMockLead(leadId);
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
  const mode = isMockMode() ? "mock" : "live";

  auditLog("agent_run_started", {
    auditId,
    agent: cleanInput.agent,
    leadId: cleanInput.leadId,
    mode,
  });

  if (mode === "mock") {
    const result = validateAgentOutput(cleanInput.agent, getMockAgentResult(cleanInput.agent, {
      lead,
      input: cleanInput.input,
    })) as T;

    auditLog("agent_run_completed", {
      auditId,
      agent: cleanInput.agent,
      mode,
      tokenUsage: "mock placeholder",
      cost: 0,
    });

    return {
      ok: true,
      mode,
      agent: cleanInput.agent,
      result,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        estimatedCostUsd: 0,
      },
      auditId,
    };
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
    mode,
    promptTokens,
    completionTokens,
    estimatedCostUsd,
    todo: "Replace cost placeholder with model pricing table.",
  });

  return {
    ok: true,
    mode,
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
