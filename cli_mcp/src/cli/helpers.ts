import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export function resolveRepositoryRoot(startDir: string): string {
  let current = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(current, "AGENT_API.md"))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return startDir;
    }
    current = parent;
  }
}

export function getChangedFiles(repositoryRoot: string): string[] {
  try {
    const output = execSync("git diff --name-only", { cwd: repositoryRoot, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();

    if (!output) {
      return [];
    }

    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

export function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}
