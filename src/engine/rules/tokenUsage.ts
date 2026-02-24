import fs from "node:fs";
import path from "node:path";
import type { AgentCssContract, RuleResult, ValidationContext, Violation } from "../types.js";

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

    if (entry.isFile() && entry.name.endsWith(".css")) {
      files.push(nextPath);
    }
  }

  return files;
}

function walkRepositoryCssFiles(repositoryRoot: string): string[] {
  return collectFiles(repositoryRoot).map((filePath) => path.relative(repositoryRoot, filePath));
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function globLikeMatch(filePath: string, pattern: string): boolean {
  const normalizedPath = filePath.replaceAll("\\", "/");
  const normalizedPattern = pattern.replaceAll("\\", "/");

  if (normalizedPattern === "**") {
    return true;
  }

  if (normalizedPattern.endsWith("/**")) {
    const prefix = normalizedPattern.slice(0, -3);
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`);
  }

  const regex = new RegExp(
    `^${escapeRegex(normalizedPattern)
      .replace(/\\\*\\\*/g, ".*")
      .replace(/\\\*/g, "[^/]*")}$`,
  );

  return regex.test(normalizedPath);
}

export function runTokenUsageRule(
  context: ValidationContext,
  contract: AgentCssContract,
): RuleResult {
  const candidateFiles = walkRepositoryCssFiles(context.repositoryRoot);
  const files = candidateFiles
    .filter((relativePath) => contract.tokenUsage.scanPaths.some((pattern) => globLikeMatch(relativePath, pattern)))
    .map((relativePath) => path.join(context.repositoryRoot, relativePath));
  const violations: Violation[] = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");

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
          file: path.relative(context.repositoryRoot, filePath),
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
