/**
 * Application error reporting utility.
 *
 * Drop-in replacement for the previous Lovable-specific error reporting.
 * Logs errors to the console and can be extended to forward to any
 * third-party observability service (e.g. Sentry, Datadog, PostHog).
 */

type ErrorSeverity = "error" | "warning" | "info";

type ErrorContext = Record<string, unknown>;

/**
 * Report an error from anywhere in the application.
 * Currently logs to console; swap the body for your observability SDK of choice.
 *
 * @example
 * reportError(err, { boundary: "root_error_component", userId: user.id });
 */
export function reportError(
  error: unknown,
  context: ErrorContext = {},
  severity: ErrorSeverity = "error",
): void {
  const message = formatErrorMessage(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const payload = {
    message,
    severity,
    route: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...context,
    ...(stack !== undefined && { stack }),
  };

  if (severity === "error") {
    console.error("[app error]", payload);
  } else if (severity === "warning") {
    console.warn("[app warning]", payload);
  } else {
    console.info("[app info]", payload);
  }

  // TODO: forward to your observability service here, e.g.:
  // Sentry.captureException(error, { extra: context });
}

/**
 * Produce a human-readable message from any thrown value.
 * Handles Error objects, Responses, and plain values.
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Response) {
    return `HTTP ${error.status}${error.url ? ` at ${error.url}` : ""}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
