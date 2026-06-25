import { AppShell } from "@/components/layout/app-shell";
import { SettingsView } from "@/components/settings/settings-view";
import { getAppData } from "@/lib/data/queries";

export default async function SettingsPage() {
  const data = await getAppData();

  return (
    <AppShell userEmail={data.userEmail} dataSource={data.source}>
      <SettingsView settings={data.settings} source={data.source} />
    </AppShell>
  );
}
