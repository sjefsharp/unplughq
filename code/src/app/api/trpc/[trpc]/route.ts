import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/router';
import { auth } from '@/server/auth';
import type { SubscriptionTier } from '@/server/db/schema';

const handler = async (req: Request) => {
  const session = await auth();

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({
      session,
      userId: session?.user?.id ?? null,
      tenantId: session?.user?.id ?? null,
      tier: (session?.user as { tier?: SubscriptionTier } | undefined)?.tier ?? null,
    }),
  });
};

export { handler as GET, handler as POST };
