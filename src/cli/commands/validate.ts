import path from "node:path";
import { loadContract } from "../../contract/loadContract.js";
import { validatePatch } from "../../engine/validatePatch.js";
import type { ValidationContext } from "../../engine/types.js";
import { getArgValue, getChangedFiles, resolveRepositoryRoot } from "../helpers.js";

export function runValidateCommand(args: string[]): number {
  const cwd = process.cwd();
  const repositoryRoot = getArgValue(args, "--repoRoot")
    ? path.resolve(cwd, getArgValue(args, "--repoRoot") as string)
    : resolveRepositoryRoot(cwd);
  const contractPath = getArgValue(args, "--contractPath");

  const task = (getArgValue(args, "--task") ?? "full") as ValidationContext["task"];

  const filesArg = getArgValue(args, "--files");
  const files = filesArg
    ? filesArg
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : getChangedFiles(repositoryRoot);

  const context: ValidationContext = {
    repositoryRoot,
    task,
    changedFiles: files,
  };

  const contract = loadContract(repositoryRoot, contractPath);
  const result = validatePatch(context, contract);

  const output = {
    repositoryRoot: path.relative(cwd, repositoryRoot) || ".",
    contractPath: contractPath ?? "contract/agent-css-contract.v1.json",
    task,
    changedFiles: files,
    ...result,
  };

  console.log(JSON.stringify(output, null, 2));

  return result.outcome === "block" ? 2 : 0;
}
