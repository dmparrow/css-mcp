import { describe, expect, it } from "vitest";
import path from "node:path";
import { validatePatchIntent } from "../../src/mcp/tools/validatePatchIntent.js";
import { loadContract } from "../../src/contract/loadContract.js";
import { validatePatch } from "../../src/engine/validatePatch.js";

describe("CLI/MCP parity", () => {
  it("returns same outcome for same input", () => {
    const repositoryRoot = path.resolve(__dirname, "../..");
    const context = {
      repositoryRoot,
      task: "theme-edit" as const,
      changedFiles: ["css/theme.config.css"],
    };

    const engineResult = validatePatch(context, loadContract(repositoryRoot));
    const mcpResult = validatePatchIntent(context);

    expect(mcpResult.outcome).toBe(engineResult.outcome);
    expect(mcpResult.summary.total).toBe(engineResult.summary.total);
  });
});
