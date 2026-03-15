import type { Metadata, Viewport } from "next";
import "@/styles/global.css";
import { ThemeProvider } from "@/components/theme-provider";

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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
