import { requireRole } from "@/server/auth/guards";
import { CsrfProvider } from "@/lib/api-client";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("student");

  return <CsrfProvider token={session.csrfToken}>{children}</CsrfProvider>;
}
