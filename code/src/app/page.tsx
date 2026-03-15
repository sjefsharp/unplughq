export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1
        className="text-4xl font-bold tracking-tight"
        style={{ fontSize: "var(--text-5xl-fs)", lineHeight: "var(--text-5xl-lh)" }}
      >
        UnplugHQ
      </h1>
      <p
        className="mt-4 max-w-md text-center"
        style={{ color: "var(--color-text-muted)" }}
      >
        Self-hosting management platform. Deploy, manage, and maintain
        self-hosted applications on your own servers.
      </p>
    </main>
  );
}
