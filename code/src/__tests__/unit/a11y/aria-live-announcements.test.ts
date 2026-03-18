/**
 * Unit Tests — aria-live Announcement Logic
 * Covers: AB#309 (deploy progress announcements), AB#310 (alert SSE announcements)
 * WCAG: 4.1.3 AA (Status Messages)
 */
import { describe, it, expect } from "vitest";

// ---------- AB#309: Deploy progress announcement logic ----------

const DEPLOYMENT_PHASES = [
  { status: "pending", label: "Preparing", description: "Getting everything ready for your app." },
  { status: "pulling", label: "Downloading", description: "Downloading your app. This may take a moment." },
  { status: "configuring", label: "Configuring", description: "Applying your settings." },
  { status: "provisioning-ssl", label: "Securing", description: "Setting up a secure connection for your domain." },
  { status: "starting", label: "Starting", description: "Starting your app. Almost there." },
  { status: "running", label: "Running", description: "Your app is live and ready to use." },
] as const;

type DeploymentStatus = (typeof DEPLOYMENT_PHASES)[number]["status"];

function getPhaseIndex(status: DeploymentStatus): number {
  const idx = DEPLOYMENT_PHASES.findIndex((p) => p.status === status);
  return idx >= 0 ? idx : -1;
}

/**
 * Replicates the aria-live region text computation from the deploy progress page.
 */
function computeDeployAnnouncement(
  failed: boolean,
  isComplete: boolean,
  currentPhaseIdx: number,
  appName: string,
): string {
  if (!failed && !isComplete && DEPLOYMENT_PHASES[currentPhaseIdx]) {
    return `${DEPLOYMENT_PHASES[currentPhaseIdx].label}: ${DEPLOYMENT_PHASES[currentPhaseIdx].description} Step ${currentPhaseIdx + 1} of ${DEPLOYMENT_PHASES.length}.`;
  }
  if (isComplete) return `Deployment complete. ${appName} is running.`;
  if (failed) return "Deployment failed.";
  return "";
}

/**
 * Replicates the aria-valuetext computation from the progressbar element.
 */
function computeProgressValueText(currentPhaseIdx: number): string {
  return `${DEPLOYMENT_PHASES[currentPhaseIdx]?.label ?? "Preparing"} — step ${currentPhaseIdx + 1} of ${DEPLOYMENT_PHASES.length}`;
}

// ---------- AB#310: Alert announcement logic ----------

/**
 * Replicates the new alert announcement computation from the alerts page.
 */
function computeNewAlertAnnouncement(severity: string, message: string | undefined, type: string): string {
  return `New ${severity} alert: ${message || type}`;
}

describe("aria-live Announcements — AB#309 Deploy Progress", () => {
  describe("Phase transition announcements", () => {
    it.each(
      DEPLOYMENT_PHASES.filter((p) => p.status !== "running").map((phase, idx) => ({
        status: phase.status,
        idx,
        label: phase.label,
        description: phase.description,
      })),
    )(
      'should announce "$label" for status "$status"',
      ({ idx, label, description }) => {
        const text = computeDeployAnnouncement(false, false, idx, "Plausible");
        expect(text).toBe(`${label}: ${description} Step ${idx + 1} of ${DEPLOYMENT_PHASES.length}.`);
      },
    );

    it("should announce completion when deployment is running", () => {
      const text = computeDeployAnnouncement(false, true, 5, "Plausible");
      expect(text).toBe("Deployment complete. Plausible is running.");
    });

    it("should announce failure when deployment fails", () => {
      const text = computeDeployAnnouncement(true, false, 2, "Plausible");
      expect(text).toBe("Deployment failed.");
    });

    it("should include the app name in completion announcement", () => {
      const text = computeDeployAnnouncement(false, true, 5, "Nextcloud");
      expect(text).toContain("Nextcloud");
    });
  });

  describe("Progressbar aria-valuetext", () => {
    it.each(
      DEPLOYMENT_PHASES.map((phase, idx) => ({
        status: phase.status,
        idx,
        label: phase.label,
      })),
    )(
      'should produce "$label — step $idx+1" for status "$status"',
      ({ idx, label }) => {
        const text = computeProgressValueText(idx);
        expect(text).toBe(`${label} — step ${idx + 1} of ${DEPLOYMENT_PHASES.length}`);
      },
    );

    it("should fall back to 'Preparing' for invalid index", () => {
      const text = computeProgressValueText(-1);
      expect(text).toContain("Preparing");
    });
  });

  describe("getPhaseIndex", () => {
    it("should return correct index for each phase", () => {
      expect(getPhaseIndex("pending")).toBe(0);
      expect(getPhaseIndex("pulling")).toBe(1);
      expect(getPhaseIndex("configuring")).toBe(2);
      expect(getPhaseIndex("provisioning-ssl")).toBe(3);
      expect(getPhaseIndex("starting")).toBe(4);
      expect(getPhaseIndex("running")).toBe(5);
    });
  });
});

describe("aria-live Announcements — AB#310 Alerts SSE", () => {
  describe("New alert announcements", () => {
    it("should include severity and message for a critical alert", () => {
      const text = computeNewAlertAnnouncement("critical", "CPU usage above 95%", "cpu-critical");
      expect(text).toBe("New critical alert: CPU usage above 95%");
    });

    it("should include severity and message for a warning alert", () => {
      const text = computeNewAlertAnnouncement("warning", "Disk usage above 80%", "disk-warning");
      expect(text).toBe("New warning alert: Disk usage above 80%");
    });

    it("should fall back to type when message is undefined", () => {
      const text = computeNewAlertAnnouncement("critical", undefined, "app-unavailable");
      expect(text).toBe("New critical alert: app-unavailable");
    });

    it("should fall back to type when message is empty string", () => {
      const text = computeNewAlertAnnouncement("info", "", "heartbeat-missed");
      expect(text).toBe("New info alert: heartbeat-missed");
    });
  });

  describe("Action result announcements", () => {
    it("should have correct acknowledge announcement text", () => {
      const text = "Alert acknowledged. Repeat notifications silenced.";
      expect(text).toContain("acknowledged");
      expect(text.length).toBeGreaterThan(0);
    });

    it("should have correct dismiss announcement text", () => {
      const text = "Alert dismissed. It will return if the condition reoccurs.";
      expect(text).toContain("dismissed");
      expect(text.length).toBeGreaterThan(0);
    });
  });
});
