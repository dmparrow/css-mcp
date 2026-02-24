import fs from "node:fs";
import path from "node:path";
import type { AgentCssContract, RuleResult, ValidationContext, Violation } from "../types.js";
import { globLikeMatch } from "../glob.js";

const DEFAULT_IGNORE_PATTERNS = [
  "node_modules/**",
  "dist/**",
  ".git/**",
  "coverage/**",
  ".next/**",
  ".nuxt/**",
  "build/**",
  "out/**",
];

const toPosix = (p: string) => p.replace(/\\/g, "/");

const normalizeForMatch = (p: string) => {
  // remove leading ./ (common from tooling)
  const cleaned = p.replace(/^[.][/\\]/, "");
  return toPosix(cleaned);
};

function isIgnored(filePath: string, ignorePatterns: string[]): boolean {
  return ignorePatterns.some((pattern) => globLikeMatch(filePath, pattern));
}

function collectFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const nextPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(nextPath));
      continue;
    }

    if (entry.isFile()) {
      files.push(nextPath);
    }
  }

  return files;
}

function walkRepositoryCssFiles(repositoryRoot: string): string[] {
  return collectFiles(repositoryRoot)
    .map((filePath) => path.relative(repositoryRoot, filePath))
    .map(normalizeForMatch);
}

export function runTokenUsageRule(
  context: ValidationContext,
  contract: AgentCssContract,
): RuleResult {
  const candidateFiles = walkRepositoryCssFiles(context.repositoryRoot);
  const ignorePatterns = DEFAULT_IGNORE_PATTERNS.map(normalizeForMatch);
  const scanPatterns = contract.tokenUsage.scanPaths.map(normalizeForMatch);

  const files = candidateFiles
    .filter((relativePath) => !isIgnored(relativePath, ignorePatterns))
    .filter((relativePath) => scanPatterns.some((pattern) => globLikeMatch(relativePath, pattern)))
    .map((relativePath) => path.join(context.repositoryRoot, relativePath));

  const violations: Violation[] = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const relativePosixPath = normalizeForMatch(path.relative(context.repositoryRoot, filePath));

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("/*") || trimmed.startsWith("@")) {
        return;
      }

      const hasHex = /#[0-9a-fA-F]{3,8}\b/.test(trimmed);
      const isToken = trimmed.includes("var(--");

      if (hasHex && !isToken) {
        violations.push({
          rule: "tokenUsage",
          severity: "block",
          file: relativePosixPath,
          message: `Hard-coded color found at line ${index + 1}`,
          hint: "Use semantic token variables instead (e.g., var(--color-brand-default))",
        });
      }
    });
  }

  return {
    rule: "tokenUsage",
    violations,
  };
}
