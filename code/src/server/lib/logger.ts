import pino from 'pino';

/**
 * Structured logger with PEM key material redaction (I-05 mitigation).
 * Field allowlists ensure SSH keys, passwords, and tokens never appear in logs.
 */

const PEM_PATTERN = /-----BEGIN[\s\S]*?-----END[^\n]*-----/g;
const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'sshKey',
  'sshKeyEncrypted',
  'privateKey',
  'accessToken',
  'refreshToken',
  'apiToken',
  'token',
  'secret',
  'authorization',
]);

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') {
    if (PEM_PATTERN.test(value)) {
      return '[REDACTED:PEM_KEY]';
    }
    PEM_PATTERN.lastIndex = 0;
  }
  return value;
}

function redactObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = redactObject(value as Record<string, unknown>);
    } else {
      result[key] = redactValue(value);
    }
  }
  return result;
}

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  formatters: {
    log(obj) {
      return redactObject(obj as Record<string, unknown>);
    },
  },
  serializers: {
    err: pino.stdSerializers.err,
    req(req) {
      return {
        method: req.method,
        url: req.url,
      };
    },
  },
});

export type Logger = typeof logger;
