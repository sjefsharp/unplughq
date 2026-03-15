import { router } from './index';
import { authRouter } from './routers/auth';
import { serverRouter } from './routers/server';
import { appRouter as appSubRouter } from './routers/app';
import { monitorRouter } from './routers/monitor';
import { domainRouter } from './routers/domain';
import { userRouter } from './routers/user';

export const appRouter = router({
  auth: authRouter,
  server: serverRouter,
  app: appSubRouter,
  monitor: monitorRouter,
  domain: domainRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
