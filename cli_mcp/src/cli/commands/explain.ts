import { loadContract } from "../../contract/loadContract.js";
import { validatePatch } from "../../engine/validatePatch.js";
import type { ValidationContext } from "../../engine/types.js";
import { getChangedFiles, resolveRepositoryRoot } from "../helpers.js";

export function runExplainCommand(args: string[]): number {
  const repositoryRoot = resolveRepositoryRoot(process.cwd());
  const taskArg = args.find((arg) => arg.startsWith("--task="));
  const task = (taskArg?.split("=")[1] ?? "full") as ValidationContext["task"];

  const filesArg = args.find((arg) => arg.startsWith("--files="));
  const changedFiles = filesArg
    ? filesArg
        .split("=")[1]
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
    loadContract(repositoryRoot),
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
