import { requireRole } from "@/server/auth/guards";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CreateClassForm } from "./create-class-form";

export const metadata = {
  title: "Buat Kelas — AksesKelas",
};

export default async function TeacherCreateClassPage() {
  const session = await requireRole("teacher");

  return (
    <DashboardLayout user={session.user} csrfToken={session.csrfToken}>
      <CreateClassForm csrfToken={session.csrfToken} />
    </DashboardLayout>
  );
}
