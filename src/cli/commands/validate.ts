import path from "node:path";
import fs from "node:fs";
import { loadContract } from "../../contract/loadContract.js";
import { validatePatch } from "../../engine/validatePatch.js";
import type { ValidationContext } from "../../engine/types.js";
import { getArgValue, getChangedFiles, resolveRepositoryRoot } from "../helpers.js";

function writeStatusArtifact(repositoryRoot: string, contractPath: string, task: string, validationResult: any, changedFiles: string[]): void {
  try {
    const artifactDir = path.join(repositoryRoot, ".arrow-stack");
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }

    const statusArtifact = {
      timestamp: new Date().toISOString(),
      changedFiles,
      validation: validationResult,
      summary: {
        outcome: validationResult.outcome,
        totalViolations: validationResult.summary.total,
        blockingViolations: validationResult.summary.blocks,
        warningViolations: validationResult.summary.warnings,
        filesValidated: changedFiles.length,
      },
      environment: {
        projectRoot: repositoryRoot,
        contractPath,
        task,
      },
    };

    const artifactPath = path.join(artifactDir, "validation-status.json");
    fs.writeFileSync(artifactPath, JSON.stringify(statusArtifact, null, 2));
    
    console.error(`[validate] Status artifact written: ${path.relative(repositoryRoot, artifactPath)}`);
  } catch (error) {
    console.error("[validate] Failed to write status artifact:", error);
  }
}

export function runValidateCommand(args: string[]): number {
  const cwd = process.cwd();
  const repositoryRoot = getArgValue(args, "--repoRoot")
    ? path.resolve(cwd, getArgValue(args, "--repoRoot") as string)
    : resolveRepositoryRoot(cwd);
  const contractPath = getArgValue(args, "--contractPath");
  const format = getArgValue(args, "--format");

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

  // Write status artifact
  writeStatusArtifact(repositoryRoot, contractPath ?? "contract/agent-css-contract.v1.json", task, result, files);

  if (format === "json") {
    // Clean JSON output for programmatic consumption
    console.log(JSON.stringify(output, null, 2));
  } else {
    // Default output with sentinels for robust parsing
    console.log("---JSON-START---");
    console.log(JSON.stringify(output, null, 2));
    console.log("---JSON-END---");
  }

  return result.outcome === "block" ? 2 : 0;
}
