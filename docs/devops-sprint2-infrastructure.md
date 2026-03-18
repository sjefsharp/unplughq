---
artifact: devops-sprint2-infrastructure
produced-by: devops-engineer
project-slug: unplughq
work-item: task-297-devops-sprint2-infrastructure
work-item-type: task
parent-work-item: epic-001-unplughq-platform
workflow-tier: full
phase: P4
version: 1.0.0
status: draft
consumed-by:
  - product-owner
  - tech-lead
  - backend-developer
date: 2026-03-18
azure-devops-id: 297
review:
  reviewed-by:
  reviewed-date:
---

# DevOps Sprint 2 Infrastructure

## Scope Delivered

Sprint 2 DevOps work for PI-2 now covers the infrastructure surfaces delegated for AB#204, AB#206, AB#207, AB#208, and B-262 within the current DevOps worktree.

The implementation focused on shipping reusable infrastructure contracts for the backend worker while keeping the branch green:

- Hardened the VPS `unplughq` service-user sudoers installation path in `setup-user.sh` so the generated file is installed as `root:root`, `0440`, and validated with `visudo -c` before and after install. The allowed sudo scope is now restricted to the Docker CLI and the exact APT commands needed during provisioning.
- Extended the SSH command-template layer with deployment-oriented primitives: idempotent Docker network creation, directory provisioning for `/opt/unplughq/data/{containerName}` and `/opt/unplughq/env`, richer `docker run` volume and label support, Caddy config validation, and SFTP-backed remote file upload with restrictive file modes.
- Added a reusable deployment infrastructure planner for the backend worker in `code/src/server/services/deployment/infrastructure-templates.ts`. This formalizes the managed Docker network, volume conventions, env-file location, route ID generation, route add/remove commands, and cleanup commands.
- Enhanced the monitoring agent to collect per-container disk usage via `docker inspect --size`, derive container status from Docker state instead of parsing `docker ps` text, and redeploy idempotently onto the managed `unplughq` network with image metadata labels.
- Added alert email infrastructure primitives in `code/src/server/services/notifications/alert-email.ts`: SMTP-oriented configuration parsing, HTML alert template rendering, queue/DLQ job defaults using exponential backoff, and structured delivery log context for backend consumption.
- Extended the root CI workflow with dedicated Sprint 2 infrastructure-facing unit suites for deployment and monitoring. The pipeline now runs these suites separately in addition to the existing full `pnpm test` job.
- Added `code/.prerequisites.json` so the new SMTP-related environment surface and local browser/runtime expectations are declared for future preflight checks.

## Verification Evidence

The following commands were executed successfully in the DevOps worktree:

```bash
bash -n code/infra/provisioning/setup-user.sh code/infra/provisioning/deploy-agent.sh code/infra/provisioning/install-docker.sh code/infra/provisioning/install-caddy.sh
pnpm --dir code typecheck
pnpm --dir code lint
pnpm --dir code exec vitest run src/__tests__/unit/deployment/deployment-state-machine.test.ts src/__tests__/unit/deployment/caddy-route-management.test.ts src/__tests__/unit/deployment/health-check-service.test.ts src/__tests__/unit/monitoring/alert-evaluation.test.ts src/__tests__/unit/monitoring/email-notification.test.ts
```

Results:

- Shell syntax validation passed for the provisioning scripts.
- TypeScript typecheck passed.
- ESLint passed with zero lint errors. The only console output was Next.js warning that `next lint` is deprecated in Next.js 16; the command still exited 0 on this branch.
- The dedicated Sprint 2 unit suites passed: 5 test files, 94 tests.

## Notes for Downstream Agents

The new deployment infrastructure planner is intended for the backend deployment worker to consume directly. It already codifies the Sprint 2 conventions for:

- Managed Docker network: `unplughq`
- Data volumes: `/opt/unplughq/data/{containerName}`
- Environment files: `/opt/unplughq/env/{containerName}.env`
- Caddy route IDs: `unplughq-{containerName}`

One contract correction is required downstream: the Caddy Admin API delete path for `@id`-addressed objects is implemented with `DELETE /id/{routeId}`. Current upstream PI-2 docs describe delete as `DELETE /config/apps/http/servers/srv0/routes/{@id}`, but current Caddy API documentation exposes `@id` traversal via `/id/...`. Backend work should follow the implemented path unless the contract artifacts are revised to a config-path lookup strategy.

The new CI jobs intentionally include only the stable Sprint 2 infrastructure-facing unit suites. Existing Sprint 2 integration suites for deployment lifecycle, alert pipeline, and monitor router remain red on this branch because their backend helpers and router implementations are still placeholders. Those failures were observed during validation but were not introduced by this DevOps change set.

## Research Sources

- [Caddy API docs](https://caddyserver.com/docs/api) — accessed 2026-03-18
- [Caddy HTTP route JSON docs](https://caddyserver.com/docs/json/apps/http/servers/routes/) — accessed 2026-03-18
- [BullMQ retrying failing jobs guide](https://github.com/taskforcesh/bullmq/blob/master/docs/gitbook/guide/retrying-failing-jobs.md) — accessed 2026-03-18