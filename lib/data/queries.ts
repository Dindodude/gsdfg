import { createClient } from "@/lib/supabase/server";
import {
  activityLogs as mockActivityLogs,
  agentDefinitions as mockAgents,
  agentRuns as mockAgentRuns,
  complianceReviews as mockComplianceReviews,
  leads as mockLeads,
  outreachMessages as mockOutreachMessages,
  replies as mockReplies,
  settings as mockSettings,
  tasks as mockTasks,
  websiteProjects as mockWebsiteProjects,
} from "@/lib/mock-data";
import {
  mapAgent,
  mapAgentRun,
  mapComplianceReview,
  mapLead,
  mapOutreachMessage,
  mapReply,
  mapSettings,
  mapTask,
  mapWebsitePage,
  mapWebsiteProject,
} from "@/lib/data/mappers";
import type { AgentDefinition, AgentRun, ComplianceReview, Lead, OutreachMessage, Reply, Settings, Task, WebsiteProject } from "@/lib/types";

export interface AppData {
  source: "supabase" | "mock";
  userEmail: string | null;
  leads: Lead[];
  agents: AgentDefinition[];
  agentRuns: AgentRun[];
  outreachMessages: OutreachMessage[];
  replies: Reply[];
  websiteProjects: WebsiteProject[];
  complianceReviews: ComplianceReview[];
  tasks: Task[];
  activityLogs: typeof mockActivityLogs;
  settings: Settings;
}

async function getSupabaseUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function ensureUserProfile() {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return null;

  await supabase.from("users").upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name ?? user.email ?? "Owner",
    agency_name: "AgencyForge AI",
    role: "owner",
    updated_at: new Date().toISOString(),
  });

  return user;
}

export async function getLeads(): Promise<{ source: "supabase" | "mock"; data: Lead[]; userEmail: string | null }> {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return { source: "mock", data: mockLeads, userEmail: null };

  await ensureUserProfile();
  const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (error) {
    console.warn("[supabase] leads fallback", error.message);
    return { source: "mock", data: mockLeads, userEmail: user.email ?? null };
  }

  return { source: "supabase", data: (data ?? []).map(mapLead), userEmail: user.email ?? null };
}

export async function getTasks(): Promise<{ source: "supabase" | "mock"; data: Task[] }> {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return { source: "mock", data: mockTasks };

  const { data, error } = await supabase.from("tasks").select("*, leads(business_name)").order("due_at", { ascending: true });
  if (error) {
    console.warn("[supabase] tasks fallback", error.message);
    return { source: "mock", data: mockTasks };
  }

  return {
    source: "supabase",
    data: (data ?? []).map((row) =>
      mapTask({
        ...row,
        related_lead: row.leads?.business_name,
      }),
    ),
  };
}

export async function getComplianceReviews(): Promise<{ source: "supabase" | "mock"; data: ComplianceReview[] }> {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return { source: "mock", data: mockComplianceReviews };

  const { data, error } = await supabase.from("compliance_reviews").select("*").order("created_at", { ascending: false });
  if (error) {
    console.warn("[supabase] compliance fallback", error.message);
    return { source: "mock", data: mockComplianceReviews };
  }

  return { source: "supabase", data: (data ?? []).map(mapComplianceReview) };
}

export async function getAgents(): Promise<{ source: "supabase" | "mock"; data: AgentDefinition[] }> {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return { source: "mock", data: mockAgents };

  const { data, error } = await supabase.from("agents").select("*").order("created_at", { ascending: true });
  if (error) {
    console.warn("[supabase] agents fallback", error.message);
    return { source: "mock", data: mockAgents };
  }

  return { source: "supabase", data: (data ?? []).map(mapAgent) };
}

export async function getAgentRuns(): Promise<{ source: "supabase" | "mock"; data: AgentRun[] }> {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return { source: "mock", data: mockAgentRuns };

  const { data, error } = await supabase
    .from("agent_runs")
    .select("*, agents(key,name), leads(business_name)")
    .order("started_at", { ascending: false })
    .limit(25);

  if (error) {
    console.warn("[supabase] agent runs fallback", error.message);
    return { source: "mock", data: mockAgentRuns };
  }

  return {
    source: "supabase",
    data: (data ?? []).map((row) =>
      mapAgentRun({
        ...row,
        agent_key: row.agents?.key,
        agent_name: row.agents?.name,
        lead_name: row.leads?.business_name,
        summary: typeof row.output === "object" && row.output ? JSON.stringify(row.output).slice(0, 160) : "Agent run saved in Supabase.",
      }),
    ),
  };
}

export async function getOutreachMessages(): Promise<{ source: "supabase" | "mock"; data: OutreachMessage[] }> {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return { source: "mock", data: mockOutreachMessages };

  const { data, error } = await supabase.from("outreach_messages").select("*, leads(business_name)").order("created_at", { ascending: false });
  if (error) {
    console.warn("[supabase] outreach fallback", error.message);
    return { source: "mock", data: mockOutreachMessages };
  }

  return { source: "supabase", data: (data ?? []).map((row) => mapOutreachMessage({ ...row, lead_name: row.leads?.business_name })) };
}

export async function getReplies(): Promise<{ source: "supabase" | "mock"; data: Reply[] }> {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return { source: "mock", data: mockReplies };

  const { data, error } = await supabase.from("replies").select("*, leads(business_name)").order("received_at", { ascending: false });
  if (error) {
    console.warn("[supabase] replies fallback", error.message);
    return { source: "mock", data: mockReplies };
  }

  return { source: "supabase", data: (data ?? []).map((row) => mapReply({ ...row, lead_name: row.leads?.business_name })) };
}

export async function getWebsiteProjects(): Promise<{ source: "supabase" | "mock"; data: WebsiteProject[] }> {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return { source: "mock", data: mockWebsiteProjects };

  const { data: projects, error: projectsError } = await supabase
    .from("website_projects")
    .select("*, leads(business_name,industry)")
    .order("updated_at", { ascending: false });

  if (projectsError) {
    console.warn("[supabase] website projects fallback", projectsError.message);
    return { source: "mock", data: mockWebsiteProjects };
  }

  const { data: pages, error: pagesError } = await supabase.from("website_pages").select("*").order("created_at", { ascending: true });
  if (pagesError) {
    console.warn("[supabase] website pages fallback", pagesError.message);
  }

  const mappedPages = (pages ?? []).map((page) => ({
    projectId: String(page.website_project_id),
    page: mapWebsitePage(page),
  }));

  return {
    source: "supabase",
    data: (projects ?? []).map((project) =>
      mapWebsiteProject(
        {
          ...project,
          lead_name: project.leads?.business_name,
          industry: project.leads?.industry,
        },
        mappedPages.filter((item) => item.projectId === String(project.id)).map((item) => item.page),
      ),
    ),
  };
}

export async function getSettings(): Promise<{ source: "supabase" | "mock"; data: Settings }> {
  const { supabase, user } = await getSupabaseUser();
  if (!supabase || !user) return { source: "mock", data: mockSettings };

  const { data, error } = await supabase.from("settings").select("*").maybeSingle();
  if (error) {
    console.warn("[supabase] settings fallback", error.message);
    return { source: "mock", data: mockSettings };
  }

  return { source: "supabase", data: mapSettings(data) };
}

export async function getAppData(): Promise<AppData> {
  const [leadsResult, agentsResult, agentRunsResult, outreachResult, repliesResult, websitesResult, complianceResult, tasksResult, settingsResult] =
    await Promise.all([
      getLeads(),
      getAgents(),
      getAgentRuns(),
      getOutreachMessages(),
      getReplies(),
      getWebsiteProjects(),
      getComplianceReviews(),
      getTasks(),
      getSettings(),
    ]);

  return {
    source: leadsResult.source,
    userEmail: leadsResult.userEmail,
    leads: leadsResult.data,
    agents: agentsResult.data,
    agentRuns: agentRunsResult.data,
    outreachMessages: outreachResult.data,
    replies: repliesResult.data,
    websiteProjects: websitesResult.data,
    complianceReviews: complianceResult.data,
    tasks: tasksResult.data,
    activityLogs: mockActivityLogs,
    settings: settingsResult.data,
  };
}
