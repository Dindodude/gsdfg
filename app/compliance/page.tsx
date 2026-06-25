import { ComplianceView } from "@/components/compliance/compliance-view";
import { AppShell } from "@/components/layout/app-shell";
import { getAppData } from "@/lib/data/queries";

export default async function CompliancePage() {
  const data = await getAppData();

  return (
    <AppShell userEmail={data.userEmail} dataSource={data.source}>
      <ComplianceView complianceReviews={data.complianceReviews} />
    </AppShell>
  );
}
