import { describe, expect, it } from "vitest";
import path from "node:path";
import { loadContract } from "../../src/contract/loadContract.js";
import { runFileBoundariesRule } from "../../src/engine/rules/fileBoundaries.js";

describe("file boundaries rule", () => {
  it("blocks file outside theme-edit surface", () => {
    const repositoryRoot = path.resolve(__dirname, "../..");
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

  describe("path normalization", () => {
    const repositoryRoot = path.resolve(__dirname, "../..");
    const contract = loadContract(repositoryRoot);

    it("normalizes leading ./ in Unix-style paths", () => {
      const result = runFileBoundariesRule(
        {
          repositoryRoot,
          task: "component-add",
          changedFiles: ["./css/components/button.css"],
        },
        contract,
      );

      // Should match css/components/** pattern, so no violations
      expect(result.violations.length).toBe(0);
    });

    it("normalizes Windows-style backslashes", () => {
      const result = runFileBoundariesRule(
        {
          repositoryRoot,
          task: "component-add",
          changedFiles: ["css\\components\\button.css"],
        },
        contract,
      );

      // Should match css/components/** pattern, so no violations
      expect(result.violations.length).toBe(0);
    });

    it("normalizes combined: leading ./ with backslashes", () => {
      const result = runFileBoundariesRule(
        {
          repositoryRoot,
          task: "component-add",
          changedFiles: [".\\css\\components\\button.css"],
        },
        contract,
      );

      // Should match css/components/** pattern, so no violations
      expect(result.violations.length).toBe(0);
    });

    it("rejects absolute paths with clear hint", () => {
      const absolutePath = `/home/user/project/css/components/button.css`;
      const result = runFileBoundariesRule(
        {
          repositoryRoot,
          task: "component-add",
          changedFiles: [absolutePath],
        },
        contract,
      );

      // Absolute paths won't match any relative pattern, so violation
      expect(result.violations.length).toBeGreaterThan(0);
      const violation = result.violations[0];
      expect(violation.file).toContain("home/user/project");
    });

    it("handles multiple files with mixed normalization", () => {
      const result = runFileBoundariesRule(
        {
          repositoryRoot,
          task: "component-add",
          changedFiles: [
            "css/components/button.css",     // already normalized
            "./css/components/input.css",    // leading ./
            "css\\components\\output.css",   // Windows backslashes
          ],
        },
        contract,
      );

      // All three should match css/components/**
      expect(result.violations.length).toBe(0);
    });

    it("reports unknown task with contract violation", () => {
      const result = runFileBoundariesRule(
        {
          repositoryRoot,
          task: "unknown-task",
          changedFiles: ["css/components/button.css"],
        },
        contract,
      );

      expect(result.violations.length).toBe(1);
      expect(result.violations[0].severity).toBe("block");
      expect(result.violations[0].file).toBe("contract");
      expect(result.violations[0].message).toContain("not found in taskWriteSurfaces");
      expect(result.violations[0].hint).toContain("Available tasks");
    });
  });
});
