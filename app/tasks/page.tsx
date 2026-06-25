import { AppShell } from "@/components/layout/app-shell";
import { TasksView } from "@/components/tasks/tasks-view";
import { getAppData } from "@/lib/data/queries";

export default async function TasksPage() {
  const data = await getAppData();

  return (
    <AppShell userEmail={data.userEmail} dataSource={data.source}>
      <TasksView tasks={data.tasks} complianceReviews={data.complianceReviews} />
    </AppShell>
  );
}
