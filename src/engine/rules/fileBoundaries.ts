import type { AgentCssContract, RuleResult, ValidationContext, Violation } from "../types.js";
import { globLikeMatch } from "../glob.js";

const toPosix = (p: string) => p.replace(/\\/g, "/");

const normalizeForMatch = (p: string) => {
  // remove leading ./ (common from tooling)
  const cleaned = p.replace(/^[.][/\\]/, "");
  return toPosix(cleaned);
};

export function runFileBoundariesRule(
  context: ValidationContext,
  contract: AgentCssContract,
): RuleResult {
  const allowedPatterns = (contract.taskWriteSurfaces[context.task] ?? ["**"]).map(normalizeForMatch);

  const violations: Violation[] = context.changedFiles
    .map((filePath) => ({
      normalized: normalizeForMatch(filePath),
    }))
    .filter(({ normalized }) => !allowedPatterns.some((pattern) => globLikeMatch(normalized, pattern)))
    .map(({ normalized }) => ({
      rule: "fileBoundaries",
      severity: "block",
      file: normalized,
      message: `File is outside allowed write surface for task '${context.task}'`,
      hint: `Allowed patterns: ${allowedPatterns.join(", ")}`,
    }));

  return {
    rule: "fileBoundaries",
    violations,
  };
}
