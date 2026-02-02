import Link from "next/link";
import { stackServerApp } from "@/stack/server";

export default async function AdminPage() {
  // Each page with sensitive data should protect itself (not just rely on layout)
  await stackServerApp.getUser({ or: "redirect" });

  return (
    <main className="min-h-screen max-w-frame mx-auto px-4 xl:px-0 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-black/60">
          Welcome to the admin panel. You have access because your Stack Auth
          user has the <code className="bg-black/5 px-1 rounded">access_admin_dashboard</code> permission.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/"
          className="text-sm text-black/60 hover:text-black underline"
        >
          ← Back to Shop
        </Link>
        <Link
          href="/handler/sign-out"
          className="text-sm text-black/60 hover:text-black underline"
        >
          Sign out
        </Link>
      </div>
    </main>
  );
}
