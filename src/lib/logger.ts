// Centralised logger. Outputs structured JSON to stdout on Cloud Run (parsed by Google Cloud Logging)
// and plain text in local dev. Always appends to LOG_FILE for persistent inspection.
import fs from "fs";
import path from "path";

const LOG_FILE = process.env.LOG_FILE ?? "/logs/logs.txt";

// Cloud Run sets K_SERVICE; use that to detect structured-log mode
const IS_CLOUD = !!process.env.K_SERVICE;

type Level = "info" | "warn" | "error";

const SEVERITY: Record<Level, string> = {
  info: "INFO",
  warn: "WARNING",
  error: "ERROR",
};

function formatExtra(args: unknown[]): string {
  if (args.length === 0) return "";
  return (
    " " +
    args
      .map((a) =>
        a instanceof Error ? (a.stack ?? a.message) : JSON.stringify(a)
      )
      .join(" ")
  );
}

function write(level: Level, message: string, ...args: unknown[]): void {
  if (typeof window !== "undefined") return;

  const severity = SEVERITY[level];
  const extra = formatExtra(args);
  const now = new Date().toISOString();

  // Stdout — structured JSON on Cloud Run, plain text locally
  if (IS_CLOUD) {
    const entry = JSON.stringify({ severity, message: `${message}${extra}`, timestamp: now });
    process.stdout.write(entry + "\n");
  } else {
    const line = `${now} [${severity}] ${message}${extra}\n`;
    if (level === "error") process.stderr.write(line);
    else process.stdout.write(line);
  }

  // Always append to log file for persistent inspection
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, `${now} [${severity}] ${message}${extra}\n`);
  } catch {
    // don't crash if log dir is unwritable
  }
}

export const logger = {
  info: (message: string, ...args: unknown[]) => write("info", message, ...args),
  warn: (message: string, ...args: unknown[]) => write("warn", message, ...args),
  error: (message: string, ...args: unknown[]) => write("error", message, ...args),
};
