import { describe, expect, it, beforeEach } from "vitest";
import { Logger, LogEntry } from "../../src/engine/logging.js";

describe("logger", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger({
      enabled: true,
      level: "debug",
      format: "json",
    });
  });

  it("logs messages at appropriate level", () => {
    logger.debug("test-rule", "debug message");
    logger.info("test-rule", "info message");
    logger.warn("test-rule", "warn message");
    logger.error("test-rule", "error message");

    const entries = logger.getEntries();
    expect(entries).toHaveLength(4);
    expect(entries[0].level).toBe("debug");
    expect(entries[1].level).toBe("info");
    expect(entries[2].level).toBe("warn");
    expect(entries[3].level).toBe("error");
  });

  it("respects log level filtering", () => {
    const warnLogger = new Logger({
      enabled: true,
      level: "warn",
      format: "json",
    });

    warnLogger.debug("rule", "debug");
    warnLogger.info("rule", "info");
    warnLogger.warn("rule", "warn");
    warnLogger.error("rule", "error");

    const entries = warnLogger.getEntries();
    expect(entries).toHaveLength(2);
    expect(entries.map((e) => e.level)).toEqual(["warn", "error"]);
  });

  it("disables logging when not enabled", () => {
    const disabledLogger = new Logger({
      enabled: false,
      level: "debug",
    });

    disabledLogger.info("rule", "message");
    disabledLogger.warn("rule", "warning");

    expect(disabledLogger.getEntries()).toHaveLength(0);
  });

  it("includes context data in entries", () => {
    logger.log("warn", "test-rule", "test message", {
      file: "src/style.css",
      line: 42,
      data: { detail: "extra info" },
    });

    const entries = logger.getEntries();
    expect(entries[0].file).toBe("src/style.css");
    expect(entries[0].line).toBe(42);
    expect(entries[0].context).toEqual({ detail: "extra info" });
  });

  it("can clear entries", () => {
    logger.info("rule", "message 1");
    logger.info("rule", "message 2");
    expect(logger.getEntries()).toHaveLength(2);

    logger.clear();
    expect(logger.getEntries()).toHaveLength(0);
  });
});
