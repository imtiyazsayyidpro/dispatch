import { AuthHeader } from "@/components/auth/auth-header";
import { DeliveryLog } from "@/components/auth/delivery-log";

/**
 * Shared shell for login, register, and onboarding. Split layout: the form
 * lives on the left, and a live delivery log runs on the right — the
 * product demonstrating itself while you sign up. Same dark scope and
 * dot-grid backdrop as the landing page.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark relative flex min-h-screen flex-1 flex-col overflow-hidden bg-zinc-950 text-zinc-300 antialiased">
      <div
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[26px_26px] mask-[linear-gradient(to_bottom,black,transparent_70%)]"
        aria-hidden="true"
      />

      <AuthHeader />

      <div className="relative z-10 grid flex-1 lg:grid-cols-2">
        <main className="flex items-center justify-center px-6 pt-10 pb-16 lg:pt-0">
          {children}
        </main>

        <aside
          className="relative hidden items-center justify-center border-l border-zinc-800/70 bg-zinc-900/20 px-12 lg:flex"
          aria-hidden="true"
        >
          <DeliveryLog />
        </aside>
      </div>
    </div>
  );
}
