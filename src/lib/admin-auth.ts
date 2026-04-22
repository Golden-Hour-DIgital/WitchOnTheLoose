import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails().includes(email.toLowerCase());
}

/**
 * For server components / API routes: returns the session if the caller is an admin,
 * otherwise redirects to /admin/login (server components) or throws (use getAdminSessionOrNull for API).
 */
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    redirect("/admin/login");
  }
  return user;
}

export async function getAdminUserOrNull() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
