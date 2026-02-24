import type { AgentCssContract, ValidationContext, ValidationResult, Violation } from "./types.js";
import { runFileBoundariesRule } from "./rules/fileBoundaries.js";
import { runImportLayerIntegrityRule } from "./rules/importLayerIntegrity.js";
import { runTokenUsageRule } from "./rules/tokenUsage.js";
import { runScssRuleIntegrity } from "./rules/scssIntegrity.js";
import { runApiParityRule } from "./rules/apiParity.js";
import { runDocsSyncRule } from "./rules/docsSync.js";
import { applySoftBlockProfile } from "./profiles/softBlock.js";
import { globalLogger, Logger, type LoggerConfig } from "./logging.js";

export function validatePatch(
  context: ValidationContext,
  contract: AgentCssContract,
  loggerConfig?: LoggerConfig,
): ValidationResult {
  // Initialize logger if config provided
  if (loggerConfig) {
    Object.assign(globalLogger, new Logger(loggerConfig));
  } else if (contract.logging) {
    Object.assign(globalLogger, new Logger(contract.logging));
  }

  globalLogger.debug("validatePatch", "Starting validation", {
    task: context.task,
    filesCount: context.changedFiles.length,
  });

  const results = [
    runFileBoundariesRule(context, contract),
    runImportLayerIntegrityRule(context, contract),
    runTokenUsageRule(context, contract),
    runScssRuleIntegrity(context),
    runApiParityRule(context, contract),
    runDocsSyncRule(context),
  ];

  const violations: Violation[] = applySoftBlockProfile(results.flatMap((result) => result.violations));

  const blocks = violations.filter((violation) => violation.severity === "block").length;
  const warnings = violations.filter((violation) => violation.severity === "warn").length;

  globalLogger.info("validatePatch", `Validation complete`, {
    outcome: blocks > 0 ? "block" : warnings > 0 ? "warn" : "pass",
    violations: violations.length,
    blocks,
    warnings,
  });

  return {
    outcome: blocks > 0 ? "block" : warnings > 0 ? "warn" : "pass",
    violations,
    summary: {
      total: violations.length,
      warnings,
      blocks,
    },
  };
}
