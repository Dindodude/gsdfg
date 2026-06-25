import { AgentsView } from "@/components/agents/agents-view";
import { AppShell } from "@/components/layout/app-shell";
import { getAppData } from "@/lib/data/queries";

export default async function AgentsPage() {
  const data = await getAppData();

  return (
    <AppShell userEmail={data.userEmail} dataSource={data.source}>
      <AgentsView agentDefinitions={data.agents} agentRuns={data.agentRuns} source={data.source} />
    </AppShell>
  );
}
