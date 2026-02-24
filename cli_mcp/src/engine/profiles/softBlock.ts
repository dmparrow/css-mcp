import type { Violation } from "../types.js";

export function applySoftBlockProfile(violations: Violation[]): Violation[] {
  return violations.map((violation) => {
    if (
      violation.rule === "fileBoundaries" ||
      violation.rule === "importLayerIntegrity" ||
      violation.rule === "tokenUsage"
    ) {
      return { ...violation, severity: "block" };
    }

    if (violation.severity === "block") {
      return { ...violation, severity: "warn" };
    }

    return violation;
  });
}
