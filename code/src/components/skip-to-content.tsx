export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-[var(--space-4)] focus:top-[var(--space-4)] focus:z-[9999] focus:rounded-[var(--radius-md)] focus:bg-[var(--color-primary-base)] focus:px-[var(--space-4)] focus:py-[var(--space-2)] focus:text-[var(--color-on-primary)] focus:outline-none"
    >
      Skip to main content
    </a>
  );
}
