import "server-only";
import { redirect } from "next/navigation";
import { homeFor } from "@/shared/paths";
import { getCurrentSession, type CurrentSession, type Role } from "./session";

/**
 * Guard untuk Server Component. Tanpa session -> /login; role salah -> beranda
 * role sendiri. Pemeriksaan otorisasi sesungguhnya tetap ada di service.
 */
export async function requireRole(role: Role): Promise<CurrentSession> {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== role) redirect(homeFor(session.user.role));
  return session;
}
