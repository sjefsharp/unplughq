/**
 * Email Notification Mock Helpers — in-memory email dispatch for alert tests.
 * Based on architecture-overview.md alert pipeline: metrics → threshold → alert → email.
 */

interface EmailRecord {
  id: string;
  to: string;
  subject: string;
  body: string;
  alertId: string;
  sentAt: string | null;
  attempts: number;
  status: 'pending' | 'sent' | 'failed' | 'dlq';
}

const emailQueue: EmailRecord[] = [];
let emailCounter = 0;

export function enqueueAlertEmail(params: {
  to: string;
  alertId: string;
  alertType: string;
  serverName: string;
  message: string;
}): EmailRecord {
  const email: EmailRecord = {
    id: `email-${++emailCounter}`,
    to: params.to,
    subject: `[UnplugHQ] Alert: ${params.alertType} on ${params.serverName}`,
    body: `Alert detected on server "${params.serverName}": ${params.message}`,
    alertId: params.alertId,
    sentAt: null,
    attempts: 0,
    status: 'pending',
  };
  emailQueue.push(email);
  return email;
}

export function processEmailQueue(
  options: { simulateFailure?: boolean } = {},
): EmailRecord[] {
  const processed: EmailRecord[] = [];
  for (const email of emailQueue.filter((e) => e.status === 'pending')) {
    email.attempts++;
    if (options.simulateFailure) {
      if (email.attempts >= 3) {
        email.status = 'dlq';
      } else {
        email.status = 'pending';
      }
    } else {
      email.status = 'sent';
      email.sentAt = new Date().toISOString();
    }
    processed.push(email);
  }
  return processed;
}

export function getEmailQueue(): EmailRecord[] {
  return [...emailQueue];
}

export function getDlqEmails(): EmailRecord[] {
  return emailQueue.filter((e) => e.status === 'dlq');
}

export function isNotificationSuppressed(
  notificationPrefs: { emailAlerts: boolean },
): boolean {
  return !notificationPrefs.emailAlerts;
}

export function resetEmailQueue(): void {
  emailQueue.length = 0;
  emailCounter = 0;
}
