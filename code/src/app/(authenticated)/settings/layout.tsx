import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings — UnplugHQ",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
