import { AppShell } from "@/components/layout/app-shell";
import { WebsitesView } from "@/components/websites/websites-view";
import { getAppData } from "@/lib/data/queries";

export default async function WebsitesPage() {
  const data = await getAppData();

  return (
    <AppShell userEmail={data.userEmail} dataSource={data.source}>
      <WebsitesView websiteProjects={data.websiteProjects} />
    </AppShell>
  );
}
