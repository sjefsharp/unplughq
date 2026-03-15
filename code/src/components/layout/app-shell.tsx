import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function AppShell({ children, breadcrumbs }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-[260px]">
        <TopBar breadcrumbs={breadcrumbs} />
        <main
          id="main-content"
          className="mx-auto max-w-[1200px] px-[var(--space-4)] py-[var(--space-6)] lg:px-[var(--space-8)]"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
