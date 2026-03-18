/**
 * Email Mock Helpers — in-memory alert email queueing and delivery.
 * Used by: email-notification.test.ts (unit), alert-pipeline.test.ts (integration)
 *
 * Unit test calls: enqueueAlertEmail({ to, alertId, alertType, serverName, message })
 *   → expects { subject, body, status: 'pending', sentAt, attempts }
 * Integration test calls: enqueueAlertEmail({ alertId, tenantId, alertType, severity, message, recipientEmail })
 *   → expects { id }
 * Unit processEmailQueue() returns array with [0].status, [0].sentAt, .length
 * Integration processEmailQueue() returns { delivered: number }
 * Unified: return augmented array with .delivered property.
 */

interface EmailRecord {
  id: string;
  alertId: string;
  tenantId?: string;
  to: string;
  alertType: string;
  severity?: string;
  serverName?: string;
  message: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'dlq';
  sentAt: string | null;
  attempts: number;
}

const emailQueue: EmailRecord[] = [];
let emailCounter = 0;

const MAX_ATTEMPTS = 3;

export function enqueueAlertEmail(input: {
  to?: string;
  recipientEmail?: string;
  alertId: string;
  tenantId?: string;
  alertType: string;
  severity?: string;
  serverName?: string;
  message: string;
}): EmailRecord {
  const to = input.to ?? input.recipientEmail ?? '';
  const serverName = input.serverName ?? 'Server';
  const subject = `[UnplugHQ] Alert: ${input.alertType} on ${serverName}`;
  const body = `Alert on ${serverName}: ${input.message}`;

  const record: EmailRecord = {
    id: `email-${++emailCounter}`,
    alertId: input.alertId,
    tenantId: input.tenantId,
    to,
    alertType: input.alertType,
    severity: input.severity,
    serverName: input.serverName,
    message: input.message,
    subject,
    body,
    status: 'pending',
    sentAt: null,
    attempts: 0,
  };
  emailQueue.push(record);
  return record;
}

interface ProcessResult extends Array<EmailRecord> {
  delivered: number;
}

export function processEmailQueue(
  options?: { simulateFailure?: boolean },
): ProcessResult {
  const { simulateFailure = false } = options ?? {};
  const processed: EmailRecord[] = [];
  let delivered = 0;

  for (const email of emailQueue) {
    if (email.status !== 'pending') continue;

    email.attempts++;

    if (simulateFailure) {
      if (email.attempts >= MAX_ATTEMPTS) {
        email.status = 'dlq';
      }
      // still pending if under MAX_ATTEMPTS (will be retried)
      processed.push(email);
    } else {
      email.status = 'sent';
      email.sentAt = new Date().toISOString();
      delivered++;
      processed.push(email);
    }
  }

  const result = processed as ProcessResult;
  result.delivered = delivered;
  return result;
}

export function getEmailQueue(): EmailRecord[] {
  return emailQueue.filter((e) => e.status !== 'dlq');
}

export function getDlqEmails(): EmailRecord[] {
  return emailQueue.filter((e) => e.status === 'dlq');
}

export function isNotificationSuppressed(prefs: { emailAlerts: boolean }): boolean {
  return !prefs.emailAlerts;
}

export function resetEmailQueue(): void {
  emailQueue.length = 0;
  emailCounter = 0;
}
