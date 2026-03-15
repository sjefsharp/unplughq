/**
 * Test Fixtures — Shared test data for UnplugHQ test contracts
 *
 * Provides factory functions for creating test data that matches
 * the Zod schemas defined in api-contracts.md.
 */

// Valid user fixtures
export const validUser = {
  email: 'alice@example.com',
  password: 'SecureP@ssw0rd123',
  name: 'Alice Johnson',
} as const;

export const validUser2 = {
  email: 'bob@example.com',
  password: 'An0therStr0ng!Pass',
  name: 'Bob Smith',
} as const;

// Password variants for strength testing
export const passwords = {
  valid: 'SecureP@ssw0rd123',
  tooShort: 'Short1!',            // < 12 chars
  noUppercase: 'nouppercase1!',   // no uppercase
  noLowercase: 'NOLOWERCASE1!',   // no lowercase
  noNumberOrSymbol: 'NoNumberOrSymbol', // no number/symbol
  minLength: 'ValidPass12!',      // exactly 12 chars
  veryStrong: 'V3ry$tr0ng&Secure!Pass99',
} as const;

// Email variants for validation testing
export const emails = {
  valid: 'user@example.com',
  validWithPlus: 'user+tag@example.com',
  validSubdomain: 'user@sub.example.com',
  noAt: 'userexample.com',
  noDomain: 'user@',
  noLocal: '@example.com',
  doubleDot: 'user@example..com',
  spaces: 'user @example.com',
  empty: '',
} as const;

// Server connection fixtures
export const validServerConnect = {
  name: 'My Production VPS',
  ip: '203.0.113.42',
  sshPort: 22,
  sshUser: 'unplughq',
} as const;

export const serverIPs = {
  validIPv4: '203.0.113.42',
  validIPv4Private: '192.168.1.100',
  invalidFormat: '999.999.999.999',
  invalidLetters: 'abc.def.ghi.jkl',
  localhost: '127.0.0.1',
  empty: '',
  // IPv6 not yet supported per ServerConnectInput schema (v4 only)
} as const;

// Server record fixture matching ServerRecord schema
export function createServerRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    name: 'Production VPS',
    ip: '203.0.113.42',
    sshPort: 22,
    status: 'provisioned' as const,
    osName: 'Ubuntu 24.04 LTS',
    cpuCores: 4,
    ramGb: 8,
    diskGb: 160,
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-15T10:05:00.000Z',
    ...overrides,
  };
}

// Tenant IDs for isolation testing
export const tenants = {
  tenantA: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
  tenantB: 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
} as const;

// Deployment fixtures matching DeployAppInput schema
export const validDeployment = {
  catalogAppId: 'nextcloud',
  serverId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  domain: 'cloud.example.com',
  config: {
    adminEmail: 'admin@example.com',
    adminPassword: 'NextcloudAdmin123!',
  },
} as const;

// Domain validation fixtures
export const domains = {
  valid: 'cloud.example.com',
  validSubdomain: 'app.sub.example.com',
  validShort: 'a.co',
  invalidNoTLD: 'localhost',
  invalidTrailingDot: 'example.com.',
  invalidLeadingHyphen: '-example.com',
  invalidSpecialChars: 'exam!ple.com',
  empty: '',
} as const;

// Catalog app fixture matching CatalogApp schema
export function createCatalogApp(overrides: Record<string, unknown> = {}) {
  return {
    id: 'nextcloud',
    name: 'Nextcloud',
    description: 'Self-hosted productivity platform',
    category: 'File Storage',
    version: '28.0.3',
    minCpuCores: 2,
    minRamGb: 4,
    minDiskGb: 20,
    upstreamUrl: 'https://nextcloud.com',
    imageDigest: 'sha256:' + 'a'.repeat(64),
    configSchema: [
      { key: 'adminEmail', label: 'Admin Email', type: 'email' as const, required: true },
      { key: 'adminPassword', label: 'Admin Password', type: 'password' as const, required: true },
    ],
    ...overrides,
  };
}

// Metrics snapshot fixture matching MetricsSnapshot schema
export function createMetricsSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    serverId: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    timestamp: '2026-03-15T10:30:00.000Z',
    cpuPercent: 45.2,
    ramUsedBytes: 4_294_967_296,
    ramTotalBytes: 8_589_934_592,
    diskUsedBytes: 53_687_091_200,
    diskTotalBytes: 171_798_691_840,
    networkRxBytesPerSec: 125_000,
    networkTxBytesPerSec: 62_500,
    containers: [
      { id: 'abc123', name: 'nextcloud', status: 'running' as const },
      { id: 'def456', name: 'caddy', status: 'running' as const },
    ],
    ...overrides,
  };
}

// SSH command injection attack vectors (T-01 testing)
export const injectionPayloads = {
  semicolonCmd: 'myserver; rm -rf /',
  pipeCmd: 'myserver | cat /etc/passwd',
  backtickCmd: 'myserver `whoami`',
  dollarCmd: 'myserver $(id)',
  newlineCmd: 'myserver\nwhoami',
  ampersandCmd: 'myserver && cat /etc/shadow',
  redirectCmd: 'myserver > /tmp/pwned',
  singleQuoteBreak: "myserver'; DROP TABLE users; --",
  doubleQuoteBreak: 'myserver"; rm -rf /',
} as const;

// Password reset token fixture
export const resetTokenFixture = {
  validToken: 'a'.repeat(64), // 256 bits hex-encoded
  expiredToken: 'b'.repeat(64),
  usedToken: 'c'.repeat(64),
  invalidToken: 'not-a-valid-token',
  shortToken: 'abc',
} as const;

// Subscription tier fixtures
export const tierLimits = {
  free: { maxServers: 1, maxApps: 3 },
  pro: { maxServers: 10, maxApps: 30 },
  team: { maxServers: Infinity, maxApps: Infinity },
} as const;

// OS detection fixture data (from SSH stdout)
export const osDetectionOutputs = {
  ubuntu2404: 'PRETTY_NAME="Ubuntu 24.04 LTS"\nVERSION_ID="24.04"\nID=ubuntu',
  debian12: 'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"\nVERSION_ID="12"\nID=debian',
  centos9: 'PRETTY_NAME="CentOS Stream 9"\nVERSION_ID="9"\nID=centos',
  unsupported: 'PRETTY_NAME="Arch Linux"\nID=arch',
  malformed: 'not-a-valid-os-release',
} as const;

// Resource detection fixture data (from SSH stdout)
export const resourceDetectionOutputs = {
  adequate: { cpuCores: 4, ramGb: 8, diskGb: 160 },
  minimal: { cpuCores: 1, ramGb: 1, diskGb: 20 },
  insufficient: { cpuCores: 1, ramGb: 0.5, diskGb: 5 },
} as const;
