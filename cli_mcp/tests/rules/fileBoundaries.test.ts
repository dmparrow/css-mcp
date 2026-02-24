import { describe, expect, it } from "vitest";
import path from "node:path";
import { loadContract } from "../../src/contract/loadContract.js";
import { runFileBoundariesRule } from "../../src/engine/rules/fileBoundaries.js";

describe("file boundaries rule", () => {
  it("blocks file outside theme-edit surface", () => {
    const repositoryRoot = path.resolve(__dirname, "../../..");
    const result = runFileBoundariesRule(
      {
        repositoryRoot,
        task: "theme-edit",
        changedFiles: ["css/components/buttons.css"],
      },
      loadContract(repositoryRoot),
    );

    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].severity).toBe("block");
  });
});
