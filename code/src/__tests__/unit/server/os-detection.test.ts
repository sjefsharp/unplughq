/**
 * Unit Tests — OS Detection Parsing
 * Story: S-199 (Server Validation & Compatibility Check) AB#199
 * Covers: Parsing /etc/os-release output, supported OS validation
 */
import { describe, it, expect } from 'vitest';
import { osDetectionOutputs } from '../../helpers/test-fixtures';
import { parseOSRelease, isSupportedOS } from '../../helpers/server-parsing-helpers';

describe('OS Detection Parsing — S-199', () => {
  describe('Parse /etc/os-release — S-199 Scenario: OS and resource detection', () => {
    it('should parse Ubuntu 24.04 LTS correctly', () => {
      const result = parseOSRelease(osDetectionOutputs.ubuntu2404);
      expect(result.prettyName).toBe('Ubuntu 24.04 LTS');
      expect(result.versionId).toBe('24.04');
      expect(result.id).toBe('ubuntu');
    });

    it('should parse Debian 12 correctly', () => {
      const result = parseOSRelease(osDetectionOutputs.debian12);
      expect(result.prettyName).toBe('Debian GNU/Linux 12 (bookworm)');
      expect(result.versionId).toBe('12');
      expect(result.id).toBe('debian');
    });

    it('should parse CentOS Stream 9 correctly', () => {
      const result = parseOSRelease(osDetectionOutputs.centos9);
      expect(result.prettyName).toBe('CentOS Stream 9');
      expect(result.versionId).toBe('9');
      expect(result.id).toBe('centos');
    });

    it('should handle malformed os-release output gracefully', () => {
      const result = parseOSRelease(osDetectionOutputs.malformed);
      expect(result.prettyName).toBe('Unknown');
      expect(result.id).toBe('unknown');
    });

    it('should handle empty os-release output', () => {
      const result = parseOSRelease('');
      expect(result.prettyName).toBe('Unknown');
      expect(result.id).toBe('unknown');
    });
  });

  describe('Supported OS Validation — S-199 Scenario: Compatible / Incompatible server', () => {
    it('should accept Ubuntu 22.04+ as supported', () => {
      expect(isSupportedOS({ id: 'ubuntu', versionId: '22.04' })).toBe(true);
      expect(isSupportedOS({ id: 'ubuntu', versionId: '24.04' })).toBe(true);
    });

    it('should accept Debian 11+ as supported', () => {
      expect(isSupportedOS({ id: 'debian', versionId: '11' })).toBe(true);
      expect(isSupportedOS({ id: 'debian', versionId: '12' })).toBe(true);
    });

    it('should flag unsupported distributions', () => {
      expect(isSupportedOS({ id: 'arch', versionId: '' })).toBe(false);
    });

    it('should flag unknown OS as unsupported', () => {
      expect(isSupportedOS({ id: 'unknown', versionId: '' })).toBe(false);
    });
  });
});


