import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deploy — UnplugHQ",
};

export default function DeployLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
