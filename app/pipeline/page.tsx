import { AppShell } from "@/components/layout/app-shell";
import { PipelineView } from "@/components/pipeline/pipeline-view";
import { getAppData } from "@/lib/data/queries";

export default async function PipelinePage() {
  const data = await getAppData();

  return (
    <AppShell userEmail={data.userEmail} dataSource={data.source}>
      <PipelineView leads={data.leads} />
    </AppShell>
  );
}
