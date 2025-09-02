import DashboardLayout from "../dashboard/layout";

export default function SubmissionReviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
