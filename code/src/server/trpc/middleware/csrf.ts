import { createHmac, timingSafeEqual } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { ErrorCode } from '@/server/lib/errors';
import type { TRPCContext } from '../index';

export const CSRF_COOKIE_NAME = '__Host-csrf';

export function parseCookieHeader(header: string | null): Record<string, string> {
  if (!header) {
    return {};
  }

  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, part) => {
      const separatorIndex = part.indexOf('=');

      if (separatorIndex <= 0) {
        return cookies;
      }

      const key = decodeURIComponent(part.slice(0, separatorIndex).trim());
      const value = decodeURIComponent(part.slice(separatorIndex + 1).trim());
      cookies[key] = value;
      return cookies;
    }, {});
}

export function createCsrfTokenForSession(sessionId: string): string {
  const secret = process.env.AUTH_SECRET ?? 'development-csrf-secret';
  return createHmac('sha256', secret).update(sessionId).digest('hex');
}

export function serializeCsrfCookie(token: string, secure: boolean): string {
  const attributes = [
    `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'SameSite=Strict',
    'HttpOnly=false',
  ];

  if (secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

export function assertValidCsrf(ctx: Pick<TRPCContext, 'userId' | 'cookies' | 'headers'>): void {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      cause: { code: ErrorCode.UNAUTHENTICATED },
    });
  }

  const cookieToken = ctx.cookies[CSRF_COOKIE_NAME];
  const headerToken = ctx.headers.get('x-csrf-token');
  const expectedToken = createCsrfTokenForSession(ctx.userId);

  if (!cookieToken || !headerToken) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'CSRF validation failed',
      cause: { code: ErrorCode.FORBIDDEN },
    });
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);
  const expectedBuffer = Buffer.from(expectedToken);

  if (
    cookieBuffer.length !== headerBuffer.length ||
    cookieBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(cookieBuffer, headerBuffer) ||
    !timingSafeEqual(cookieBuffer, expectedBuffer)
  ) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'CSRF validation failed',
      cause: { code: ErrorCode.FORBIDDEN },
    });
  }
}