import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { verifyPassword } from '@/server/services/auth/password-hashing';
import { isAccountLocked, recordFailedLogin, clearFailedLogins } from '@/server/lib/rate-limit';
import { logger } from '@/server/lib/logger';
import { eq } from 'drizzle-orm';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // S-01: Rate limiting — check if account is locked
        const locked = await isAccountLocked(email);
        if (locked) {
          logger.warn({ email }, 'Login attempt on locked account');
          // I-02: Generic error — do not reveal lock status
          return null;
        }

        // Lookup user by email
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        // I-02: Generic error — consistent handling for both existing and non-existing users
        if (!user?.passwordHash) {
          return null;
        }

        const validPassword = await verifyPassword(password, user.passwordHash);
        if (!validPassword) {
          await recordFailedLogin(email);
          logger.info({ email }, 'Failed login attempt');
          return null;
        }

        await clearFailedLogins(email);
        logger.info({ userId: user.id }, 'Successful login');

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tier: user.tier,
        };
      },
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days (FR-F4-006)
  },
  cookies: {
    sessionToken: {
      name: 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/signup',
    error: '/login',
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
