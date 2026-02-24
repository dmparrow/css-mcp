import type { ValidationResult } from "../../engine/types.js";

export function explainViolations(result: ValidationResult): string {
  if (result.violations.length === 0) {
    return "No policy violations found. Outcome: pass.";
  }

  const lines = [
    `Outcome: ${result.outcome}`,
    `Violations: ${result.summary.total} (warn=${result.summary.warnings}, block=${result.summary.blocks})`,
    "",
  ];

  for (const violation of result.violations) {
    lines.push(`- [${violation.severity}] ${violation.rule}: ${violation.message}`);
    if (violation.file) {
      lines.push(`  file: ${violation.file}`);
    }
    if (violation.hint) {
      lines.push(`  hint: ${violation.hint}`);
    }
  }

  return lines.join("\n");
}
