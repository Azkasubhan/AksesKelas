export type Role = "teacher" | "student";

export function homeFor(role: Role): string {
  return role === "teacher" ? "/guru" : "/siswa";
}

/**
 * Redirect pasca login hanya ke path internal yang di-allowlist dan sesuai role.
 * Mencegah open redirect (`//evil.com`, `\\`, URL absolut).
 */
export function safeNextPath(next: string | null | undefined, role: Role): string {
  const fallback = homeFor(role);
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return fallback;
  }
  const prefix = homeFor(role);
  return next === prefix || next.startsWith(`${prefix}/`) ? next : fallback;
}
