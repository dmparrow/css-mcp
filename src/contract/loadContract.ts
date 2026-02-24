import fs from "node:fs";
import path from "node:path";
import type { AgentCssContract } from "../engine/types.js";

function validateContractShape(contract: unknown): contract is AgentCssContract {
  if (typeof contract !== "object" || contract === null) {
    throw new Error("Contract must be an object");
  }

  const obj = contract as Record<string, unknown>;

  // Check required top-level fields
  if (!obj.version || typeof obj.version !== "string") {
    throw new Error("Contract missing or invalid 'version' field (string required)");
  }

  if (!obj.project || typeof obj.project !== "string") {
    throw new Error("Contract missing or invalid 'project' field (string required)");
  }

  if (!obj.tokenUsage || typeof obj.tokenUsage !== "object") {
    throw new Error("Contract missing or invalid 'tokenUsage' field (object required)");
  }

  const tokenUsage = obj.tokenUsage as Record<string, unknown>;
  if (!Array.isArray(tokenUsage.scanPaths) || tokenUsage.scanPaths.length === 0) {
    throw new Error("tokenUsage.scanPaths must be a non-empty array of strings");
  }

  if (!obj.themeVariables || typeof obj.themeVariables !== "object") {
    throw new Error("Contract missing or invalid 'themeVariables' field (object required)");
  }

  const themeVars = obj.themeVariables as Record<string, unknown>;
  if (typeof themeVars.count !== "number" || themeVars.count < 0) {
    throw new Error("themeVariables.count must be a non-negative number");
  }

  if (!Array.isArray(themeVars.writeSurface)) {
    throw new Error("themeVariables.writeSurface must be an array");
  }

  if (!Array.isArray(themeVars.variables)) {
    throw new Error("themeVariables.variables must be an array");
  }

  if (!obj.taskWriteSurfaces || typeof obj.taskWriteSurfaces !== "object") {
    throw new Error("Contract missing or invalid 'taskWriteSurfaces' field (object required)");
  }

  const taskSurfaces = obj.taskWriteSurfaces as Record<string, unknown>;
  for (const [task, patterns] of Object.entries(taskSurfaces)) {
    if (!Array.isArray(patterns)) {
      throw new Error(`taskWriteSurfaces['${task}'] must be an array of strings`);
    }
  }

  if (!obj.layerInvariants || typeof obj.layerInvariants !== "object") {
    throw new Error("Contract missing or invalid 'layerInvariants' field (object required)");
  }

  const layers = obj.layerInvariants as Record<string, unknown>;
  if (typeof layers.mainCss !== "string") {
    throw new Error("layerInvariants.mainCss must be a string");
  }

  if (!Array.isArray(layers.requiredImports)) {
    throw new Error("layerInvariants.requiredImports must be an array");
  }

  if (!Array.isArray(layers.requiredLayers)) {
    throw new Error("layerInvariants.requiredLayers must be an array");
  }

  if (!obj.componentApi || typeof obj.componentApi !== "object") {
    throw new Error("Contract missing or invalid 'componentApi' field (object required)");
  }

  const compApi = obj.componentApi as Record<string, unknown>;
  if (!Array.isArray(compApi.dataAttributes)) {
    throw new Error("componentApi.dataAttributes must be an array");
  }

  return true;
}

export function loadContract(repositoryRoot: string, contractPathArg?: string): AgentCssContract {
  const contractPath = contractPathArg
    ? path.resolve(repositoryRoot, contractPathArg)
    : path.join(repositoryRoot, "contract", "agent-css-contract.v1.json");

  if (!fs.existsSync(contractPath)) {
    throw new Error(`Contract file not found: ${contractPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(contractPath, "utf8")) as unknown;

  if (!validateContractShape(parsed)) {
    throw new Error("Invalid contract shape after validation");
  }

  return parsed;
}
