import { requireRole } from "@/server/auth/guards";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { JoinClassForm } from "./join-class-form";

export const metadata = {
  title: "Bergabung ke Kelas — AksesKelas",
};

export default async function StudentJoinClassPage() {
  const session = await requireRole("student");

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <JoinClassForm csrfToken={session.csrfToken} />
    </DashboardLayout>
  );
}
