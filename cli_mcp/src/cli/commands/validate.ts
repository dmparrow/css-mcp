import path from "node:path";
import { loadContract } from "../../contract/loadContract.js";
import { validatePatch } from "../../engine/validatePatch.js";
import type { ValidationContext } from "../../engine/types.js";
import { getChangedFiles, resolveRepositoryRoot } from "../helpers.js";

export function runValidateCommand(args: string[]): number {
  const cwd = process.cwd();
  const repositoryRoot = resolveRepositoryRoot(cwd);

  const taskArg = args.find((arg) => arg.startsWith("--task="));
  const task = (taskArg?.split("=")[1] ?? "full") as ValidationContext["task"];

  const filesArg = args.find((arg) => arg.startsWith("--files="));
  const files = filesArg
    ? filesArg
        .split("=")[1]
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean)
    : getChangedFiles(repositoryRoot);

  const context: ValidationContext = {
    repositoryRoot,
    task,
    changedFiles: files,
  };

  const contract = loadContract(repositoryRoot);
  const result = validatePatch(context, contract);

  const output = {
    repositoryRoot: path.relative(cwd, repositoryRoot) || ".",
    task,
    changedFiles: files,
    ...result,
  };

  console.log(JSON.stringify(output, null, 2));

  return result.outcome === "block" ? 2 : 0;
}
