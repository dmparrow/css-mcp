import path from "node:path";
import { loadContract } from "../../contract/loadContract.js";
import { validatePatch } from "../../engine/validatePatch.js";
import type { ValidationContext } from "../../engine/types.js";
import { getArgValue, getChangedFiles, resolveRepositoryRoot } from "../helpers.js";

export function runExplainCommand(args: string[]): number {
  const cwd = process.cwd();
  const repositoryRoot = getArgValue(args, "--repoRoot")
    ? path.resolve(cwd, getArgValue(args, "--repoRoot") as string)
    : resolveRepositoryRoot(cwd);
  const contractPath = getArgValue(args, "--contractPath");
  const task = (getArgValue(args, "--task") ?? "full") as ValidationContext["task"];

  const filesArg = getArgValue(args, "--files");
  const changedFiles = filesArg
    ? filesArg
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : getChangedFiles(repositoryRoot);

  const result = validatePatch(
    {
      repositoryRoot,
      task,
      changedFiles,
    },
    loadContract(repositoryRoot, contractPath),
  );

  if (result.violations.length === 0) {
    console.log("No violations found. Policy outcome: pass");
    return 0;
  }

  console.log(`Policy outcome: ${result.outcome}`);
  console.log(`Violations: ${result.summary.total} (warn=${result.summary.warnings}, block=${result.summary.blocks})`);
  console.log("");

  for (const violation of result.violations) {
    console.log(`[${violation.severity.toUpperCase()}] ${violation.rule}: ${violation.message}`);
    if (violation.file) {
      console.log(`  file: ${violation.file}`);
    }
    if (violation.hint) {
      console.log(`  hint: ${violation.hint}`);
    }
  }

  return result.outcome === "block" ? 2 : 0;
}
