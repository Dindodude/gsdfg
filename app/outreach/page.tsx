import { AppShell } from "@/components/layout/app-shell";
import { OutreachView } from "@/components/outreach/outreach-view";
import { getAppData } from "@/lib/data/queries";

export default async function OutreachPage() {
  const data = await getAppData();

  return (
    <AppShell userEmail={data.userEmail} dataSource={data.source}>
      <OutreachView leads={data.leads} outreachMessages={data.outreachMessages} replies={data.replies} />
    </AppShell>
  );
}
