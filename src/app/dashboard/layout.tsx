import DashboardShell from "@/components/dashboard/DashboardShell";
import DashboardPageClient from "@/views/dashboard/DashboardPageClient";
import { requireDashboardUser } from "@/lib/dashboard-auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialUser = await requireDashboardUser();

  return (
    <DashboardShell initialUser={initialUser}>
      <DashboardPageClient initialUser={initialUser} />
      {children}
    </DashboardShell>
  );
}
