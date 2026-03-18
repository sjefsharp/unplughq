import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Alerts — UnplugHQ",
};

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
