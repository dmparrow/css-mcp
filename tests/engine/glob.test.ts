import { describe, expect, it } from "vitest";
import { globLikeMatch } from "../../src/engine/glob.js";

describe("glob matching utility", () => {
  it("matches exact file paths", () => {
    expect(globLikeMatch("src/style.css", "src/style.css")).toBe(true);
    expect(globLikeMatch("src/style.css", "src/other.css")).toBe(false);
  });

  it("matches wildcard patterns", () => {
    expect(globLikeMatch("src/components/Button.tsx", "src/components/*.tsx")).toBe(true);
    expect(globLikeMatch("src/components/Button.css", "src/components/*.tsx")).toBe(false);
  });

  it("matches double-star patterns", () => {
    expect(globLikeMatch("src/styles/button.css", "src/**/*.css")).toBe(true);
    expect(globLikeMatch("src/button.css", "src/**/*.css")).toBe(true);
    expect(globLikeMatch("dist/button.css", "src/**/*.css")).toBe(false);
  });

  it("matches directory prefix patterns", () => {
    expect(globLikeMatch("node_modules/package/index.js", "node_modules/**")).toBe(true);
    expect(globLikeMatch("dist/bundle.js", "dist/**")).toBe(true);
    expect(globLikeMatch("src/index.js", "dist/**")).toBe(false);
  });

  it("matches catch-all pattern", () => {
    expect(globLikeMatch("any/path/file.txt", "**")).toBe(true);
  });

  it("handles path normalization", () => {
    expect(globLikeMatch("src\\components\\Button.tsx", "src/**/Button.tsx")).toBe(true);
  });
});
