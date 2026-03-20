import type { Metadata, Viewport } from "next";
import "@/styles/global.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCProvider } from "@/lib/trpc/provider";
import { Toaster } from "@/components/ui/toaster";
import { SkipToContent } from "@/components/skip-to-content";
import { RouteAnnouncer } from "@/components/route-announcer";

export const metadata: Metadata = {
  title: "UnplugHQ — Self-Hosting Management Platform",
  description:
    "Deploy, manage, and maintain self-hosted applications on your own servers without terminal access.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SkipToContent />
        <ThemeProvider>
          <TRPCProvider>
            <RouteAnnouncer>
              {children}
            </RouteAnnouncer>
            <Toaster />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
