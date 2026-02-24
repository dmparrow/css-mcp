import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runTokenUsageRule } from "../../src/engine/rules/tokenUsage.js";
import type { AgentCssContract } from "../../src/engine/types.js";

const tmpRoots: string[] = [];

function makeContract(scanPaths: string[]): AgentCssContract {
  return {
    version: "1.0.0",
    project: "Test",
    tokenUsage: { scanPaths },
    themeVariables: {
      count: 1,
      writeSurface: ["css/theme.config.css"],
      variables: ["--cfg-brand"],
    },
    taskWriteSurfaces: {
      "theme-edit": ["**"],
      "component-add": ["**"],
      full: ["**"],
    },
    layerInvariants: {
      mainCss: "css/main.css",
      requiredImports: [],
      requiredLayers: [],
    },
    componentApi: {
      dataAttributes: [],
    },
  };
}

function makeTempRepo(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "arrow-token-usage-"));
  tmpRoots.push(root);
  return root;
}

afterEach(() => {
  for (const root of tmpRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe("token usage rule", () => {
  it("scans framework paths configured by contract globs", () => {
    const repositoryRoot = makeTempRepo();
    const reactFile = path.join(repositoryRoot, "src", "components", "Button.module.css");
    fs.mkdirSync(path.dirname(reactFile), { recursive: true });
    fs.writeFileSync(reactFile, ".button { color: #ff0000; }\n", "utf8");

    const result = runTokenUsageRule(
      {
        repositoryRoot,
        task: "full",
        changedFiles: [],
      },
      makeContract(["src/**/*.css"]),
    );

    expect(result.violations.length).toBe(1);
    expect(result.violations[0].file).toBe("src/components/Button.module.css");
  });

  it("does not scan files outside configured token usage paths", () => {
    const repositoryRoot = makeTempRepo();
    const reactFile = path.join(repositoryRoot, "src", "components", "Button.module.css");
    fs.mkdirSync(path.dirname(reactFile), { recursive: true });
    fs.writeFileSync(reactFile, ".button { color: #ff0000; }\n", "utf8");

    const result = runTokenUsageRule(
      {
        repositoryRoot,
        task: "full",
        changedFiles: [],
      },
      makeContract(["css/components/**"]),
    );

    expect(result.violations.length).toBe(0);
  });
});
