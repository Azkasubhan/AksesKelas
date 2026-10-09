import { requireRole } from "@/server/auth/guards";
import { JoinClassForm } from "./join-class-form";

export const metadata = {
  title: "Bergabung ke Kelas — AksesKelas",
};

export default async function StudentJoinClassPage() {
  const session = await requireRole("student");

  return <JoinClassForm csrfToken={session.csrfToken} />;
}
