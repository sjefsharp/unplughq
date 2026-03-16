/**
 * Catalog Mock Helpers — in-memory catalog data layer for unit/integration tests.
 * Based on api-contracts.md §1.3 (app router) and §2.3 (catalog schemas).
 */
import { createCatalogApp } from './test-fixtures';

const catalogEntries = [
  createCatalogApp({ id: 'nextcloud', name: 'Nextcloud', category: 'File Storage', version: '28.0.3', minCpuCores: 2, minRamGb: 4, minDiskGb: 20 }),
  createCatalogApp({ id: 'vaultwarden', name: 'Vaultwarden', category: 'Password Management', version: '1.30.5', minCpuCores: 1, minRamGb: 1, minDiskGb: 5, configSchema: [{ key: 'adminEmail', label: 'Admin Email', type: 'email' as const, required: true }] }),
  createCatalogApp({ id: 'ghost', name: 'Ghost', category: 'CMS', version: '5.82.0', minCpuCores: 1, minRamGb: 2, minDiskGb: 10 }),
  createCatalogApp({ id: 'plausible', name: 'Plausible Analytics', category: 'Analytics', version: '2.0.0', minCpuCores: 2, minRamGb: 4, minDiskGb: 15 }),
  createCatalogApp({ id: 'immich', name: 'Immich', category: 'Photo Storage', version: '1.99.0', minCpuCores: 4, minRamGb: 8, minDiskGb: 50 }),
  createCatalogApp({ id: 'mailu', name: 'Mailu', category: 'Email', version: '2.0.36', minCpuCores: 2, minRamGb: 4, minDiskGb: 20 }),
  createCatalogApp({ id: 'gitea', name: 'Gitea', category: 'Development', version: '1.22.0', minCpuCores: 1, minRamGb: 2, minDiskGb: 10 }),
  createCatalogApp({ id: 'wordpress', name: 'WordPress', category: 'CMS', version: '6.5.0', minCpuCores: 1, minRamGb: 2, minDiskGb: 10 }),
  createCatalogApp({ id: 'bookstack', name: 'BookStack', category: 'CMS', version: '24.02', minCpuCores: 1, minRamGb: 2, minDiskGb: 10 }),
  createCatalogApp({ id: 'freshrss', name: 'FreshRSS', category: 'File Storage', version: '1.24.0', minCpuCores: 1, minRamGb: 1, minDiskGb: 5 }),
  createCatalogApp({ id: 'syncthing', name: 'Syncthing', category: 'File Storage', version: '1.27.0', minCpuCores: 1, minRamGb: 1, minDiskGb: 10 }),
  createCatalogApp({ id: 'uptime-kuma', name: 'Uptime Kuma', category: 'Analytics', version: '1.23.0', minCpuCores: 1, minRamGb: 1, minDiskGb: 5 }),
  createCatalogApp({ id: 'n8n', name: 'n8n', category: 'Development', version: '1.30.0', minCpuCores: 2, minRamGb: 4, minDiskGb: 15 }),
  createCatalogApp({ id: 'jellyfin', name: 'Jellyfin', category: 'Photo Storage', version: '10.9.0', minCpuCores: 4, minRamGb: 8, minDiskGb: 50 }),
  createCatalogApp({ id: 'paperless-ngx', name: 'Paperless-ngx', category: 'File Storage', version: '2.6.0', minCpuCores: 2, minRamGb: 4, minDiskGb: 20 }),
  createCatalogApp({ id: 'homer', name: 'Homer', category: 'Development', version: '24.02.1', minCpuCores: 1, minRamGb: 1, minDiskGb: 5 }),
];

export function getCatalogEntries() {
  return [...catalogEntries];
}

export function getCatalogEntry(id: string) {
  return catalogEntries.find((e) => e.id === id) ?? null;
}

export function filterByCategory(category: string) {
  return catalogEntries.filter((e) => e.category === category);
}

export function searchCatalog(query: string) {
  const q = query.toLowerCase();
  return catalogEntries.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q),
  );
}

export function getCategories(): string[] {
  return [...new Set(catalogEntries.map((e) => e.category))];
}
