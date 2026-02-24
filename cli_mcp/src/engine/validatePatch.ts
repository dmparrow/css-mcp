import type { AgentCssContract, ValidationContext, ValidationResult, Violation } from "./types.js";
import { runFileBoundariesRule } from "./rules/fileBoundaries.js";
import { runImportLayerIntegrityRule } from "./rules/importLayerIntegrity.js";
import { runTokenUsageRule } from "./rules/tokenUsage.js";
import { runApiParityRule } from "./rules/apiParity.js";
import { runDocsSyncRule } from "./rules/docsSync.js";
import { applySoftBlockProfile } from "./profiles/softBlock.js";

export function validatePatch(
  context: ValidationContext,
  contract: AgentCssContract,
): ValidationResult {
  const results = [
    runFileBoundariesRule(context, contract),
    runImportLayerIntegrityRule(context, contract),
    runTokenUsageRule(context),
    runApiParityRule(context, contract),
    runDocsSyncRule(context),
  ];

  const violations: Violation[] = applySoftBlockProfile(results.flatMap((result) => result.violations));

  const blocks = violations.filter((violation) => violation.severity === "block").length;
  const warnings = violations.filter((violation) => violation.severity === "warn").length;

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
