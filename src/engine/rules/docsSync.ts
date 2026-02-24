import fs from "node:fs";
import path from "node:path";
import type { RuleResult, ValidationContext } from "../types.js";

export function runDocsSyncRule(context: ValidationContext): RuleResult {
  const readmePath = path.join(context.repositoryRoot, "README.md");
  const apiPath = path.join(context.repositoryRoot, "AGENT_API.md");

  const violations = [] as RuleResult["violations"];

  if (!fs.existsSync(readmePath) || !fs.existsSync(apiPath)) {
    return { rule: "docsSync", violations };
  }

  const readme = fs.readFileSync(readmePath, "utf8");
  const api = fs.readFileSync(apiPath, "utf8");

  const readmeMentionsWriteSurface = readme.includes("theme.config.css");
  const apiMentionsWriteSurface = api.includes("theme.config.css");

  if (readmeMentionsWriteSurface !== apiMentionsWriteSurface) {
    violations.push({
      rule: "docsSync",
      severity: "warn",
      message: "Write-surface guidance appears inconsistent between README.md and AGENT_API.md",
      hint: "Align guidance language in both docs",
    });
  }

  return {
    rule: "docsSync",
    violations,
  };
}
