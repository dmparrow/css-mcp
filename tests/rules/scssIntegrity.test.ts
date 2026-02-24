import { describe, expect, it } from "vitest";
import { runScssRuleIntegrity } from "../../src/engine/rules/scssIntegrity.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("SCSS integrity rule", () => {
  it("detects hard-coded hex colors in SCSS files", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "scss-test-"));
    const srcDir = path.join(tmpDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    const scssFile = path.join(srcDir, "styles.scss");
    fs.writeFileSync(
      scssFile,
      `
.button {
  color: #ff0000;
  background: #fff;
}
`,
    );

    const result = runScssRuleIntegrity({
      repositoryRoot: tmpDir,
      task: "full",
      changedFiles: [],
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });

    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.file.includes("styles.scss"))).toBe(true);
  });

  it("ignores SCSS variables and CSS variables", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "scss-test-"));
    const srcDir = path.join(tmpDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    const scssFile = path.join(srcDir, "styles.scss");
    fs.writeFileSync(
      scssFile,
      `
$primary-color: #1c4b47;
$secondary: var(--color-secondary);

.button {
  color: var(--color-primary);
  background: $primary-color;
}
`,
    );

    const result = runScssRuleIntegrity({
      repositoryRoot: tmpDir,
      task: "full",
      changedFiles: [],
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });

    expect(result.violations.length).toBe(0);
  });

  it("warns on hard-coded RGB colors", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "scss-test-"));
    const srcDir = path.join(tmpDir, "src");
    fs.mkdirSync(srcDir, { recursive: true });

    const scssFile = path.join(srcDir, "styles.scss");
    fs.writeFileSync(
      scssFile,
      `
.button {
  color: rgb(255, 0, 0);
  background: rgba(255, 255, 255, 0.5);
}
`,
    );

    const result = runScssRuleIntegrity({
      repositoryRoot: tmpDir,
      task: "full",
      changedFiles: [],
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });

    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.severity === "warn")).toBe(true);
  });
});
