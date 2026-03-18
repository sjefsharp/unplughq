import type {
  Alert,
  CatalogApp,
  DashboardOutput,
  DeployedApp,
  MetricsSnapshot,
  ServerRecord,
} from "@/lib/schemas";

const now = "2026-03-18T12:00:00.000Z";

export const MOCK_SERVER_ID = "11111111-1111-4111-8111-111111111111";
export const MOCK_NEXTCLOUD_DEPLOYMENT_ID = "22222222-2222-4222-8222-222222222222";
export const MOCK_PLAUSIBLE_DEPLOYMENT_ID = "33333333-3333-4333-8333-333333333333";
export const MOCK_PENDING_DEPLOYMENT_ID = "44444444-4444-4444-8444-444444444444";
export const MOCK_ALERT_ID = "55555555-5555-4555-8555-555555555555";
export const MOCK_ALERT_WARNING_ID = "66666666-6666-4666-8666-666666666666";

export const mockServers: ServerRecord[] = [
  {
    id: MOCK_SERVER_ID,
    name: "Primary server",
    ip: "203.0.113.10",
    sshPort: 22,
    status: "provisioned",
    osName: "Ubuntu 24.04 LTS",
    cpuCores: 4,
    ramGb: 8,
    diskGb: 160,
    createdAt: now,
    updatedAt: now,
  },
];

export const mockCatalogApps: CatalogApp[] = [
  {
    id: "nextcloud",
    name: "Nextcloud",
    description: "A private file hub for sharing, syncing, and collaborating without handing your data to a third party.",
    category: "File Storage",
    version: "30.0.2",
    minCpuCores: 2,
    minRamGb: 4,
    minDiskGb: 20,
    upstreamUrl: "https://nextcloud.com/",
    imageDigest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    configSchema: [
      {
        key: "adminEmail",
        label: "Admin email",
        type: "email",
        required: true,
        default: "owner@example.com",
      },
      {
        key: "storageClass",
        label: "Storage space",
        type: "select",
        required: true,
        default: "Standard",
        options: ["Standard", "Large", "Archive"],
      },
      {
        key: "enableBackups",
        label: "Automatic backups",
        type: "boolean",
        required: false,
        default: "true",
      },
    ],
  },
  {
    id: "plausible",
    name: "Plausible",
    description: "Privacy-friendly analytics for understanding traffic without adding a tangle of marketing scripts.",
    category: "Analytics",
    version: "3.0.1",
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 10,
    upstreamUrl: "https://plausible.io/",
    imageDigest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    configSchema: [
      {
        key: "adminEmail",
        label: "Admin email",
        type: "email",
        required: true,
        default: "analytics@example.com",
      },
      {
        key: "publicDashboard",
        label: "Public dashboard",
        type: "boolean",
        required: false,
        default: "false",
      },
    ],
  },
  {
    id: "ghost",
    name: "Ghost",
    description: "A polished publishing platform for newsletters, blogs, and membership sites you fully control.",
    category: "Productivity",
    version: "5.115.0",
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 8,
    upstreamUrl: "https://ghost.org/",
    imageDigest: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    configSchema: [
      {
        key: "adminEmail",
        label: "Admin email",
        type: "email",
        required: true,
        default: "editor@example.com",
      },
      {
        key: "siteTitle",
        label: "Site title",
        type: "text",
        required: true,
        default: "My publication",
      },
    ],
  },
];

export const mockDeployments: DeployedApp[] = [
  {
    id: MOCK_NEXTCLOUD_DEPLOYMENT_ID,
    serverId: MOCK_SERVER_ID,
    catalogAppId: "nextcloud",
    name: "Nextcloud",
    domain: "files.example.com",
    accessUrl: "https://files.example.com",
    status: "running",
    containerName: "nextcloud-app",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: MOCK_PLAUSIBLE_DEPLOYMENT_ID,
    serverId: MOCK_SERVER_ID,
    catalogAppId: "plausible",
    name: "Plausible",
    domain: "stats.example.com",
    accessUrl: "https://stats.example.com",
    status: "configuring",
    containerName: "plausible-app",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockPendingDeployment: DeployedApp = {
  id: MOCK_PENDING_DEPLOYMENT_ID,
  serverId: MOCK_SERVER_ID,
  catalogAppId: "nextcloud",
  name: "Nextcloud",
  domain: "new-app.example.com",
  accessUrl: "https://new-app.example.com",
  status: "pending",
  containerName: "nextcloud-pending",
  createdAt: now,
  updatedAt: now,
};

export const mockMetricsSnapshot: MetricsSnapshot = {
  serverId: MOCK_SERVER_ID,
  timestamp: now,
  cpuPercent: 64,
  ramUsedBytes: 5 * 1024 * 1024 * 1024,
  ramTotalBytes: 8 * 1024 * 1024 * 1024,
  diskUsedBytes: 112 * 1024 * 1024 * 1024,
  diskTotalBytes: 160 * 1024 * 1024 * 1024,
  networkRxBytesPerSec: 12 * 1024 * 1024,
  networkTxBytesPerSec: 4 * 1024 * 1024,
  containers: [
    {
      id: "ctr-nextcloud",
      name: "nextcloud-app",
      status: "running",
      diskUsageBytes: 42 * 1024 * 1024 * 1024,
    },
    {
      id: "ctr-plausible",
      name: "plausible-app",
      status: "running",
      diskUsageBytes: 18 * 1024 * 1024 * 1024,
    },
  ],
};

export const mockAlerts: Alert[] = [
  {
    id: MOCK_ALERT_ID,
    serverId: MOCK_SERVER_ID,
    appId: MOCK_PLAUSIBLE_DEPLOYMENT_ID,
    severity: "critical",
    type: "app-unavailable",
    message: "Plausible stopped responding at 11:52.",
    notificationSent: true,
    acknowledgedAt: null,
    createdAt: now,
  },
  {
    id: MOCK_ALERT_WARNING_ID,
    serverId: MOCK_SERVER_ID,
    appId: null,
    severity: "warning",
    type: "disk-critical",
    message: "Storage is at 70%. Nextcloud is using 42 GB.",
    notificationSent: false,
    acknowledgedAt: null,
    createdAt: now,
  },
];

export const mockDashboardOutput: DashboardOutput = {
  servers: [
    {
      server: mockServers[0],
      latestMetrics: mockMetricsSnapshot,
      apps: mockDeployments,
      activeAlerts: mockAlerts,
    },
  ],
};
