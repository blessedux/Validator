import DashboardLayout from "../dashboard/layout";

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
