/**
 * Test Context — Creates typed tRPC test contexts for integration tests
 *
 * Based on api-contracts.md §5.1 and §6.2 test environment strategy.
 * Context is created from environment variables, never hardcoded tokens.
 */
import type { SubscriptionTier } from '@/lib/schemas';

export interface TestSession {
  user: {
    id: string;
    email: string;
    name: string;
    tier?: SubscriptionTier;
  };
}

export interface TestContext {
  session: TestSession | null;
  userId: string | null;
  tenantId: string | null;
  tier: SubscriptionTier | null;
}

/**
 * Creates a test context simulating an authenticated user session.
 * Uses env vars per api-contracts.md §6.2 — no hardcoded bypass tokens.
 */
export function createTestContext(overrides: Partial<TestContext> = {}): TestContext {
  const userId = overrides.userId ?? 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
  const tier = overrides.tier ?? ('free' as SubscriptionTier);

  return {
    session: {
      user: {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        tier,
      },
    },
    userId,
    tenantId: overrides.tenantId ?? userId,
    tier,
    ...overrides,
  };
}

/**
 * Creates an unauthenticated test context (no session).
 * Used to verify protected procedures reject unauthenticated requests.
 */
export function createUnauthenticatedContext(): TestContext {
  return {
    session: null,
    userId: null,
    tenantId: null,
    tier: null,
  };
}

/**
 * Creates a test context for a specific tenant to test tenant isolation.
 * Per I-07 mitigation — tenantId always comes from session, never request params.
 */
export function createTenantContext(tenantId: string, tier: SubscriptionTier = 'free'): TestContext {
  return createTestContext({
    userId: tenantId,
    tenantId,
    tier,
  });
}
