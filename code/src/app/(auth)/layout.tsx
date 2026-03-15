import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in — UnplugHQ",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-surface)] px-[var(--space-4)]">
      <main id="main-content" className="w-full max-w-md">
        {children}
      </main>
    </div>
  );
}
