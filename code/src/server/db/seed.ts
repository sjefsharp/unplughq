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
import {
  users,
  sessions,
  servers,
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
