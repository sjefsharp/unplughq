/**
 * Unit Tests — Resource Detection Parsing
 * Story: S-199 (Server Validation & Compatibility Check) AB#199
 * Covers: CPU, RAM, disk parsing from SSH stdout, compatibility checks
 */
import { describe, it, expect } from 'vitest';
import { resourceDetectionOutputs, createCatalogApp } from '../helpers/test-fixtures';

// import { parseResourceInfo, checkCompatibility } from '@/server/services/ssh/resource-detection';

describe('Resource Detection Parsing — S-199', () => {
  describe('Parse Resource Output — S-199 Scenario: OS and resource detection', () => {
    it('should parse CPU core count from nproc output', () => {
      const result = parseCpuInfo('4');
      expect(result.cpuCores).toBe(4);
    });

    it('should parse RAM from /proc/meminfo output', () => {
      const meminfo = 'MemTotal:        8388608 kB\nMemFree:         4194304 kB';
      const result = parseMemInfo(meminfo);
      expect(result.ramGb).toBeCloseTo(8, 0);
    });

    it('should parse disk space from df output', () => {
      const dfOutput = 'Filesystem     1K-blocks      Used Available Use% Mounted on\n/dev/vda1     167772160  26214400 141557760  16% /';
      const result = parseDiskInfo(dfOutput);
      expect(result.diskGb).toBeCloseTo(160, 0);
    });

    it('should handle zero or missing values gracefully', () => {
      expect(parseCpuInfo('')).toEqual({ cpuCores: 0 });
      expect(parseCpuInfo('not-a-number')).toEqual({ cpuCores: 0 });
    });
  });

  describe('Compatibility Check — S-199 Scenarios: Compatible/Incompatible/Partial server', () => {
    it('should pass compatibility check for server meeting all requirements', () => {
      const resources = resourceDetectionOutputs.adequate;
      const result = checkCompatibility(resources, { minCpuCores: 2, minRamGb: 4, minDiskGb: 20 });

      expect(result.compatible).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.blockers).toHaveLength(0);
    });

    it('should fail compatibility check for server not meeting minimum requirements', () => {
      const resources = resourceDetectionOutputs.insufficient;
      const result = checkCompatibility(resources, { minCpuCores: 2, minRamGb: 4, minDiskGb: 20 });

      expect(result.compatible).toBe(false);
      expect(result.blockers.length).toBeGreaterThan(0);
    });

    it('should produce warnings for server meeting minimums but tight on resources', () => {
      const resources = resourceDetectionOutputs.minimal;
      const result = checkCompatibility(resources, { minCpuCores: 1, minRamGb: 1, minDiskGb: 10 });

      expect(result.compatible).toBe(true);
      // Resources are at the boundary — may produce warnings about tight margins
    });

    it('should check against app-specific minimum requirements from catalog', () => {
      const app = createCatalogApp({ minCpuCores: 2, minRamGb: 4, minDiskGb: 20 });
      const resources = resourceDetectionOutputs.adequate;
      const result = checkCompatibility(resources, {
        minCpuCores: app.minCpuCores,
        minRamGb: app.minRamGb,
        minDiskGb: app.minDiskGb,
      });

      expect(result.compatible).toBe(true);
    });
  });
});

// Stub declarations
declare function parseCpuInfo(output: string): { cpuCores: number };
declare function parseMemInfo(output: string): { ramGb: number };
declare function parseDiskInfo(output: string): { diskGb: number };
declare function checkCompatibility(
  resources: { cpuCores: number; ramGb: number; diskGb: number },
  requirements: { minCpuCores: number; minRamGb: number; minDiskGb: number },
): { compatible: boolean; warnings: string[]; blockers: string[] };
