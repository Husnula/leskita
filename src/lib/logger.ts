type Level = "info" | "warn" | "error";
function log(level: Level, msg: string, meta?: unknown) {
  const entry = { ts: new Date().toISOString(), level, msg, meta };
  if (level === "error") console.error(`[${entry.ts}] ${msg}`, meta ?? "");
  else if (level === "warn") console.warn(`[${entry.ts}] ${msg}`, meta ?? "");
  else console.log(`[${entry.ts}] ${msg}`, meta ?? "");
}
export const logger = { info: (m: string, meta?: unknown) => log("info", m, meta), warn: (m: string, meta?: unknown) => log("warn", m, meta), error: (m: string, meta?: unknown) => log("error", m, meta) };