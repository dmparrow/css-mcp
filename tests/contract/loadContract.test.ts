import { describe, expect, it } from "vitest";
import { loadContract } from "../../src/contract/loadContract.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("contract validation", () => {
  it("loads valid contract successfully", () => {
    const repositoryRoot = path.resolve(__dirname, "../..");
    const contract = loadContract(repositoryRoot);

    expect(contract.version).toBeDefined();
    expect(contract.project).toBeDefined();
    expect(contract.tokenUsage).toBeDefined();
    expect(contract.tokenUsage.scanPaths.length).toBeGreaterThan(0);
    expect(contract.themeVariables).toBeDefined();
    expect(contract.taskWriteSurfaces).toBeDefined();
    expect(contract.layerInvariants).toBeDefined();
    expect(contract.componentApi).toBeDefined();
  });

  it("rejects contract with missing version", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "contract-test-"));
    const contractFile = path.join(tmpDir, "contract.json");

    fs.writeFileSync(
      contractFile,
      JSON.stringify({
        project: "Test",
        tokenUsage: { scanPaths: ["src/**"] },
        themeVariables: { count: 0, writeSurface: [], variables: [] },
        taskWriteSurfaces: {},
        layerInvariants: { mainCss: "main.css", requiredImports: [], requiredLayers: [] },
        componentApi: { dataAttributes: [] },
      }),
    );

    try {
      expect(() => loadContract(tmpDir, "contract.json")).toThrow("version");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects contract with invalid tokenUsage.scanPaths", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "contract-test-"));
    const contractFile = path.join(tmpDir, "contract.json");

    fs.writeFileSync(
      contractFile,
      JSON.stringify({
        version: "1.0.0",
        project: "Test",
        tokenUsage: { scanPaths: [] }, // Empty!
        themeVariables: { count: 0, writeSurface: [], variables: [] },
        taskWriteSurfaces: {},
        layerInvariants: { mainCss: "main.css", requiredImports: [], requiredLayers: [] },
        componentApi: { dataAttributes: [] },
      }),
    );

    try {
      expect(() => loadContract(tmpDir, "contract.json")).toThrow("scanPaths");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("rejects contract with invalid themeVariables.count", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "contract-test-"));
    const contractFile = path.join(tmpDir, "contract.json");

    fs.writeFileSync(
      contractFile,
      JSON.stringify({
        version: "1.0.0",
        project: "Test",
        tokenUsage: { scanPaths: ["src/**"] },
        themeVariables: { count: "not-a-number", writeSurface: [], variables: [] },
        taskWriteSurfaces: {},
        layerInvariants: { mainCss: "main.css", requiredImports: [], requiredLayers: [] },
        componentApi: { dataAttributes: [] },
      }),
    );

    try {
      expect(() => loadContract(tmpDir, "contract.json")).toThrow("count");
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it("accepts optional logging field", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "contract-test-"));
    const contractFile = path.join(tmpDir, "contract.json");

    fs.writeFileSync(
      contractFile,
      JSON.stringify({
        version: "1.0.0",
        project: "Test",
        tokenUsage: { scanPaths: ["src/**"] },
        logging: { enabled: true, level: "debug" },
        themeVariables: { count: 0, writeSurface: [], variables: [] },
        taskWriteSurfaces: {},
        layerInvariants: { mainCss: "main.css", requiredImports: [], requiredLayers: [] },
        componentApi: { dataAttributes: [] },
      }),
    );

    try {
      const contract = loadContract(tmpDir, "contract.json");
      expect(contract.logging?.enabled).toBe(true);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
