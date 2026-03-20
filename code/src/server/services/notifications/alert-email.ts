import type { JobsOptions } from 'bullmq';

export interface AlertEmailTemplateInput {
  alertId: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  serverName: string;
  message: string;
  dashboardUrl: string;
  currentValue?: string;
  threshold?: string;
  affectedApp?: string;
  unsubscribeUrl?: string;
}

export interface AlertEmailConfig {
  provider: 'smtp';
  from: string;
  replyTo?: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  queueName: string;
  dlqName: string;
  maxAttempts: number;
  backoffDelayMs: number;
}

export const alertEmailQueueOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 60_000,
  },
  removeOnComplete: {
    count: 250,
  },
  removeOnFail: false,
};

export const alertEmailDlqQueueOptions: JobsOptions = {
  attempts: 1,
  removeOnComplete: {
    count: 500,
  },
  removeOnFail: {
    count: 1000,
  },
};

export function getAlertEmailConfig(env: NodeJS.ProcessEnv = process.env): AlertEmailConfig {
  return {
    provider: 'smtp',
    from: env.ALERT_EMAIL_FROM ?? 'alerts@unplughq.local',
    replyTo: env.ALERT_EMAIL_REPLY_TO,
    smtpHost: env.SMTP_HOST ?? 'localhost',
    smtpPort: Number(env.SMTP_PORT ?? 587),
    smtpSecure: env.SMTP_SECURE === 'true',
    smtpUser: env.SMTP_USER,
    smtpPassword: env.SMTP_PASSWORD,
    queueName: env.ALERT_EMAIL_QUEUE_NAME ?? 'alert-email',
    dlqName: env.ALERT_EMAIL_DLQ_NAME ?? 'alert-email-dlq',
    maxAttempts: Number(env.ALERT_EMAIL_MAX_ATTEMPTS ?? 3),
    backoffDelayMs: Number(env.ALERT_EMAIL_BACKOFF_MS ?? 60_000),
  };
}

export function renderAlertEmailSubject(input: AlertEmailTemplateInput): string {
  return `[UnplugHQ] ${input.severity.toUpperCase()} ${input.alertType} on ${input.serverName}`;
}

export function renderAlertEmailHtml(input: AlertEmailTemplateInput): string {
  const facts = [
    ['Alert type', input.alertType],
    ['Severity', input.severity],
    ['Server', input.serverName],
    ['App', input.affectedApp],
    ['Current value', input.currentValue],
    ['Threshold', input.threshold],
  ].filter(([, value]) => Boolean(value));

  const factsMarkup = facts
    .map(([label, value]) => `<tr><td style="padding:6px 12px 6px 0;font-weight:600;">${label}</td><td style="padding:6px 0;">${value}</td></tr>`)
    .join('');

  const unsubscribeMarkup = input.unsubscribeUrl
    ? `<p style="margin:24px 0 0;font-size:13px;color:#5f6b7a;">Manage alert emails in <a href="${input.unsubscribeUrl}">notification preferences</a>.</p>`
    : '';

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f6f8;font-family:Arial,sans-serif;color:#17202a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
            <tr>
              <td>
                <p style="margin:0 0 12px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#667085;">UnplugHQ alert</p>
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;">${input.message}</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#344054;">Review the alert details below, then open the dashboard to investigate or dismiss it.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#f8fafc;border-radius:12px;padding:16px;">
                  ${factsMarkup}
                </table>
                <p style="margin:24px 0 0;">
                  <a href="${input.dashboardUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:600;">Open dashboard</a>
                </p>
                ${unsubscribeMarkup}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildAlertEmailLogContext(input: AlertEmailTemplateInput): Record<string, string> {
  return {
    alertId: input.alertId,
    alertType: input.alertType,
    severity: input.severity,
    serverName: input.serverName,
  };
}