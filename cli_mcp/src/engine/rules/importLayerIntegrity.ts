import fs from "node:fs";
import path from "node:path";
import type { AgentCssContract, RuleResult, ValidationContext, Violation } from "../types.js";

export function runImportLayerIntegrityRule(
  context: ValidationContext,
  contract: AgentCssContract,
): RuleResult {
  const violations: Violation[] = [];
  const mainCssPath = path.join(context.repositoryRoot, contract.layerInvariants.mainCss);

  if (!fs.existsSync(mainCssPath)) {
    return {
      rule: "importLayerIntegrity",
      violations: [
        {
          rule: "importLayerIntegrity",
          severity: "block",
          file: contract.layerInvariants.mainCss,
          message: "Main CSS file not found for layer invariant check",
        },
      ],
    };
  }

  const content = fs.readFileSync(mainCssPath, "utf8");

  for (const importSnippet of contract.layerInvariants.requiredImports) {
    if (!content.includes(importSnippet)) {
      violations.push({
        rule: "importLayerIntegrity",
        severity: "block",
        file: contract.layerInvariants.mainCss,
        message: `Required import missing: ${importSnippet}`,
      });
    }
  }

  const layerLine = content.split("\n").find((line) => line.includes("@layer"));
  if (!layerLine) {
    violations.push({
      rule: "importLayerIntegrity",
      severity: "block",
      file: contract.layerInvariants.mainCss,
      message: "No @layer declaration found",
    });
  } else {
    for (const requiredLayer of contract.layerInvariants.requiredLayers) {
      if (!layerLine.includes(requiredLayer)) {
        violations.push({
          rule: "importLayerIntegrity",
          severity: "block",
          file: contract.layerInvariants.mainCss,
          message: `Required layer missing in @layer order: ${requiredLayer}`,
        });
      }
    }
  }

  return {
    rule: "importLayerIntegrity",
    violations,
  };
}
