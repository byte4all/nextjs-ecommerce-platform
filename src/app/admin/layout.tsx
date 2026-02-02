import { redirect } from "next/navigation";
import { stackServerApp } from "@/stack/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side: Get the current user from Stack Auth (reads from Next.js cookies)
  const user = await stackServerApp.getUser({
    or: "redirect",
  });

  // Server-side: Check if user has admin access via serverMetadata
  // In Stack Auth dashboard, set serverMetadata: { "access_admin_dashboard": true }
  const serverMetadata = user.serverMetadata as { access_admin_dashboard?: boolean } | null;
  const hasAdminAccess = serverMetadata?.access_admin_dashboard === true;

  if (!hasAdminAccess) {
    redirect("/?error=access_denied");
  }

  return <>{children}</>;
}
