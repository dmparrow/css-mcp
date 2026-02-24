import path from "node:path";
import fs from "node:fs";
import chokidar from "chokidar";
import { spawn, ChildProcess } from "node:child_process";
import { getArgValue, resolveRepositoryRoot } from "../helpers.js";

// Rate limiting and process management
const MAX_CONCURRENT_VALIDATIONS = 2;
const DEBOUNCE_DELAY = 300; // ms
const activeProcesses = new Set<ChildProcess>();
const debounceTimers = new Map<string, NodeJS.Timeout>();
let validationQueue: string[] = [];

// Global config for the watch session
let watchConfig: WatchConfig;

interface WatchConfig {
  projectRoot: string;
  contractPath: string | null;
  task: string;
  watchPaths: string[];
}

interface ValidationViolation {
  rule: string;
  severity: "block" | "warn";
  file: string;
  message: string;
  hint?: string;
}

interface ValidationResult {
  repositoryRoot: string;
  contractPath: string;
  task: string;
  changedFiles: string[];
  outcome: "block" | "warn" | "pass";
  violations: ValidationViolation[];
  summary: {
    total: number;
    warnings: number;
    blocks: number;
  };
}

function toPosix(relativePath: string): string {
  return relativePath.replaceAll("\\", "/");
}

// Process cleanup utilities
function killActiveProcesses(): void {
  for (const child of activeProcesses) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  activeProcesses.clear();
}

function setupGracefulShutdown(): void {
  const cleanup = (): void => {
    console.log('\n[watch] Shutting down gracefully...');
    killActiveProcesses();
    process.exit(0);
  };
  
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', killActiveProcesses);
}

// Debounced validation scheduler
function scheduleValidation(changedFile: string): void {
  const existingTimer = debounceTimers.get(changedFile);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  
  const timer = setTimeout(() => {
    debounceTimers.delete(changedFile);
    queueValidation(changedFile);
  }, DEBOUNCE_DELAY);
  
  debounceTimers.set(changedFile, timer);
}

function queueValidation(changedFile: string): void {
  validationQueue = validationQueue.filter(file => file !== changedFile);
  validationQueue.push(changedFile);
  processValidationQueue();
}

function processValidationQueue(): void {
  if (activeProcesses.size >= MAX_CONCURRENT_VALIDATIONS || validationQueue.length === 0) {
    return;
  }
  
  const fileToValidate = validationQueue.shift();
  if (fileToValidate) {
    runValidation(fileToValidate);
  }
}

function extractJsonOutput(rawOutput: string): ValidationResult | null {
  const startIndex = rawOutput.indexOf("{");
  const endIndex = rawOutput.lastIndexOf("}");
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  try {
    return JSON.parse(rawOutput.slice(startIndex, endIndex + 1)) as ValidationResult;
  } catch {
    return null;
  }
}

function runValidation(changedFile: string): void {
  if (!watchConfig.contractPath) {
    console.error("[watch] Error: Contract path is not configured");
    return;
  }

  const filePayload = JSON.stringify([changedFile]);

  console.log(`\n[watch] validating ${changedFile} (active: ${activeProcesses.size})`);

  const child = spawn(
    process.execPath,
    [
      path.resolve(process.cwd(), "dist/cli/index.js"),
      "validate",
      `--repoRoot=${watchConfig.projectRoot}`,
      `--contractPath=${watchConfig.contractPath}`,
      `--task=${watchConfig.task}`,
      `--changedFiles=${filePayload}`,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  activeProcesses.add(child);

  let stdout = "";
  let stderr = "";
  
  child.stdout?.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    stdout += text;
    process.stdout.write(text);
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    const text = chunk.toString();
    stderr += text;
    process.stderr.write(text);
  });

  child.on("exit", (code: number | null, signal: NodeJS.Signals | null) => {
    activeProcesses.delete(child);
    
    if (!signal) {
      const parsed = extractJsonOutput(stdout);
      if (parsed?.outcome === "block") {
        const blockingViolations = (parsed.violations ?? []).filter(
          (violation: ValidationViolation) => violation.severity === "block" && violation.file === changedFile,
        );

        if (blockingViolations.length > 0) {
          console.log(`[watch] AGENT_ACTION_REQUIRED ${changedFile}`);
          console.log("[watch] Blocking violations:");
          for (const violation of blockingViolations) {
            console.log(`  - ${violation.rule}: ${violation.message}`);
            if (violation.hint) {
              console.log(`    hint: ${violation.hint}`);
            }
          }
        }
      }
    }
    
    setTimeout(processValidationQueue, 10);
  });

  child.on("error", (error: Error) => {
    console.error(`[watch] Validation process error for ${changedFile}:`, error.message);
    activeProcesses.delete(child);
    setTimeout(processValidationQueue, 10);
  });
}

function parseWatchArgs(args: string[]): Partial<WatchConfig> {
  const config: Partial<WatchConfig> = {};
  
  const task = getArgValue(args, "--task");
  if (task) config.task = task;
  
  const watchPaths = getArgValue(args, "--watch-paths");
  if (watchPaths) {
    config.watchPaths = watchPaths.split(",").map(p => p.trim());
  }
  
  return config;
}

function findContractPath(projectRoot: string): string | null {
  const possiblePaths = [
    path.join(projectRoot, "contract/agent-css-contract.v1.json"),
    path.join(projectRoot, "agent-css-contract.v1.json")
  ];
  
  for (const contractPath of possiblePaths) {
    try {
      if (fs.existsSync(contractPath)) {
        return contractPath;
      }
    } catch {
      continue;
    }
  }
  
  return null;
}

function validateWatchConfig(config: WatchConfig): void {
  if (!config.contractPath) {
    console.error("[watch] Error: Could not find agent-css-contract.v1.json");
    console.error("[watch] Please specify --contractPath or place the contract in:");
    console.error("[watch]   - ./contract/agent-css-contract.v1.json");
    console.error("[watch]   - ./agent-css-contract.v1.json");
    process.exit(1);
  }
  
  try {
    if (!fs.existsSync(config.contractPath)) {
      console.error(`[watch] Error: Contract file not found: ${config.contractPath}`);
      process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[watch] Error reading contract file: ${errorMessage}`);
    process.exit(1);
  }
}

function isStyleFile(filePath: string): boolean {
  return filePath.endsWith(".css") || filePath.endsWith(".scss") || filePath.endsWith(".sass");
}

function toRepoRelativePosix(filePath: string, projectRoot: string): string {
  return toPosix(path.relative(projectRoot, filePath));
}

export function runWatchCommand(args: string[]): number {
  const cwd = process.cwd();
  const repositoryRoot = getArgValue(args, "--repoRoot")
    ? path.resolve(cwd, getArgValue(args, "--repoRoot") as string)
    : resolveRepositoryRoot(cwd);
    
  const contractPath = getArgValue(args, "--contractPath") || findContractPath(repositoryRoot);
  
  const parsedConfig = parseWatchArgs(args);
  
  watchConfig = {
    projectRoot: repositoryRoot,
    contractPath,
    task: parsedConfig.task || "component-add",
    watchPaths: parsedConfig.watchPaths || ["src"]
  };
  
  validateWatchConfig(watchConfig);
  
  console.log("[watch] Arrow Stack CSS validation watch started");
  console.log(`[watch] Project root: ${watchConfig.projectRoot}`);
  console.log(`[watch] Contract: ${watchConfig.contractPath}`);
  console.log(`[watch] Task: ${watchConfig.task}`);
  console.log(`[watch] Max concurrent validations: ${MAX_CONCURRENT_VALIDATIONS}`);
  console.log(`[watch] Debounce delay: ${DEBOUNCE_DELAY}ms`);
  console.log(`[watch] Watching: ${watchConfig.watchPaths.map(p => `${p}/**/*.{css,scss,sass}`).join(", ")}`);

  setupGracefulShutdown();

  const watchPaths = watchConfig.watchPaths.map(p => path.join(watchConfig.projectRoot, p));
  const watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50
    }
  });

  watcher
    .on("change", (filePath: string) => {
      if (isStyleFile(filePath)) {
        scheduleValidation(toRepoRelativePosix(filePath, watchConfig.projectRoot));
      }
    })
    .on("add", (filePath: string) => {
      if (isStyleFile(filePath)) {
        scheduleValidation(toRepoRelativePosix(filePath, watchConfig.projectRoot));
      }
    })
    .on("unlink", (filePath: string) => {
      if (isStyleFile(filePath)) {
        scheduleValidation(toRepoRelativePosix(filePath, watchConfig.projectRoot));
      }
    })
    .on("error", (error: unknown) => {
      console.error("[watch] Watcher error:", error);
    });

  // Keep the process running
  return 0;
}