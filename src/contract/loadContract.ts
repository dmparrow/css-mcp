import fs from "node:fs";
import path from "node:path";
import type { AgentCssContract } from "../engine/types.js";

export function loadContract(repositoryRoot: string, contractPathArg?: string): AgentCssContract {
  const contractPath = contractPathArg
    ? path.resolve(repositoryRoot, contractPathArg)
    : path.join(repositoryRoot, "contract", "agent-css-contract.v1.json");

  if (!fs.existsSync(contractPath)) {
    throw new Error(`Contract file not found: ${contractPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(contractPath, "utf8")) as AgentCssContract;

  if (!parsed.version || !parsed.tokenUsage || !parsed.themeVariables || !parsed.taskWriteSurfaces) {
    throw new Error("Invalid contract shape: missing required top-level fields");
  }

  return parsed;
}
