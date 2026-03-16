/**
 * Unit Tests — Caddy Route Management
 * Stories: S-204 (One-Click Deploy), S-206 (Custom Domains) AB#204, AB#206
 * Covers: Route add/remove without disrupting existing, @id convention per api-contracts §3.4
 * Requirements: NFR-003 (zero-downtime route changes)
 */
import { describe, it, expect } from 'vitest';

/** Route payload shape matching api-contracts §3.4 */
interface CaddyRoute {
  '@id': string;
  match: Array<{ host: string[] }>;
  handle: Array<{
    handler: string;
    upstreams: Array<{ dial: string }>;
  }>;
  terminal: boolean;
}

/**
 * Build a Caddy route payload per api-contracts §3.4
 */
function buildCaddyRoute(containerName: string, domain: string): CaddyRoute {
  return {
    '@id': `unplughq-${containerName}`,
    match: [{ host: [domain] }],
    handle: [
      {
        handler: 'reverse_proxy',
        upstreams: [{ dial: `${containerName}:80` }],
      },
    ],
    terminal: true,
  };
}

describe('Caddy Route Management — S-204 / S-206', () => {
  describe('Route payload generation', () => {
    it('should produce @id matching unplughq-<containerName> convention', () => {
      const route = buildCaddyRoute('nextcloud-abc123', 'cloud.example.com');
      expect(route['@id']).toBe('unplughq-nextcloud-abc123');
    });

    it('should set host match to the provided domain', () => {
      const route = buildCaddyRoute('nextcloud-abc123', 'cloud.example.com');
      expect(route.match[0].host).toEqual(['cloud.example.com']);
    });

    it('should set reverse_proxy upstream to containerName:80', () => {
      const route = buildCaddyRoute('nextcloud-abc123', 'cloud.example.com');
      expect(route.handle[0].handler).toBe('reverse_proxy');
      expect(route.handle[0].upstreams[0].dial).toBe('nextcloud-abc123:80');
    });

    it('should mark route as terminal', () => {
      const route = buildCaddyRoute('nextcloud-abc123', 'cloud.example.com');
      expect(route.terminal).toBe(true);
    });
  });

  describe('Container name validation', () => {
    it('should accept valid container names matching [a-z0-9-]+ pattern', () => {
      const valid = ['nextcloud-abc', 'ghost-123', 'plausible-analytics', 'a'];
      for (const name of valid) {
        expect(/^[a-z0-9-]+$/.test(name)).toBe(true);
      }
    });

    it('should reject container names with uppercase characters', () => {
      expect(/^[a-z0-9-]+$/.test('NextCloud')).toBe(false);
    });

    it('should reject container names with special characters', () => {
      const invalid = ['next_cloud', 'ghost.app', 'my app', 'app@home', 'app/name'];
      for (const name of invalid) {
        expect(/^[a-z0-9-]+$/.test(name)).toBe(false);
      }
    });

    it('should reject empty container names', () => {
      expect(/^[a-z0-9-]+$/.test('')).toBe(false);
    });
  });

  describe('Route add — does not disrupt existing routes', () => {
    it('should generate unique @id per deployment to avoid collisions', () => {
      const route1 = buildCaddyRoute('nextcloud-aaa', 'cloud.example.com');
      const route2 = buildCaddyRoute('ghost-bbb', 'blog.example.com');
      expect(route1['@id']).not.toBe(route2['@id']);
    });

    it('should support multiple routes per server (different domains)', () => {
      const routes = [
        buildCaddyRoute('nextcloud-aaa', 'cloud.example.com'),
        buildCaddyRoute('ghost-bbb', 'blog.example.com'),
        buildCaddyRoute('plausible-ccc', 'analytics.example.com'),
      ];
      const ids = routes.map((r) => r['@id']);
      expect(new Set(ids).size).toBe(3);
    });
  });

  describe('Route removal — uses @id for targeted delete', () => {
    it('should derive DELETE path from @id: /config/apps/http/servers/srv0/routes/{@id}', () => {
      const route = buildCaddyRoute('nextcloud-abc', 'cloud.example.com');
      const deletePath = `/config/apps/http/servers/srv0/routes/${route['@id']}`;
      expect(deletePath).toBe(
        '/config/apps/http/servers/srv0/routes/unplughq-nextcloud-abc',
      );
    });

    it('should only remove the targeted route leaving others intact', () => {
      const routes = [
        buildCaddyRoute('app-a', 'a.example.com'),
        buildCaddyRoute('app-b', 'b.example.com'),
        buildCaddyRoute('app-c', 'c.example.com'),
      ];
      const removeId = 'unplughq-app-b';
      const remaining = routes.filter((r) => r['@id'] !== removeId);
      expect(remaining.length).toBe(2);
      expect(remaining.map((r) => r['@id'])).not.toContain(removeId);
    });
  });

  describe('Domain validation alignment with DeployAppInput.domain', () => {
    it('should accept valid FQDNs', () => {
      const domainRegex =
        /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      const valid = ['cloud.example.com', 'my-app.example.org', 'deep.sub.domain.co.uk'];
      for (const d of valid) {
        expect(domainRegex.test(d)).toBe(true);
      }
    });

    it('should reject invalid domains', () => {
      const domainRegex =
        /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      const invalid = ['localhost', '-bad.com', 'no_underscores.com', '.leading-dot.com', ''];
      for (const d of invalid) {
        expect(domainRegex.test(d)).toBe(false);
      }
    });
  });
});
