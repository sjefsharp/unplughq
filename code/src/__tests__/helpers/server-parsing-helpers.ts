/**
 * Server Parsing Helpers — OS detection and resource parsing for unit tests.
 * Pure functions, no external dependencies.
 */

// --- OS Detection ---

export function parseOSRelease(output: string): {
  prettyName: string;
  versionId: string;
  id: string;
} {
  if (!output || output.trim().length === 0) {
    return { prettyName: 'Unknown', versionId: '', id: 'unknown' };
  }

  const lines = output.split('\n');
  let prettyName = 'Unknown';
  let versionId = '';
  let id = 'unknown';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('PRETTY_NAME=')) {
      prettyName = trimmed.replace('PRETTY_NAME=', '').replace(/"/g, '');
    } else if (trimmed.startsWith('VERSION_ID=')) {
      versionId = trimmed.replace('VERSION_ID=', '').replace(/"/g, '');
    } else if (trimmed.startsWith('ID=')) {
      id = trimmed.replace('ID=', '').replace(/"/g, '');
    }
  }

  return { prettyName, versionId, id };
}

const SUPPORTED_OS: Record<string, string> = {
  ubuntu: '22.04',
  debian: '11',
};

export function isSupportedOS(os: { id: string; versionId: string }): boolean {
  const minVersion = SUPPORTED_OS[os.id];
  if (!minVersion) return false;
  if (!os.versionId) return false;

  return parseFloat(os.versionId) >= parseFloat(minVersion);
}

// --- Resource Detection ---

export function parseCpuInfo(output: string): { cpuCores: number } {
  const parsed = parseInt(output.trim(), 10);
  return { cpuCores: isNaN(parsed) ? 0 : parsed };
}

export function parseMemInfo(output: string): { ramGb: number } {
  // Parse MemTotal from /proc/meminfo format: "MemTotal:        8388608 kB"
  const match = output.match(/MemTotal:\s+(\d+)\s+kB/);
  if (!match) return { ramGb: 0 };
  return { ramGb: parseInt(match[1], 10) / (1024 * 1024) };
}

export function parseDiskInfo(output: string): { diskGb: number } {
  // Parse df output: second line, first numeric column is 1K-blocks
  const lines = output.trim().split('\n');
  if (lines.length < 2) return { diskGb: 0 };
  const parts = lines[1].trim().split(/\s+/);
  if (parts.length < 2) return { diskGb: 0 };
  const blocks = parseInt(parts[1], 10); // 1K-blocks
  return { diskGb: blocks / (1024 * 1024) };
}

export function checkCompatibility(
  resources: { cpuCores: number; ramGb: number; diskGb: number },
  requirements: { minCpuCores: number; minRamGb: number; minDiskGb: number },
): { compatible: boolean; warnings: string[]; blockers: string[] } {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (resources.cpuCores < requirements.minCpuCores) {
    blockers.push(
      `CPU: ${resources.cpuCores} cores available, ${requirements.minCpuCores} required`,
    );
  }
  if (resources.ramGb < requirements.minRamGb) {
    blockers.push(
      `RAM: ${resources.ramGb}GB available, ${requirements.minRamGb}GB required`,
    );
  }
  if (resources.diskGb < requirements.minDiskGb) {
    blockers.push(
      `Disk: ${resources.diskGb}GB available, ${requirements.minDiskGb}GB required`,
    );
  }

  // Tight resource warnings (within 20% of minimum)
  if (blockers.length === 0) {
    if (resources.cpuCores <= requirements.minCpuCores * 1.2) {
      warnings.push('CPU resources are tight');
    }
    if (resources.ramGb <= requirements.minRamGb * 1.2) {
      warnings.push('RAM resources are tight');
    }
    if (resources.diskGb <= requirements.minDiskGb * 1.2) {
      warnings.push('Disk resources are tight');
    }
  }

  return { compatible: blockers.length === 0, warnings, blockers };
}
