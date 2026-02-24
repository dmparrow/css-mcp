import path from "node:path";
import type { AgentCssContract, RuleResult, ValidationContext, Violation } from "../types.js";
import { globLikeMatch } from "../glob.js";

export function runFileBoundariesRule(
  context: ValidationContext,
  contract: AgentCssContract,
): RuleResult {
  const allowed = contract.taskWriteSurfaces[context.task] ?? ["**"];

  const violations: Violation[] = context.changedFiles
    .filter((filePath) => !allowed.some((pattern) => globLikeMatch(filePath, pattern)))
    .map((filePath) => ({
      rule: "fileBoundaries",
      severity: "block",
      file: path.normalize(filePath),
      message: `File is outside allowed write surface for task '${context.task}'`,
      hint: `Allowed patterns: ${allowed.join(", ")}`,
    }));

  return {
    rule: "fileBoundaries",
    violations,
  };
}
