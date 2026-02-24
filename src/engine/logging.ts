import fs from "node:fs";
import path from "node:path";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  rule: string;
  file?: string;
  line?: number;
  message: string;
  context?: Record<string, unknown>;
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  format: "json" | "text";
  outputFile?: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private config: LoggerConfig;
  private entries: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? process.env.ARROW_LOGGING_ENABLED === "true",
      level: (process.env.ARROW_LOG_LEVEL as LogLevel) ?? config.level ?? "info",
      format: config.format ?? "json",
      outputFile: config.outputFile,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  log(
    level: LogLevel,
    rule: string,
    message: string,
    context: { file?: string; line?: number; data?: Record<string, unknown> } = {},
  ): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      rule,
      file: context.file,
      line: context.line,
      message,
      context: context.data,
    };

    this.entries.push(entry);

    if (this.config.outputFile) {
      this.writeEntry(entry);
    }
  }

  private writeEntry(entry: LogEntry): void {
    if (!this.config.outputFile) return;

    const dir = path.dirname(this.config.outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const formatted = this.config.format === "json" ? JSON.stringify(entry) : this.formatText(entry);
    fs.appendFileSync(this.config.outputFile, formatted + "\n", "utf8");
  }

  private formatText(entry: LogEntry): string {
    const location = entry.file ? ` [${entry.file}:${entry.line ?? "?"}]` : "";
    return `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.rule}${location}: ${entry.message}`;
  }

  debug(rule: string, message: string, context?: Record<string, unknown>): void {
    this.log("debug", rule, message, { data: context });
  }

  info(rule: string, message: string, context?: Record<string, unknown>): void {
    this.log("info", rule, message, { data: context });
  }

  warn(rule: string, message: string, context?: Record<string, unknown>): void {
    this.log("warn", rule, message, { data: context });
  }

  error(rule: string, message: string, context?: Record<string, unknown>): void {
    this.log("error", rule, message, { data: context });
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }

  toJSON(): LogEntry[] {
    return this.getEntries();
  }
}

export const globalLogger = new Logger();
