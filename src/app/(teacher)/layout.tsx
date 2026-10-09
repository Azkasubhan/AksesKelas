import { requireRole } from "@/server/auth/guards";
import { CsrfProvider } from "@/lib/api-client";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("teacher");

  return <CsrfProvider token={session.csrfToken}>{children}</CsrfProvider>;
}
