/**
 * Development seed script — populates the database with test data for local development.
 *
 * Usage: npx tsx src/server/db/seed.ts
 *
 * Requires DATABASE_URL environment variable to be set.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { hash } from 'argon2';
import { createHash } from 'node:crypto';
import {
  users,
  sessions,
  servers,
  catalogApps,
  deployments,
  alerts,
  auditLog,
  metricsSnapshots,
} from './schema';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client);

function buildDigest(seed: string): `sha256:${string}` {
  return `sha256:${createHash('sha256').update(seed).digest('hex')}`;
}

const catalogAppSeed: Array<typeof catalogApps.$inferInsert> = [
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    description: 'Private file sync, sharing, and collaboration workspace.',
    category: 'File Storage',
    version: '31.0.0',
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 20,
    upstreamUrl: 'https://nextcloud.com/',
    imageDigest: buildDigest('nextcloud:31.0.0'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
      { key: 'adminPassword', label: 'Admin password', type: 'password', required: true },
    ],
  },
  {
    id: 'seafile',
    name: 'Seafile',
    description: 'High-performance file sync and document collaboration.',
    category: 'File Storage',
    version: '11.0.13',
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 16,
    upstreamUrl: 'https://www.seafile.com/',
    imageDigest: buildDigest('seafile:11.0.13'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'filebrowser',
    name: 'File Browser',
    description: 'Lightweight browser-based file manager for server storage.',
    category: 'File Storage',
    version: '2.32.0',
    minCpuCores: 1,
    minRamGb: 0.5,
    minDiskGb: 4,
    upstreamUrl: 'https://filebrowser.org/',
    imageDigest: buildDigest('filebrowser:2.32.0'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminPassword', label: 'Admin password', type: 'password', required: true },
    ],
  },
  {
    id: 'plausible',
    name: 'Plausible Analytics',
    description: 'Privacy-friendly web analytics dashboard.',
    category: 'Analytics',
    version: '2.1.4',
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 10,
    upstreamUrl: 'https://plausible.io/',
    imageDigest: buildDigest('plausible:2.1.4'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'umami',
    name: 'Umami',
    description: 'Simple privacy-focused analytics for websites and products.',
    category: 'Analytics',
    version: '2.13.2',
    minCpuCores: 1,
    minRamGb: 1,
    minDiskGb: 6,
    upstreamUrl: 'https://umami.is/',
    imageDigest: buildDigest('umami:2.13.2'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'matomo',
    name: 'Matomo',
    description: 'Self-hosted analytics suite with reports and privacy controls.',
    category: 'Analytics',
    version: '5.1.2',
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 12,
    upstreamUrl: 'https://matomo.org/',
    imageDigest: buildDigest('matomo:5.1.2'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'ghost',
    name: 'Ghost',
    description: 'Modern publishing platform for blogs and newsletters.',
    category: 'CMS',
    version: '5.115.0',
    minCpuCores: 1,
    minRamGb: 1,
    minDiskGb: 8,
    upstreamUrl: 'https://ghost.org/',
    imageDigest: buildDigest('ghost:5.115.0'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Popular CMS for websites, landing pages, and blogs.',
    category: 'CMS',
    version: '6.8.1',
    minCpuCores: 1,
    minRamGb: 1,
    minDiskGb: 10,
    upstreamUrl: 'https://wordpress.org/',
    imageDigest: buildDigest('wordpress:6.8.1'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'siteTitle', label: 'Site title', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'strapi',
    name: 'Strapi',
    description: 'Customizable headless CMS for APIs and content operations.',
    category: 'CMS',
    version: '4.25.12',
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 8,
    upstreamUrl: 'https://strapi.io/',
    imageDigest: buildDigest('strapi:4.25.12'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'vaultwarden',
    name: 'Vaultwarden',
    description: 'Lightweight password manager compatible with Bitwarden clients.',
    category: 'Password Management',
    version: '1.32.7',
    minCpuCores: 1,
    minRamGb: 0.5,
    minDiskGb: 4,
    upstreamUrl: 'https://github.com/dani-garcia/vaultwarden',
    imageDigest: buildDigest('vaultwarden:1.32.7'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'passbolt',
    name: 'Passbolt',
    description: 'Team password manager with sharing and auditing workflows.',
    category: 'Password Management',
    version: '4.8.1',
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 8,
    upstreamUrl: 'https://www.passbolt.com/',
    imageDigest: buildDigest('passbolt:4.8.1'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'listmonk',
    name: 'Listmonk',
    description: 'Newsletter and mailing list manager for self-hosted email campaigns.',
    category: 'Email',
    version: '4.0.0',
    minCpuCores: 1,
    minRamGb: 1,
    minDiskGb: 4,
    upstreamUrl: 'https://listmonk.app/',
    imageDigest: buildDigest('listmonk:4.0.0'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
      { key: 'senderEmail', label: 'Sender email', type: 'email', required: true },
    ],
  },
  {
    id: 'postal',
    name: 'Postal',
    description: 'Email delivery platform for transactional workloads.',
    category: 'Email',
    version: '3.0.0',
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 10,
    upstreamUrl: 'https://postalserver.io/',
    imageDigest: buildDigest('postal:3.0.0'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'immich',
    name: 'Immich',
    description: 'Photo and video backup platform with mobile-friendly libraries.',
    category: 'Photo Storage',
    version: '1.135.3',
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 20,
    upstreamUrl: 'https://immich.app/',
    imageDigest: buildDigest('immich:1.135.3'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'photoprism',
    name: 'PhotoPrism',
    description: 'AI-powered photo browsing and organization with self-hosted storage.',
    category: 'Photo Storage',
    version: '240915',
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 20,
    upstreamUrl: 'https://www.photoprism.app/',
    imageDigest: buildDigest('photoprism:240915'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminPassword', label: 'Admin password', type: 'password', required: true },
    ],
  },
  {
    id: 'gitea',
    name: 'Gitea',
    description: 'Lightweight Git hosting and team collaboration platform.',
    category: 'Developer Tools',
    version: '1.24.0',
    minCpuCores: 1,
    minRamGb: 1,
    minDiskGb: 8,
    upstreamUrl: 'https://about.gitea.com/',
    imageDigest: buildDigest('gitea:1.24.0'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
  {
    id: 'n8n',
    name: 'n8n',
    description: 'Workflow automation platform for triggers, jobs, and integrations.',
    category: 'Automation',
    version: '1.92.2',
    minCpuCores: 2,
    minRamGb: 1,
    minDiskGb: 6,
    upstreamUrl: 'https://n8n.io/',
    imageDigest: buildDigest('n8n:1.92.2'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
      { key: 'timezone', label: 'Timezone', type: 'select', required: true, default: 'UTC', options: ['UTC', 'Europe/Amsterdam', 'America/New_York'] },
    ],
  },
  {
    id: 'metabase',
    name: 'Metabase',
    description: 'Business intelligence dashboards for internal analytics and reporting.',
    category: 'Business Intelligence',
    version: '0.55.7',
    minCpuCores: 2,
    minRamGb: 2,
    minDiskGb: 8,
    upstreamUrl: 'https://www.metabase.com/',
    imageDigest: buildDigest('metabase:0.55.7'),
    configSchema: [
      { key: 'domain', label: 'App domain', type: 'text', required: true },
      { key: 'adminEmail', label: 'Admin email', type: 'email', required: true },
    ],
  },
];

async function seed() {
  console.log('🌱 Seeding database...');

  // --- Users ---
  const passwordHash = await hash('SecureP@ssw0rd123');

  const [alice] = await db
    .insert(users)
    .values({
      name: 'Alice Johnson',
      email: 'alice@example.com',
      emailVerified: new Date(),
      passwordHash,
      tier: 'pro',
      notificationPrefs: { emailAlerts: true },
    })
    .returning();

  const [bob] = await db
    .insert(users)
    .values({
      name: 'Bob Smith',
      email: 'bob@example.com',
      emailVerified: new Date(),
      passwordHash: await hash('An0therStr0ng!Pass'),
      tier: 'free',
      notificationPrefs: { emailAlerts: false },
    })
    .returning();

  console.log(`  ✓ Users: alice (${alice.id}), bob (${bob.id})`);

  // --- Sessions ---
  const [aliceSession] = await db
    .insert(sessions)
    .values({
      sessionToken: 'dev-session-alice-001',
      userId: alice.id,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })
    .returning();

  console.log(`  ✓ Session: ${aliceSession.sessionToken}`);

  // --- Servers ---
  const [server1] = await db
    .insert(servers)
    .values({
      tenantId: alice.id,
      name: 'Hetzner Dev Box',
      ip: '159.69.42.100',
      sshPort: 22,
      sshUser: 'unplughq',
      sshKeyEncrypted: 'encrypted:aes-256-gcm:base64-placeholder-for-dev',
      status: 'provisioned',
      osName: 'Ubuntu 24.04 LTS',
      cpuCores: 4,
      ramGb: 8,
      diskGb: 80,
      apiToken: 'dev-agent-token-server-001',
    })
    .returning();

  const [server2] = await db
    .insert(servers)
    .values({
      tenantId: alice.id,
      name: 'DigitalOcean Staging',
      ip: '167.172.5.42',
      sshPort: 22,
      sshUser: 'unplughq',
      sshKeyEncrypted: 'encrypted:aes-256-gcm:base64-placeholder-for-dev',
      status: 'connecting',
      osName: null,
      cpuCores: null,
      ramGb: null,
      diskGb: null,
      apiToken: 'dev-agent-token-server-002',
    })
    .returning();

  const [bobServer] = await db
    .insert(servers)
    .values({
      tenantId: bob.id,
      name: "Bob's VPS",
      ip: '203.0.113.10',
      sshPort: 2222,
      sshUser: 'unplughq',
      status: 'provisioned',
      osName: 'Debian 12',
      cpuCores: 2,
      ramGb: 4,
      diskGb: 40,
      apiToken: 'dev-agent-token-server-003',
    })
    .returning();

  console.log(`  ✓ Servers: ${server1.name} (${server1.id}), ${server2.name} (${server2.id}), ${bobServer.name} (${bobServer.id})`);

  // --- Catalog Apps ---
  await db.insert(catalogApps).values(catalogAppSeed);
  console.log(`  ✓ Catalog apps: ${catalogAppSeed.length} seeded`);

  // --- Deployments ---
  const [nextcloud] = await db
    .insert(deployments)
    .values({
      tenantId: alice.id,
      serverId: server1.id,
      catalogAppId: 'nextcloud',
      name: 'Nextcloud',
      domain: 'cloud.alice-dev.example.com',
      accessUrl: 'https://cloud.alice-dev.example.com',
      status: 'running',
      containerName: 'unplughq-nextcloud',
      config: {
        domain: 'cloud.alice-dev.example.com',
        adminEmail: 'alice@example.com',
      },
    })
    .returning();

  const [plausible] = await db
    .insert(deployments)
    .values({
      tenantId: alice.id,
      serverId: server1.id,
      catalogAppId: 'plausible',
      name: 'Plausible Analytics',
      domain: 'analytics.alice-dev.example.com',
      accessUrl: 'https://analytics.alice-dev.example.com',
      status: 'running',
      containerName: 'unplughq-plausible',
      config: {
        domain: 'analytics.alice-dev.example.com',
        adminEmail: 'alice@example.com',
      },
    })
    .returning();

  const [vaultwarden] = await db
    .insert(deployments)
    .values({
      tenantId: bob.id,
      serverId: bobServer.id,
      catalogAppId: 'vaultwarden',
      name: 'Vaultwarden',
      domain: 'vault.bob-dev.example.com',
      accessUrl: 'https://vault.bob-dev.example.com',
      status: 'running',
      containerName: 'unplughq-vaultwarden',
      config: {
        domain: 'vault.bob-dev.example.com',
        adminEmail: 'bob@example.com',
      },
    })
    .returning();

  console.log(`  ✓ Deployments: ${nextcloud.name}, ${plausible.name}, ${vaultwarden.name}`);

  // --- Alerts ---
  await db.insert(alerts).values([
    {
      tenantId: alice.id,
      serverId: server1.id,
      appId: null,
      severity: 'warning',
      type: 'disk-critical',
      message: 'Disk usage at 87% on Hetzner Dev Box',
      notificationSent: true,
    },
    {
      tenantId: alice.id,
      serverId: server1.id,
      appId: nextcloud.id,
      severity: 'info',
      type: 'app-unavailable',
      message: 'Nextcloud container restarted automatically',
      notificationSent: true,
      acknowledgedAt: new Date(),
    },
  ]);

  console.log('  ✓ Alerts: 2 sample alerts');

  // --- Audit Log ---
  await db.insert(auditLog).values([
    {
      tenantId: alice.id,
      action: 'server.provision',
      targetType: 'server',
      targetId: server1.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Seed Script)',
      details: { osDetected: 'Ubuntu 24.04 LTS', cpuCores: 4, ramGb: 8 },
    },
    {
      tenantId: alice.id,
      action: 'deployment.create',
      targetType: 'deployment',
      targetId: nextcloud.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Seed Script)',
      details: { catalogAppId: 'nextcloud', domain: 'cloud.alice-dev.example.com' },
    },
    {
      tenantId: alice.id,
      action: 'deployment.create',
      targetType: 'deployment',
      targetId: plausible.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Seed Script)',
      details: { catalogAppId: 'plausible', domain: 'analytics.alice-dev.example.com' },
    },
    {
      tenantId: bob.id,
      action: 'server.provision',
      targetType: 'server',
      targetId: bobServer.id,
      ipAddress: '10.0.0.5',
      userAgent: 'Mozilla/5.0 (Seed Script)',
      details: { osDetected: 'Debian 12', cpuCores: 2, ramGb: 4 },
    },
  ]);

  console.log('  ✓ Audit log: 4 entries');

  // --- Metrics Snapshots ---
  const now = Date.now();
  const metricsValues = [];
  for (let i = 0; i < 10; i++) {
    metricsValues.push({
      serverId: server1.id,
      timestamp: new Date(now - i * 30_000), // every 30 seconds
      tenantId: alice.id,
      cpuPercent: 25 + Math.random() * 40,
      ramUsedBytes: BigInt(3_500_000_000 + Math.floor(Math.random() * 1_000_000_000)),
      ramTotalBytes: BigInt(8_589_934_592),
      diskUsedBytes: BigInt(55_000_000_000 + Math.floor(Math.random() * 5_000_000_000)),
      diskTotalBytes: BigInt(85_899_345_920),
      networkRxBytesPerSec: BigInt(Math.floor(Math.random() * 5_000_000)),
      networkTxBytesPerSec: BigInt(Math.floor(Math.random() * 2_000_000)),
      containers: [
        { id: 'abc123', name: 'unplughq-nextcloud', status: 'running', diskUsageBytes: 2_500_000_000 },
        { id: 'def456', name: 'unplughq-plausible', status: 'running', diskUsageBytes: 800_000_000 },
        { id: 'ghi789', name: 'unplughq-caddy', status: 'running' },
        { id: 'jkl012', name: 'unplughq-monitor', status: 'running' },
      ],
    });
  }

  await db.insert(metricsSnapshots).values(metricsValues);
  console.log('  ✓ Metrics snapshots: 10 entries for server1');

  console.log('\n✅ Seed complete!');
  await client.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
