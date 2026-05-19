import type { AppRole } from "@/lib/auth";

/** Role-specific dashboard URL after sign-in / sign-up. */
export function dashboardPathForRole(locale: string, role: AppRole): string {
  if (role === "tutor") return `/${locale}/dashboard/tutor`;
  if (role === "admin") return `/${locale}/dashboard/admin`;
  return `/${locale}/dashboard/student`;
}
