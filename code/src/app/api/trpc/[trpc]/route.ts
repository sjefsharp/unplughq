import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/router';
import { auth } from '@/server/auth';
import type { SubscriptionTier } from '@/server/db/schema';
import {
  createCsrfTokenForSession,
  parseCookieHeader,
  CSRF_COOKIE_NAME,
  serializeCsrfCookie,
} from '@/server/trpc/middleware/csrf';

const handler = async (req: Request) => {
  const session = await auth();
  const cookies = parseCookieHeader(req.headers.get('cookie'));
  const sessionId = session?.user?.id ?? null;
  const csrfToken = sessionId ? createCsrfTokenForSession(sessionId) : null;

  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => ({
      req,
      headers: req.headers,
      cookies,
      session,
      userId: session?.user?.id ?? null,
      tenantId: session?.user?.id ?? null,
      tier: (session?.user as { tier?: SubscriptionTier } | undefined)?.tier ?? null,
    }),
  });

  if (!csrfToken || cookies[CSRF_COOKIE_NAME] === csrfToken) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.append(
    'Set-Cookie',
    serializeCsrfCookie(csrfToken, process.env.NODE_ENV === 'production'),
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export { handler as GET, handler as POST };
