/**
 * Unit Tests — Catalog Service
 * Story: S-202 (Application Catalog Browsing) AB#202
 * Covers: Schema validation, category filtering, search matching, catalog completeness (≥15 apps)
 * Requirements: FR-F2-001, FR-F2-002, BR-F2-001
 */
import { describe, it, expect } from 'vitest';
import { CatalogApp } from '@/lib/schemas';
import { createCatalogApp } from '../../helpers/test-fixtures';
import {
  getCatalogEntries,
  getCatalogEntry,
  filterByCategory,
  searchCatalog,
  getCategories,
} from '../../helpers/catalog-helpers';

describe('Catalog Service — S-202', () => {
  describe('Scenario: Catalog entry completeness — FR-F2-001', () => {
    it('should contain at least 15 curated apps', () => {
      const entries = getCatalogEntries();
      expect(entries.length).toBeGreaterThanOrEqual(15);
    });

    it('should include required categories: File Storage, Analytics, CMS, Password Management, Email, Photo Storage', () => {
      const categories = getCategories();
      const requiredCategories = [
        'File Storage',
        'Analytics',
        'CMS',
        'Password Management',
        'Email',
        'Photo Storage',
      ];
      for (const required of requiredCategories) {
        expect(categories).toContain(required);
      }
    });

    it('each entry should contain: name, description, category, min resources, upstream URL', () => {
      const entries = getCatalogEntries();
      for (const entry of entries) {
        expect(entry.name).toBeTruthy();
        expect(entry.description).toBeTruthy();
        expect(entry.category).toBeTruthy();
        expect(entry.minCpuCores).toBeGreaterThanOrEqual(0);
        expect(entry.minRamGb).toBeGreaterThanOrEqual(0);
        expect(entry.minDiskGb).toBeGreaterThanOrEqual(0);
        expect(entry.upstreamUrl).toMatch(/^https?:\/\//);
      }
    });

    it('each entry should have a pinned image digest (T-03 — prevent catalog tampering)', () => {
      const entries = getCatalogEntries();
      for (const entry of entries) {
        expect(entry.imageDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
      }
    });
  });

  describe('Scenario: CatalogApp schema validation — api-contracts §2.3', () => {
    it('should accept a valid CatalogApp object', () => {
      const app = createCatalogApp();
      const result = CatalogApp.safeParse(app);
      expect(result.success).toBe(true);
    });

    it('should reject CatalogApp missing required id', () => {
      const { id: _, ...noId } = createCatalogApp();
      const result = CatalogApp.safeParse(noId);
      expect(result.success).toBe(false);
    });

    it('should reject CatalogApp with invalid upstream URL', () => {
      const app = createCatalogApp({ upstreamUrl: 'not-a-url' });
      const result = CatalogApp.safeParse(app);
      expect(result.success).toBe(false);
    });

    it('should reject CatalogApp with invalid imageDigest format', () => {
      const app = createCatalogApp({ imageDigest: 'md5:abc123' });
      const result = CatalogApp.safeParse(app);
      expect(result.success).toBe(false);
    });

    it('should reject CatalogApp with configSchema having invalid field type', () => {
      const app = createCatalogApp({
        configSchema: [
          { key: 'test', label: 'Test', type: 'invalid', required: true },
        ],
      });
      const result = CatalogApp.safeParse(app);
      expect(result.success).toBe(false);
    });

    it('should accept configSchema with all valid field types', () => {
      const validTypes = ['text', 'email', 'password', 'select', 'boolean'] as const;
      for (const type of validTypes) {
        const app = createCatalogApp({
          configSchema: [{ key: 'field', label: 'Field', type, required: false }],
        });
        const result = CatalogApp.safeParse(app);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Scenario: Browse catalog by category — FR-F2-002', () => {
    it('should filter entries by category', () => {
      const fileStorageApps = filterByCategory('File Storage');
      expect(fileStorageApps.length).toBeGreaterThan(0);
      for (const app of fileStorageApps) {
        expect(app.category).toBe('File Storage');
      }
    });

    it('should return empty array for non-existent category', () => {
      const results = filterByCategory('Non-Existent Category');
      expect(results).toEqual([]);
    });
  });

  describe('Scenario: Search for apps', () => {
    it('should match apps by name (case-insensitive)', () => {
      const results = searchCatalog('nextcloud');
      expect(results.some((r) => r.id === 'nextcloud')).toBe(true);
    });

    it('should match apps by description', () => {
      const results = searchCatalog('productivity');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should match apps by category name', () => {
      const results = searchCatalog('Analytics');
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.category === 'Analytics' || r.description.toLowerCase().includes('analytics'))).toBe(true);
    });

    it('should return empty results for no matches', () => {
      const results = searchCatalog('zzzznonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('Scenario: Catalog browsing without a server', () => {
    it('should return catalog entries without requiring authentication', () => {
      const entries = getCatalogEntries();
      expect(entries.length).toBeGreaterThanOrEqual(15);
    });

    it('should return a specific catalog entry by id', () => {
      const entry = getCatalogEntry('nextcloud');
      expect(entry).not.toBeNull();
      expect(entry!.name).toBe('Nextcloud');
    });

    it('should return null for non-existent catalog app', () => {
      const entry = getCatalogEntry('does-not-exist');
      expect(entry).toBeNull();
    });
  });
});
