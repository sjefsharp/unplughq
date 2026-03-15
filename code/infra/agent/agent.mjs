/**
 * UnplugHQ Monitoring Agent
 *
 * Runs on each user's VPS inside a read-only Docker container.
 * Collects host and container metrics, then POSTs them to the
 * control plane every AGENT_INTERVAL_MS milliseconds.
 *
 * Required environment variables:
 *   AGENT_API_TOKEN          — Per-server token issued during provisioning
 *   AGENT_SERVER_ID          — UUID of the server
 *   AGENT_CONTROL_PLANE_URL  — HTTPS base URL (e.g. https://app.unplughq.com)
 *   AGENT_INTERVAL_MS        — Collection interval, default 30000
 */

import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);

// ─── Configuration ───────────────────────────────────────
const API_TOKEN = requiredEnv("AGENT_API_TOKEN");
const SERVER_ID = requiredEnv("AGENT_SERVER_ID");
const CONTROL_PLANE_URL = requiredEnv("AGENT_CONTROL_PLANE_URL");
const INTERVAL_MS = parseInt(process.env.AGENT_INTERVAL_MS || "30000", 10);
const METRICS_ENDPOINT = `${CONTROL_PLANE_URL.replace(/\/+$/, "")}/api/agent/metrics`;

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`[agent] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

// ─── Metrics Collection ──────────────────────────────────

async function collectCpu() {
  try {
    const { stdout } = await exec("cat", ["/proc/stat"]);
    const line = stdout.split("\n").find((l) => l.startsWith("cpu "));
    if (!line) return 0;
    const parts = line.split(/\s+/).slice(1).map(Number);
    const idle = parts[3] || 0;
    const total = parts.reduce((a, b) => a + b, 0);
    return { idle, total };
  } catch {
    return { idle: 0, total: 1 };
  }
}

let prevCpu = null;

async function getCpuPercent() {
  const current = await collectCpu();
  if (!prevCpu) {
    prevCpu = current;
    // Wait a short interval for delta
    await new Promise((r) => setTimeout(r, 1000));
    const next = await collectCpu();
    const idleDelta = next.idle - current.idle;
    const totalDelta = next.total - current.total;
    prevCpu = next;
    return totalDelta === 0
      ? 0
      : Math.round(((totalDelta - idleDelta) / totalDelta) * 10000) / 100;
  }
  const idleDelta = current.idle - prevCpu.idle;
  const totalDelta = current.total - prevCpu.total;
  prevCpu = current;
  return totalDelta === 0
    ? 0
    : Math.round(((totalDelta - idleDelta) / totalDelta) * 10000) / 100;
}

async function getMemory() {
  try {
    const data = await readFile("/proc/meminfo", "utf-8");
    const extract = (key) => {
      const match = data.match(new RegExp(`${key}:\\s+(\\d+)`));
      return match ? parseInt(match[1], 10) * 1024 : 0; // convert kB to bytes
    };
    const total = extract("MemTotal");
    const available = extract("MemAvailable");
    return { ramUsedBytes: total - available, ramTotalBytes: total };
  } catch {
    return { ramUsedBytes: 0, ramTotalBytes: 0 };
  }
}

async function getDisk() {
  try {
    const { stdout } = await exec("df", ["-B1", "/"]);
    const lines = stdout.trim().split("\n");
    if (lines.length < 2) return { diskUsedBytes: 0, diskTotalBytes: 0 };
    const parts = lines[1].split(/\s+/);
    return {
      diskTotalBytes: parseInt(parts[1], 10) || 0,
      diskUsedBytes: parseInt(parts[2], 10) || 0,
    };
  } catch {
    return { diskUsedBytes: 0, diskTotalBytes: 0 };
  }
}

async function getNetwork() {
  try {
    const data = await readFile("/proc/net/dev", "utf-8");
    const lines = data.split("\n").filter((l) => l.includes(":"));
    let rxBytes = 0;
    let txBytes = 0;
    for (const line of lines) {
      const [iface, rest] = line.split(":");
      if (iface.trim() === "lo") continue;
      const parts = rest.trim().split(/\s+/);
      rxBytes += parseInt(parts[0], 10) || 0;
      txBytes += parseInt(parts[8], 10) || 0;
    }
    return { rxBytes, txBytes };
  } catch {
    return { rxBytes: 0, txBytes: 0 };
  }
}

let prevNetwork = null;
let prevNetworkTime = null;

async function getNetworkRate() {
  const current = await getNetwork();
  const now = Date.now();
  if (!prevNetwork || !prevNetworkTime) {
    prevNetwork = current;
    prevNetworkTime = now;
    return { networkRxBytesPerSec: 0, networkTxBytesPerSec: 0 };
  }
  const elapsed = (now - prevNetworkTime) / 1000;
  const rxRate =
    elapsed > 0 ? Math.round((current.rxBytes - prevNetwork.rxBytes) / elapsed) : 0;
  const txRate =
    elapsed > 0 ? Math.round((current.txBytes - prevNetwork.txBytes) / elapsed) : 0;
  prevNetwork = current;
  prevNetworkTime = now;
  return {
    networkRxBytesPerSec: Math.max(0, rxRate),
    networkTxBytesPerSec: Math.max(0, txRate),
  };
}

async function getContainers() {
  try {
    const { stdout } = await exec("docker", [
      "ps",
      "-a",
      "--format",
      "{{.ID}}\t{{.Names}}\t{{.Status}}",
    ]);
    const containers = [];
    for (const line of stdout.trim().split("\n")) {
      if (!line.trim()) continue;
      const [id, name, ...statusParts] = line.split("\t");
      const statusStr = statusParts.join("\t").toLowerCase();
      let status = "stopped";
      if (statusStr.includes("up")) status = "running";
      else if (statusStr.includes("restarting")) status = "restarting";
      else if (statusStr.includes("paused")) status = "paused";
      else if (statusStr.includes("dead")) status = "dead";
      else if (statusStr.includes("created")) status = "created";
      containers.push({ id, name, status });
    }
    return containers.slice(0, 100);
  } catch {
    return [];
  }
}

// ─── Metrics Reporting ───────────────────────────────────

async function collectAndReport() {
  try {
    const [cpuPercent, memory, disk, networkRate, containers] = await Promise.all([
      getCpuPercent(),
      getMemory(),
      getDisk(),
      getNetworkRate(),
      getContainers(),
    ]);

    const payload = {
      serverId: SERVER_ID,
      timestamp: new Date().toISOString(),
      cpuPercent: Math.min(100, Math.max(0, cpuPercent)),
      ...memory,
      ...disk,
      ...networkRate,
      containers,
    };

    const response = await fetch(METRICS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      console.log(`[agent] Metrics reported — CPU: ${cpuPercent}%, containers: ${containers.length}`);
    } else if (response.status === 429) {
      console.warn("[agent] Rate limited — skipping this cycle");
    } else {
      const body = await response.text().catch(() => "");
      console.error(`[agent] Report failed — HTTP ${response.status}: ${body}`);
    }
  } catch (err) {
    console.error(`[agent] Collection/report error: ${err.message}`);
  }
}

// ─── Main Loop ───────────────────────────────────────────

console.log(`[agent] UnplugHQ Monitoring Agent starting`);
console.log(`[agent] Server: ${SERVER_ID}`);
console.log(`[agent] Endpoint: ${METRICS_ENDPOINT}`);
console.log(`[agent] Interval: ${INTERVAL_MS}ms`);

// Initial collection
await collectAndReport();

// Recurring collection
setInterval(collectAndReport, INTERVAL_MS);

// Graceful shutdown
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(`[agent] Received ${signal}, shutting down`);
    process.exit(0);
  });
}
