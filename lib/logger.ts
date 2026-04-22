/**
 * lib/logger.ts
 *
 * Structured JSON logger for Future WayMakers.
 * Every log entry emits a consistent JSON envelope suitable for
 * log aggregation tools (Logtail, Datadog, Vercel Log Drains, etc.).
 *
 * Log format:
 *   { timestamp, level, message, traceId, userId?, action?, durationMs?, ...context }
 *
 * Sentry integration is active — errors and warnings are forwarded
 * automatically when SENTRY_DSN is configured.
 */

import * as Sentry from '@sentry/nextjs';

// ─── Types ────────────────────────────────────────────────────────────────────

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** Supabase / auth user ID */
  userId?: string;
  /** Action being performed — e.g. "upload.video", "escrow.create" */
  action?: string;
  /** Duration in milliseconds for performance tracking */
  durationMs?: number;
  /** Trace ID for correlating a chain of log entries in one request */
  traceId?: string;
  /** Any additional structured fields */
  [key: string]: unknown;
}

interface LogEntry extends LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a lightweight trace ID (no external dep required). */
export function generateTraceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Redact sensitive fields before emitting to stdout. */
const REDACTED_KEYS = new Set(['password', 'token', 'secret', 'key', 'passphrase', 'authorization']);

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      REDACTED_KEYS.has(k.toLowerCase()) ? '[REDACTED]' : v,
    ])
  );
}

// ─── Logger class ─────────────────────────────────────────────────────────────

class Logger {
  private emit(level: LogLevel, message: string, context: LogContext = {}) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: context.traceId ?? generateTraceId(),
      ...redact(context as Record<string, unknown>),
    };

    const line = JSON.stringify(entry);

    switch (level) {
      case 'debug':
        if (process.env.NODE_ENV !== 'production') console.debug(line);
        break;
      case 'info':
        // Suppress info in production stdout to reduce noise; still sent to drain
        if (process.env.NODE_ENV !== 'production') console.info(line);
        else console.log(line);
        break;
      case 'warn':
        console.warn(line);
        break;
      case 'error':
        console.error(line);
        break;
    }
  }

  /**
   * Log a debug-level message (development only — stripped in production output).
   */
  debug(message: string, context?: LogContext) {
    this.emit('debug', message, context);
  }

  /**
   * Log an informational event.
   * @example logger.info('Gig created', { action: 'gig.create', userId, durationMs: 42 })
   */
  info(message: string, context?: LogContext) {
    this.emit('info', message, context);
  }

  /**
   * Log a warning. Forwarded to Sentry as a warning-level event.
   */
  warn(message: string, context?: LogContext) {
    this.emit('warn', message, context);

    Sentry.withScope((scope) => {
      if (context?.userId) scope.setUser({ id: context.userId });
      if (context?.traceId) scope.setTag('traceId', context.traceId);
      scope.setExtras(context as Record<string, unknown>);
      Sentry.captureMessage(message, 'warning');
    });
  }

  /**
   * Log an error. Forwards the exception to Sentry with full context.
   * Never exposes stack traces in API responses — only logs them.
   */
  error(message: string, error?: unknown, context?: LogContext) {
    const errPayload =
      error instanceof Error
        ? { errorName: error.name, errorMessage: error.message, stack: error.stack }
        : { errorRaw: String(error) };

    this.emit('error', message, { ...context, ...errPayload });

    Sentry.withScope((scope) => {
      if (context?.userId) scope.setUser({ id: context.userId });
      if (context?.traceId) scope.setTag('traceId', context.traceId);
      if (context?.action) scope.setTag('action', context.action);
      scope.setExtras({ ...(context as Record<string, unknown>), ...errPayload });

      const sentryErr = error instanceof Error ? error : new Error(String(error));
      Sentry.captureException(sentryErr);
    });
  }

  /**
   * Supabase-specific error helper — extracts code/details from Supabase error objects.
   */
  supabaseError(
    action: string,
    error: { message: string; code?: string; details?: string },
    context?: LogContext
  ) {
    this.error(`Supabase error in ${action}`, new Error(error.message), {
      ...context,
      action,
      supabaseCode: error.code,
      supabaseDetails: error.details,
    });
  }

  /**
   * Convenience: time an async operation and log it with durationMs.
   * @example const result = await logger.time('ai.embed', () => openai.embed(...))
   */
  async time<T>(action: string, fn: () => Promise<T>, context?: LogContext): Promise<T> {
    const start = Date.now();
    const traceId = context?.traceId ?? generateTraceId();
    try {
      const result = await fn();
      this.info(`${action} completed`, { ...context, action, traceId, durationMs: Date.now() - start });
      return result;
    } catch (err) {
      this.error(`${action} failed`, err, { ...context, action, traceId, durationMs: Date.now() - start });
      throw err;
    }
  }
}

export const logger = new Logger();
