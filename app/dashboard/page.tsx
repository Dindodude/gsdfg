import { AppShell } from "@/components/layout/app-shell";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getAppData } from "@/lib/data/queries";

export default async function DashboardPage() {
  const data = await getAppData();

  return (
    <AppShell userEmail={data.userEmail} dataSource={data.source}>
      <DashboardView
        source={data.source}
        leads={data.leads}
        websiteProjects={data.websiteProjects}
        outreachMessages={data.outreachMessages}
        agentRuns={data.agentRuns}
        complianceReviews={data.complianceReviews}
        tasks={data.tasks}
        activityLogs={data.activityLogs}
      />
    </AppShell>
  );
}
