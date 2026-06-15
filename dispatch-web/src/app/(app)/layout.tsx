import { Sidebar } from "@/components/app/sidebar";
import { AuthGuard } from "@/components/guards/auth-guard";

/**
 * Shell for every authenticated app page: session guard, the sidebar rail,
 * and a content area offset to its right. Same dark scope and dot-grid
 * backdrop as landing/auth so the whole product reads as one room.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="dark min-h-screen w-full bg-zinc-950 text-zinc-300 antialiased">
        <div
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[26px_26px] mask-[linear-gradient(to_bottom,black,transparent_65%)]"
          aria-hidden="true"
        />
        <Sidebar />
        <main className="relative lg:pl-60">{children}</main>
      </div>
    </AuthGuard>
  );
}
