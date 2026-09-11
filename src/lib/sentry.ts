import { logger } from "./logger";
let inited = false;
export function initSentry() {
  if (inited) return;
  inited = true;
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) { logger.info("Sentry disabled (no DSN)"); return; }
  logger.info("Sentry DSN set — wire @sentry/nextjs when ready");
}
export function captureError(err: unknown, ctx?: Record<string, unknown>) {
  logger.error("capture", { err: (err as Error)?.message ?? String(err), ctx });
}
