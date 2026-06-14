import fs from "fs";
import path from "path";

const LOG_FILE = process.env.LOG_FILE ?? "/logs/logs.txt";

type Level = "info" | "warn" | "error";

function write(level: Level, message: string, ...args: unknown[]): void {
  if (typeof window !== "undefined") return;

  const extra =
    args.length > 0
      ? " " +
        args
          .map((a) =>
            a instanceof Error ? (a.stack ?? a.message) : JSON.stringify(a)
          )
          .join(" ")
      : "";
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}${extra}\n`;

  if (level === "error") process.stderr.write(line);
  else process.stdout.write(line);

  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line);
  } catch {
    // don't crash if log dir is unwritable
  }
}

export const logger = {
  info: (message: string, ...args: unknown[]) => write("info", message, ...args),
  warn: (message: string, ...args: unknown[]) => write("warn", message, ...args),
  error: (message: string, ...args: unknown[]) => write("error", message, ...args),
};
