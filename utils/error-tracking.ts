/**
 * Error tracking and monitoring utilities
 * Integrates with Sentry for production error tracking
 */

import * as Sentry from "@sentry/nextjs";

export interface ErrorMetadata {
  userId?: string;
  timestamp?: string;
  context?: Record<string, any>;
  severity?: "critical" | "error" | "warning" | "info";
}

/**
 * Capture and report an error to Sentry
 * @param error The error to report
 * @param metadata Additional context
 */
export function captureError(error: Error | string, metadata?: ErrorMetadata) {
  const errorObj = typeof error === "string" ? new Error(error) : error;

  Sentry.captureException(errorObj, {
    tags: {
      severity: metadata?.severity || "error",
    },
    contexts: {
      custom: metadata?.context || {},
    },
    user: metadata?.userId
      ? {
          id: metadata.userId,
        }
      : undefined,
  });

  // Also log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("[Error Tracked]", errorObj, metadata);
  }
}

/**
 * Capture user action for performance monitoring
 * @param action The action name (e.g., "gig_upload_started")
 * @param metadata Additional context
 */
export function trackUserAction(action: string, metadata?: Record<string, any>) {
  Sentry.captureMessage(`User Action: ${action}`, "info");

  if (process.env.NODE_ENV === "development") {
    console.log(`[Action Tracked] ${action}`, metadata);
  }
}

/**
 * Set user context for error tracking
 * @param userId The user ID
 * @param email The user email
 */
export function setUserContext(userId: string, email?: string) {
  Sentry.setUser({
    id: userId,
    email: email || undefined,
  });
}

/**
 * Clear user context when logging out
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Monitor critical API calls using Sentry Spans
 */
export async function monitorAPICall<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan({ name, op: "api.call" }, async () => {
    try {
      return await fn();
    } catch (error) {
      captureError(error as Error, { severity: "error", context: { apiCall: name } });
      throw error;
    }
  });
}
