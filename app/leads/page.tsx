import { AppShell } from "@/components/layout/app-shell";
import { LeadsView } from "@/components/leads/leads-view";
import { getAppData } from "@/lib/data/queries";

export default async function LeadsPage() {
  const data = await getAppData();

  return (
    <AppShell userEmail={data.userEmail} dataSource={data.source}>
      <LeadsView leads={data.leads} source={data.source} />
    </AppShell>
  );
}
