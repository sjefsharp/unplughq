"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, TriangleAlert, Info } from "lucide-react";
import { trpc } from "@/server/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CatalogApp } from "@/lib/schemas";

type ConfigField = CatalogApp["configSchema"][number];

interface WizardStep {
  id: string;
  label: string;
}

export default function ConfigurePage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = use(params);
  const router = useRouter();
  const { data: app, isLoading: appLoading } = trpc.app.catalog.get.useQuery({ id: appId });
  const { data: servers, isLoading: serversLoading } = trpc.server.list.useQuery();

  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [selectedServer, setSelectedServer] = useState("");
  const [domain, setDomain] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const storageKey = `deploy-config:${appId}`;

  const isLoading = appLoading || serversLoading;
  const domainIsValid = useMemo(() => {
    if (!domain.trim()) return false;
    return /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain);
  }, [domain]);

  // Build wizard steps
  const steps: WizardStep[] = [];
  const multiServer = servers && servers.length > 1;
  if (multiServer) steps.push({ id: "server", label: "Server" });
  steps.push({ id: "domain", label: "Domain & Core" });
  if (app?.configSchema && app.configSchema.length > 0) {
    steps.push({ id: "settings", label: "App Settings" });
  }
  steps.push({ id: "review", label: "Review & Deploy" });

  const isLastStep = currentStep === steps.length - 1;
  const currentStepId = steps[currentStep]?.id;

  const setField = useCallback(
    (key: string, value: string) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );


  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.sessionStorage.getItem(storageKey);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as {
        serverId?: string;
        domain?: string;
        adminEmail?: string;
        config?: Record<string, string>;
      };

      if (parsed.serverId) setSelectedServer(parsed.serverId);
      if (parsed.domain) setDomain(parsed.domain);
      if (parsed.adminEmail) setAdminEmail(parsed.adminEmail);
      if (parsed.config) setConfig(parsed.config);
    } catch {
      // Ignore malformed persisted wizard state.
    }
  }, [storageKey]);

  useEffect(() => {
    if (!selectedServer && servers && servers.length === 1) {
      setSelectedServer(servers[0].id);
    }
  }, [selectedServer, servers]);

  useEffect(() => {
    if (!app?.configSchema) return;

    setConfig((previous) => {
      if (Object.keys(previous).length > 0) {
        return previous;
      }

      const defaults: Record<string, string> = {};
      for (const field of app.configSchema) {
        if (field.default) {
          defaults[field.key] = field.default;
        }
      }

      return Object.keys(defaults).length > 0 ? defaults : previous;
    });
  }, [app?.configSchema]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        serverId: selectedServer,
        domain,
        adminEmail,
        config,
      }),
    );
  }, [adminEmail, config, domain, selectedServer, storageKey]);

  const canContinue = useMemo(() => {
    if (currentStepId === "server") {
      return Boolean(selectedServer);
    }

    if (currentStepId === "domain") {
      return domainIsValid && Boolean(adminEmail.trim());
    }

    return true;
  }, [adminEmail, currentStepId, domainIsValid, selectedServer]);

  function goNext() {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function goBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  function goToStep(idx: number) {
    if (idx < currentStep) setCurrentStep(idx);
  }

  function handleDeploy() {
    // Navigate to summary page with params in URL (config stored in session)
    const configStr = encodeURIComponent(JSON.stringify({
      serverId: selectedServer,
      domain,
      adminEmail,
      config,
    }));
    router.push(`/deploy/${appId}/summary?c=${configStr}`);
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[640px] space-y-[var(--space-6)]">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Card>
          <CardContent className="space-y-[var(--space-4)] p-[var(--space-8)]">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="py-[var(--space-16)] text-center">
        <h1 className="text-[length:var(--text-2xl-fs)] font-bold text-[var(--color-text-base)]">
          App not found
        </h1>
        <Button asChild className="mt-[var(--space-6)]">
          <Link href="/marketplace">Back to catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-[var(--space-6)]">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-[var(--space-1)]">
        <Link
          href="/marketplace"
          className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
        >
          Catalog
        </Link>
        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
        <Link
          href={`/marketplace/${appId}`}
          className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
        >
          {app.name}
        </Link>
        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
        <span className="text-[length:var(--text-sm-fs)] font-medium text-[var(--color-text-base)]">
          Configure
        </span>
      </nav>

      <div>
        <h1 className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-bold text-[var(--color-text-base)]">
          Set up {app.name}
        </h1>
        <p className="mt-[var(--space-1)] text-[length:var(--text-base-fs)] text-[var(--color-text-muted)]">
          Answer a few questions to configure your app.
        </p>
      </div>

      {/* Step indicators */}
      <nav aria-label="Configuration steps" className="flex items-center gap-[var(--space-2)]">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;
          return (
            <div key={step.id} className="flex items-center gap-[var(--space-2)]">
              {idx > 0 && (
                <div
                  className={cn(
                    "h-0.5 w-8",
                    isCompleted ? "bg-[var(--color-success-base)]" : "bg-[var(--color-border-base)]",
                  )}
                  aria-hidden="true"
                />
              )}
              <button
                onClick={() => goToStep(idx)}
                disabled={idx > currentStep}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold transition-colors",
                  isCompleted
                    ? "bg-[var(--color-success-base)] text-white"
                    : isActive
                      ? "bg-[var(--color-primary-base)] text-white"
                      : "border border-[var(--color-border-base)] text-[var(--color-text-subtle)]",
                )}
                aria-label={`Step ${idx + 1}: ${step.label}${isCompleted ? " (completed)" : isActive ? " (current)" : ""}`}
                aria-current={isActive ? "step" : undefined}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </button>
              <span className={cn(
                "hidden text-[length:var(--text-sm-fs)] sm:inline",
                isActive ? "font-medium text-[var(--color-text-base)]" : "text-[var(--color-text-muted)]",
              )}>
                {step.label}
              </span>
            </div>
          );
        })}
      </nav>

      {/* Defaults banner */}
      {currentStepId === "settings" && (
        <div className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] px-[var(--space-4)] py-[var(--space-3)]">
          <Info className="h-4 w-4 shrink-0 text-[var(--color-primary-text)]" aria-hidden="true" />
          <p className="text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)]">
            We&apos;ve filled in sensible defaults. Change only what you need.
          </p>
        </div>
      )}

      {/* Form card */}
      <Card>
        <CardContent className="p-[var(--space-8)]">
          <fieldset className="space-y-[var(--space-6)]">
            <legend className="sr-only">{steps[currentStep]?.label}</legend>

            {/* Server selection step */}
            {currentStepId === "server" && servers && (
              <div className="space-y-[var(--space-4)]">
                <Label className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
                  Deploy to
                </Label>
                <p className="text-[length:var(--text-xs-fs)] text-[var(--color-text-subtle)]">
                  Choose which server to deploy this app on.
                </p>
                <div className="space-y-[var(--space-2)]" role="radiogroup" aria-label="Server selection">
                  {servers.map((server: { id: string; name: string; ip: string }) => (
                    <label
                      key={server.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-[var(--space-3)] rounded-[var(--radius-sm)] border p-[var(--space-3)] transition-colors",
                        selectedServer === server.id
                          ? "border-[var(--color-primary-base)] bg-[var(--color-primary-subtle)]"
                          : "border-[var(--color-border-base)] hover:bg-[var(--color-bg-surface-hover)]",
                      )}
                    >
                      <input
                        type="radio"
                        name="server"
                        value={server.id}
                        checked={selectedServer === server.id}
                        onChange={() => setSelectedServer(server.id)}
                        className="sr-only"
                      />
                      <div className="flex-1">
                        <div className="text-[length:var(--text-base-fs)] font-medium text-[var(--color-text-base)]">
                          {server.name}
                        </div>
                        <div className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
                          {server.ip}
                        </div>
                      </div>
                      {selectedServer === server.id && (
                        <Check className="h-5 w-5 text-[var(--color-primary-base)]" aria-hidden="true" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Domain & core step */}
            {currentStepId === "domain" && (
              <div className="space-y-[var(--space-4)]">
                <div className="space-y-[var(--space-2)]">
                  <Label htmlFor="domain">Web address</Label>
                  <Input
                    id="domain"
                    type="text"
                    placeholder="app.yourdomain.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    autoComplete="url"
                    aria-invalid={domain.length > 0 && !domainIsValid}
                    aria-describedby="domain-help domain-warning"
                  />
                  <p id="domain-help" className="text-[length:var(--text-xs-fs)] text-[var(--color-text-subtle)]">
                    The address where you&apos;ll access this app.
                  </p>
                  {domain.length > 0 && !domainIsValid && (
                    <p id="domain-warning" className="text-[length:var(--text-xs-fs)] text-[var(--color-critical-text)]">
                      Enter a valid web address to continue.
                    </p>
                  )}
                </div>
                <div className="space-y-[var(--space-2)]">
                  <Label htmlFor="adminEmail">Admin email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="you@example.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    autoComplete="email"
                  />
                  <p className="text-[length:var(--text-xs-fs)] text-[var(--color-text-subtle)]">
                    Used to create your app&apos;s administrator account.
                  </p>
                </div>
              </div>
            )}

            {/* App-specific settings step */}
            {currentStepId === "settings" && app.configSchema.map((field: ConfigField) => (
              <div key={field.key} className="space-y-[var(--space-2)]">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === "select" && field.options ? (
                  <select
                    id={field.key}
                    value={config[field.key] ?? ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className="flex h-[44px] w-full rounded-[var(--radius-sm)] border border-[var(--color-border-base)] bg-[var(--color-bg-base)] px-[var(--space-3)] text-[length:var(--text-base-fs)] text-[var(--color-text-base)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)]"
                    aria-required={field.required}
                  >
                    <option value="">Select...</option>
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === "boolean" ? (
                  <label className="flex items-center gap-[var(--space-2)]">
                    <input
                      type="checkbox"
                      id={field.key}
                      checked={config[field.key] === "true"}
                      onChange={(e) => setField(field.key, e.target.checked ? "true" : "false")}
                      className="h-4 w-4"
                    />
                    <span className="text-[length:var(--text-sm-fs)] text-[var(--color-text-base)]">
                      Enable
                    </span>
                  </label>
                ) : (
                  <Input
                    id={field.key}
                    type={field.type === "password" ? "password" : field.type === "email" ? "email" : "text"}
                    value={config[field.key] ?? ""}
                    onChange={(e) => setField(field.key, e.target.value)}
                    required={field.required}
                    autoComplete={field.type === "email" ? "email" : field.type === "password" ? "new-password" : "off"}
                  />
                )}
              </div>
            ))}

            {/* Review step */}
            {currentStepId === "review" && (
              <ReviewSection
                app={app}
                servers={servers ?? []}
                selectedServer={selectedServer}
                domain={domain}
                adminEmail={adminEmail}
                config={config}
                onEditStep={goToStep}
                steps={steps}
              />
            )}
          </fieldset>

          {/* Resource warning */}
          {currentStepId === "review" && (
            <div className="mt-[var(--space-4)] flex items-start gap-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-warning-subtle)] px-[var(--space-4)] py-[var(--space-3)]" role="alert" aria-live="polite">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning-text)]" aria-hidden="true" />
              <p className="text-[length:var(--text-sm-fs)] text-[var(--color-warning-text)]">
                Your server may not have enough resources for this app. You can still deploy, but performance may be affected.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-[var(--space-8)] flex justify-between">
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={goBack}>Back</Button>
            ) : (
              <div />
            )}
            {isLastStep ? (
              <Button onClick={handleDeploy}>Deploy {app.name}</Button>
            ) : (
              <Button onClick={goNext} disabled={!canContinue}>
                Continue
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewSection({
  app,
  servers,
  selectedServer,
  domain,
  adminEmail,
  config,
  onEditStep,
  steps,
}: {
  app: CatalogApp;
  servers: Array<{ id: string; name: string; ip: string }>;
  selectedServer: string;
  domain: string;
  adminEmail: string;
  config: Record<string, string>;
  onEditStep: (idx: number) => void;
  steps: WizardStep[];
}) {
  const server = servers.find((s) => s.id === selectedServer);
  const serverStepIdx = steps.findIndex((s) => s.id === "server");
  const domainStepIdx = steps.findIndex((s) => s.id === "domain");
  const settingsStepIdx = steps.findIndex((s) => s.id === "settings");

  return (
    <div className="space-y-[var(--space-6)]">
      <div>
        <h2 className="text-[length:var(--text-xl-fs)] font-semibold text-[var(--color-text-base)]">
          Review your settings
        </h2>
        <p className="mt-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
          Confirm everything looks right before deploying.
        </p>
      </div>

      {server && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] p-[var(--space-4)]">
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-sm-fs)] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
              Server
            </span>
            {serverStepIdx >= 0 && (
              <button onClick={() => onEditStep(serverStepIdx)} className="text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)] hover:underline">
                Edit
              </button>
            )}
          </div>
          <div className="mt-[var(--space-2)]">
            <span className="text-[length:var(--text-base-fs)] font-medium text-[var(--color-text-base)]">
              {server.name}
            </span>
            <span className="ml-[var(--space-2)] text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
              {server.ip}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] p-[var(--space-4)]">
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--text-sm-fs)] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
            Domain & Core
          </span>
          {domainStepIdx >= 0 && (
            <button onClick={() => onEditStep(domainStepIdx)} className="text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)] hover:underline">
              Edit
            </button>
          )}
        </div>
        <dl className="mt-[var(--space-2)] space-y-[var(--space-2)]">
          <div className="flex justify-between">
            <dt className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">Web address</dt>
            <dd className="text-[length:var(--text-base-fs)] font-medium text-[var(--color-text-base)]">{domain || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">Admin email</dt>
            <dd className="text-[length:var(--text-base-fs)] font-medium text-[var(--color-text-base)]">{adminEmail || "—"}</dd>
          </div>
        </dl>
      </div>

      {app.configSchema.length > 0 && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] p-[var(--space-4)]">
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-sm-fs)] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
              App Settings
            </span>
            {settingsStepIdx >= 0 && (
              <button onClick={() => onEditStep(settingsStepIdx)} className="text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)] hover:underline">
                Edit
              </button>
            )}
          </div>
          <dl className="mt-[var(--space-2)] space-y-[var(--space-2)]">
            {app.configSchema.map((field: ConfigField) => (
              <div key={field.key} className="flex justify-between">
                <dt className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">{field.label}</dt>
                <dd className="text-[length:var(--text-base-fs)] font-medium text-[var(--color-text-base)]">
                  {field.type === "password" ? "••••••••" : config[field.key] || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
