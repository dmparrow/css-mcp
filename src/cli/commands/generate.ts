import fs from "node:fs";
import path from "node:path";
import { loadContract } from "../../contract/loadContract.js";
import { getArgValue, resolveRepositoryRoot } from "../helpers.js";

export function runGenerateCommand(args: string[] = []): number {
  const cwd = process.cwd();
  const repositoryRoot = getArgValue(args, "--repoRoot")
    ? path.resolve(cwd, getArgValue(args, "--repoRoot") as string)
    : resolveRepositoryRoot(cwd);
  const contractPath = getArgValue(args, "--contractPath");
  const contract = loadContract(repositoryRoot, contractPath);

  const generatedDir = path.join(repositoryRoot, "contract", "generated");
  fs.mkdirSync(generatedDir, { recursive: true });

  const runtimeHintsPath = path.join(generatedDir, "agent-runtime-hints.json");
  const runtimeHints = {
    version: contract.version,
    project: contract.project,
    taskWriteSurfaces: contract.taskWriteSurfaces,
    dataAttributes: contract.componentApi.dataAttributes,
    themeVariables: contract.themeVariables.variables,
  };
  fs.writeFileSync(runtimeHintsPath, JSON.stringify(runtimeHints, null, 2) + "\n", "utf8");

  const reportSchemaPath = path.join(generatedDir, "policy-report.schema.json");
  const reportSchema = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    type: "object",
    required: ["outcome", "violations", "summary"],
    properties: {
      outcome: { enum: ["pass", "warn", "block"] },
      violations: {
        type: "array",
        items: {
          type: "object",
          required: ["rule", "severity", "message"],
          properties: {
            rule: { type: "string" },
            severity: { enum: ["info", "warn", "block"] },
            message: { type: "string" },
            file: { type: "string" },
            hint: { type: "string" },
          },
        },
      },
      summary: {
        type: "object",
        required: ["total", "warnings", "blocks"],
        properties: {
          total: { type: "integer" },
          warnings: { type: "integer" },
          blocks: { type: "integer" },
        },
      },
    },
  };
  fs.writeFileSync(reportSchemaPath, JSON.stringify(reportSchema, null, 2) + "\n", "utf8");

  console.log(`Generated ${path.relative(repositoryRoot, runtimeHintsPath)}`);
  console.log(`Generated ${path.relative(repositoryRoot, reportSchemaPath)}`);

  return 0;
}
