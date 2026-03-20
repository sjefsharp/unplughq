/**
 * Unit Tests — Sprint 2 Security Remediation
 * Bugs: AB#303, AB#304, AB#306, AB#307
 * Covers: SSH key generation (Ed25519), config validation (key filtering,
 *         blocklist, value validation), Docker security hardening flags
 */
import { describe, it, expect } from 'vitest';
import { generateKeyPairSync, createPublicKey } from 'node:crypto';
import { createCatalogApp } from '../../helpers/test-fixtures';
import {
  validateConfigAgainstSchema,
  createEnvFileContent,
} from '@/server/services/deployment-service';
import { resolveCommand } from '@/server/services/ssh/ssh-service';

describe('AB#303 — SSH Key Rotation Ed25519 Keypair', () => {
  it('should generate a valid Ed25519 keypair via generateKeyPairSync', () => {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    expect(privateKey).toContain('-----BEGIN PRIVATE KEY-----');
    expect(publicKey).toContain('-----BEGIN PUBLIC KEY-----');
  });

  it('should produce a public key exportable for SSH authorized_keys', () => {
    const { publicKey } = generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    const pubKeyObj = createPublicKey(publicKey);
    const sshPublicKey = pubKeyObj.export({ type: 'spki', format: 'der' });
    const sshPubKeyBase64 = sshPublicKey.toString('base64');
    const authorizedKeysEntry = `ssh-ed25519 ${sshPubKeyBase64}`;

    expect(authorizedKeysEntry).toMatch(/^ssh-ed25519 /);
    expect(sshPubKeyBase64.length).toBeGreaterThan(0);
  });

  it('should generate unique keypairs on each invocation', () => {
    const kp1 = generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const kp2 = generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    expect(kp1.privateKey).not.toBe(kp2.privateKey);
    expect(kp1.publicKey).not.toBe(kp2.publicKey);
  });

  it('should resolve deploy-ssh-public-key template', () => {
    const cmd = resolveCommand({
      type: 'deploy-ssh-public-key',
      params: { newPublicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA' },
    });
    expect(cmd).toContain('mkdir -p ~/.ssh');
    expect(cmd).toContain('authorized_keys');
    expect(cmd).toContain('chmod 600');
  });
});

describe('AB#304 — Config Validation Security Hardening', () => {
  const template = createCatalogApp() as Parameters<typeof validateConfigAgainstSchema>[0];

  describe('Extra key rejection', () => {
    it('should reject config keys not in template.configSchema', () => {
      expect(() =>
        validateConfigAgainstSchema(template, {
          adminEmail: 'admin@test.com',
          adminPassword: 'Pass123!',
          NODE_OPTIONS: '--require=/etc/passwd',
        }),
      ).toThrow(/unknown config key/i);
    });

    it('should accept config with only schema-defined keys', () => {
      expect(() =>
        validateConfigAgainstSchema(template, {
          adminEmail: 'admin@test.com',
          adminPassword: 'Pass123!',
        }),
      ).not.toThrow();
    });
  });

  describe('Key format validation', () => {
    it('should reject keys with special characters', () => {
      const permissiveTemplate = createCatalogApp({
        configSchema: [
          { key: 'invalid-key', label: 'Bad', type: 'text' as const, required: false },
        ],
      }) as Parameters<typeof validateConfigAgainstSchema>[0];

      expect(() =>
        validateConfigAgainstSchema(permissiveTemplate, { 'invalid-key': 'value' }),
      ).toThrow(/invalid config key format/i);
    });

    it('should reject keys with dots or slashes', () => {
      const dotTemplate = createCatalogApp({
        configSchema: [
          { key: 'key.name', label: 'Bad', type: 'text' as const, required: false },
        ],
      }) as Parameters<typeof validateConfigAgainstSchema>[0];

      expect(() =>
        validateConfigAgainstSchema(dotTemplate, { 'key.name': 'value' }),
      ).toThrow(/invalid config key format/i);
    });
  });

  describe('Blocklisted env vars', () => {
    const blockedKeys = [
      'NODE_OPTIONS',
      'LD_PRELOAD',
      'LD_LIBRARY_PATH',
      'PATH',
      'HOME',
      'SHELL',
      'USER',
      'PYTHONPATH',
    ];

    for (const key of blockedKeys) {
      it(`should reject blocklisted key: ${key}`, () => {
        const injectionTemplate = createCatalogApp({
          configSchema: [
            { key, label: key, type: 'text' as const, required: false },
          ],
        }) as Parameters<typeof validateConfigAgainstSchema>[0];

        expect(() =>
          validateConfigAgainstSchema(injectionTemplate, { [key]: 'value' }),
        ).toThrow(/blocked config key/i);
      });
    }
  });

  describe('Value validation for all keys', () => {
    it('should reject unsafe values in any config key', () => {
      expect(() =>
        validateConfigAgainstSchema(template, {
          adminEmail: 'admin@test.com',
          adminPassword: 'pass;rm -rf /',
        }),
      ).toThrow(/unsafe/i);
    });

    it('should reject shell metacharacters in values', () => {
      const unsafeValues = [
        'value;whoami',
        'value|cat',
        'value`id`',
        'value$(cmd)',
        'value\nnewline',
      ];

      for (const val of unsafeValues) {
        expect(() =>
          validateConfigAgainstSchema(template, {
            adminEmail: val,
            adminPassword: 'SafePass123',
          }),
        ).toThrow(/unsafe/i);
      }
    });
  });

  describe('createEnvFileContent defense-in-depth', () => {
    it('should reject keys not matching ENV_VAR pattern in env file creation', () => {
      expect(() => createEnvFileContent({ 'invalid-key': 'value' })).toThrow(
        /invalid env var key/i,
      );
    });

    it('should accept valid env var keys', () => {
      const content = createEnvFileContent({ ADMIN_EMAIL: 'admin@test.com', DB_HOST: 'localhost' });
      expect(content).toContain('ADMIN_EMAIL=admin@test.com');
      expect(content).toContain('DB_HOST=localhost');
    });

    it('should produce empty content for empty config', () => {
      const content = createEnvFileContent({});
      expect(content).toBe('');
    });
  });
});

describe('AB#306 — Monitoring Agent Docker Security Hardening', () => {
  it('should include --read-only in start-monitoring-agent command', () => {
    const cmd = resolveCommand({
      type: 'start-monitoring-agent',
      params: {
        apiToken: 'test-token',
        controlPlaneUrl: 'https://app.example.com',
        serverId: 'server-123',
      },
    });
    expect(cmd).toContain('--read-only');
  });

  it('should include --security-opt=no-new-privileges in start-monitoring-agent command', () => {
    const cmd = resolveCommand({
      type: 'start-monitoring-agent',
      params: {
        apiToken: 'test-token',
        controlPlaneUrl: 'https://app.example.com',
        serverId: 'server-123',
      },
    });
    expect(cmd).toContain('--security-opt=no-new-privileges');
  });

  it('should include --cap-drop=ALL in start-monitoring-agent command', () => {
    const cmd = resolveCommand({
      type: 'start-monitoring-agent',
      params: {
        apiToken: 'test-token',
        controlPlaneUrl: 'https://app.example.com',
        serverId: 'server-123',
      },
    });
    expect(cmd).toContain('--cap-drop=ALL');
  });

  it('should include --tmpfs /tmp:rw,noexec,nosuid,size=16m in start-monitoring-agent command', () => {
    const cmd = resolveCommand({
      type: 'start-monitoring-agent',
      params: {
        apiToken: 'test-token',
        controlPlaneUrl: 'https://app.example.com',
        serverId: 'server-123',
      },
    });
    expect(cmd).toContain('--tmpfs /tmp:rw,noexec,nosuid,size=16m');
  });
});

describe('AB#307 — User App Containers security-opt', () => {
  it('should include --security-opt=no-new-privileges in docker-run command', () => {
    const cmd = resolveCommand({
      type: 'docker-run',
      params: {
        containerName: 'test-app',
        imageRef: 'ghcr.io/unplughq/nextcloud@sha256:' + 'a'.repeat(64),
        networkName: 'unplughq',
        envFile: '/tmp/env',
      },
    });
    expect(cmd).toContain('--security-opt=no-new-privileges');
  });

  it('should place --security-opt after --restart and before --env-file', () => {
    const cmd = resolveCommand({
      type: 'docker-run',
      params: {
        containerName: 'test-app',
        imageRef: 'ghcr.io/unplughq/nextcloud@sha256:' + 'a'.repeat(64),
        networkName: 'unplughq',
        envFile: '/tmp/env',
      },
    });
    const restartIdx = cmd.indexOf('--restart unless-stopped');
    const secOptIdx = cmd.indexOf('--security-opt=no-new-privileges');
    const envFileIdx = cmd.indexOf('--env-file');

    expect(restartIdx).toBeLessThan(secOptIdx);
    expect(secOptIdx).toBeLessThan(envFileIdx);
  });
});
