import fs from "node:fs";
import path from "node:path";
import type { RuleResult, ValidationContext, Violation } from "../types.js";
import { globalLogger } from "../logging.js";

function collectScssFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const nextPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectScssFiles(nextPath));
      continue;
    }

    if (entry.isFile() && (entry.name.endsWith(".scss") || entry.name.endsWith(".sass"))) {
      files.push(nextPath);
    }
  }

  return files;
}

function resolveSourceMap(filePath: string): string | null {
  const mapPath = `${filePath}.map`;
  if (!fs.existsSync(mapPath)) {
    return null;
  }

  try {
    const mapContent = JSON.parse(fs.readFileSync(mapPath, "utf8")) as {
      sources?: string[];
      sourceRoot?: string;
    };

    if (mapContent.sources && mapContent.sources.length > 0) {
      const sourceRoot = mapContent.sourceRoot || "";
      const sourcePath = path.join(path.dirname(filePath), sourceRoot, mapContent.sources[0]);
      return path.normalize(sourcePath);
    }
  } catch {
    // Silently skip if source map is malformed
  }

  return null;
}

export function runScssRuleIntegrity(context: ValidationContext): RuleResult {
  const repositoryRoot = context.repositoryRoot;
  const scssDir = path.join(repositoryRoot, "src");

  const scssFiles = collectScssFiles(scssDir);
  const violations: Violation[] = [];

  for (const filePath of scssFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const relativeFile = path.relative(repositoryRoot, filePath);

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Skip comments
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
        return;
      }

      // Detect hard-coded hex colors in SCSS
      const hasHex = /#[0-9a-fA-F]{3,8}\b/.test(trimmed);
      const isToken = trimmed.includes("var(--") || trimmed.includes("$");
      const isMixinOrVariable = trimmed.startsWith("@mixin") || trimmed.startsWith("$");

      if (hasHex && !isToken && !isMixinOrVariable) {
        violations.push({
          rule: "scssIntegrity",
          severity: "block",
          file: relativeFile,
          message: `Hard-coded color found at line ${index + 1}`,
          hint: "Use SCSS variable ($var) or CSS variable (var(--token)) instead of hex literal",
        });

        globalLogger.warn("scssIntegrity", `Hard-coded color in SCSS`, {
          file: relativeFile,
          line: index + 1,
        });
      }

      // Detect RGB/RGBA in SCSS
      const hasRgb = /rgb[a]?\s*\(\s*[\d,\s.]+\s*\)/.test(trimmed);
      if (hasRgb && !isToken) {
        violations.push({
          rule: "scssIntegrity",
          severity: "warn",
          file: relativeFile,
          message: `Hard-coded RGB color found at line ${index + 1}`,
          hint: "Consider extracting to a named SCSS variable or CSS variable",
        });

        globalLogger.info("scssIntegrity", `RGB color in SCSS`, {
          file: relativeFile,
          line: index + 1,
        });
      }
    });
  }

  return {
    rule: "scssIntegrity",
    violations,
  };
}
