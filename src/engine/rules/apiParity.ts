import fs from "node:fs";
import path from "node:path";
import type { AgentCssContract, RuleResult, ValidationContext } from "../types.js";

export function runApiParityRule(
  context: ValidationContext,
  contract: AgentCssContract,
): RuleResult {
  const apiDocPath = path.join(context.repositoryRoot, "AGENT_API.md");

  if (!fs.existsSync(apiDocPath)) {
    return {
      rule: "apiParity",
      violations: [],
    };
  }

  const content = fs.readFileSync(apiDocPath, "utf8");

  const missing = contract.componentApi.dataAttributes.filter((attribute) => !content.includes(attribute));

  return {
    rule: "apiParity",
    violations: missing.map((attribute) => ({
      rule: "apiParity",
      severity: "warn",
      file: "AGENT_API.md",
      message: `Documented API does not mention ${attribute}`,
      hint: "Update Component API tables to include this attribute",
    })),
  };
}
