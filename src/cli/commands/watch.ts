import path from "node:path";
import fs from "node:fs";
import chokidar from "chokidar";
import { spawn, ChildProcess } from "node:child_process";
import { getArgValue, resolveRepositoryRoot } from "../helpers.js";

interface QueuedValidation {
  file: string;
  task?: string;
}

// Rate limiting and process management
const MAX_CONCURRENT_VALIDATIONS = 2;
const DEBOUNCE_DELAY = 300; // ms
const activeProcesses = new Set<ChildProcess>();
const debounceTimers = new Map<string, NodeJS.Timeout>();
let validationQueue: QueuedValidation[] = [];

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

function normRelPosix(p: string): string {
  return p.replaceAll("\\", "/").replace(/^\.\//, "");
}

function writeStatusArtifact(validationResult: ValidationResult, changedFile: string, exitCode: number | null): void {
  try {
    const artifactDir = path.join(watchConfig.projectRoot, ".arrow-stack");
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }

    const statusArtifact = {
      timestamp: new Date().toISOString(),
      changedFile,
      exitCode,
      validation: validationResult,
      summary: {
        outcome: validationResult.outcome,
        totalViolations: validationResult.summary.total,
        blockingViolations: validationResult.summary.blocks,
        warningViolations: validationResult.summary.warnings,
        filesValidated: validationResult.changedFiles.length,
      },
      environment: {
        projectRoot: watchConfig.projectRoot,
        contractPath: watchConfig.contractPath,
        task: watchConfig.task,
      },
    };

    const artifactPath = path.join(artifactDir, "validation-status.json");
    fs.writeFileSync(artifactPath, JSON.stringify(statusArtifact, null, 2));
    
    console.log(`[watch] Status artifact written: ${path.relative(watchConfig.projectRoot, artifactPath)}`);
  } catch (error) {
    console.error("[watch] Failed to write status artifact:", error);
  }
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

function scheduleValidation(changedFile: string, task?: string): void {
  console.log(`[watch] Scheduling validation for: ${changedFile} (task: ${task || 'default'})`);
  const key = `${changedFile}:${task || 'default'}`;
  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
    console.log(`[watch] Clearing existing timer for: ${key}`);
  }
  
  const timer = setTimeout(() => {
    console.log(`[watch] Debounce complete, queuing validation for: ${changedFile}`);
    debounceTimers.delete(key);
    queueValidation(changedFile, task);
  }, DEBOUNCE_DELAY);
  
  debounceTimers.set(key, timer);
}

function queueValidation(changedFile: string, task?: string): void {
  console.log(`[watch] Queueing validation for: ${changedFile} (task: ${task || 'default'})`);
  // Remove existing entry with same file AND task
  validationQueue = validationQueue.filter(
    item => !(item.file === changedFile && (item.task || 'default') === (task || 'default'))
  );
  validationQueue.push({ file: changedFile, task });
  console.log(`[watch] Queue size: ${validationQueue.length}`);
  processValidationQueue();
}

function processValidationQueue(): void {
  while (activeProcesses.size < MAX_CONCURRENT_VALIDATIONS && validationQueue.length > 0) {
    const item = validationQueue.shift();
    if (!item) break;
    runValidation(item.file, item.task);
  }
}

function extractJsonOutput(rawOutput: string): ValidationResult | null {
  // First try to parse as clean JSON (from --format=json)
  try {
    const parsed = JSON.parse(rawOutput.trim());
    if (parsed && 
        typeof parsed === 'object' && 
        'outcome' in parsed && 
        'violations' in parsed &&
        'summary' in parsed) {
      return parsed as ValidationResult;
    }
  } catch {
    // Continue to sentinel parsing for backward compatibility
  }

  // Try sentinel-based parsing (legacy format)
  const startMarker = "---JSON-START---";
  const endMarker = "---JSON-END---";
  
  const startIndex = rawOutput.indexOf(startMarker);
  const endIndex = rawOutput.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    // Fallback to legacy parsing for older CLI versions
    return extractJsonOutputLegacy(rawOutput);
  }
  
  const jsonStart = startIndex + startMarker.length;
  const jsonText = rawOutput.slice(jsonStart, endIndex).trim();
  
  try {
    const parsed = JSON.parse(jsonText);
    // Validate that it looks like a ValidationResult
    if (parsed && 
        typeof parsed === 'object' && 
        'outcome' in parsed && 
        'violations' in parsed &&
        'summary' in parsed) {
      return parsed as ValidationResult;
    }
  } catch (error) {
    console.error("[watch] Failed to parse JSON between sentinels:", error);
  }
  
  return null;
}

function extractJsonOutputLegacy(rawOutput: string): ValidationResult | null {
  // Try to find JSON objects in the output
  const lines = rawOutput.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        // Validate that it looks like a ValidationResult
        if (parsed && 
            typeof parsed === 'object' && 
            'outcome' in parsed && 
            'violations' in parsed &&
            'summary' in parsed) {
          return parsed as ValidationResult;
        }
      } catch {
        // Continue to next line
        continue;
      }
    }
  }
  
  // Fallback: try to parse the entire output as JSON
  try {
    const parsed = JSON.parse(rawOutput.trim());
    if (parsed && 
        typeof parsed === 'object' && 
        'outcome' in parsed && 
        'violations' in parsed &&
        'summary' in parsed) {
      return parsed as ValidationResult;
    }
  } catch {
    // Final fallback: try the original brittle method
    const startIndex = rawOutput.indexOf("{");
    const endIndex = rawOutput.lastIndexOf("}");
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      try {
        return JSON.parse(rawOutput.slice(startIndex, endIndex + 1)) as ValidationResult;
      } catch {
        // Give up
      }
    }
  }
  
  return null;
}

function createValidationProcess(changedFile: string, taskOverride?: string): ChildProcess {
  const filePayload = JSON.stringify([changedFile]);
  const cwd = process.cwd();
  const isDev = !fs.existsSync(path.resolve(cwd, "dist/cli/index.js"));
  
  const task = taskOverride || watchConfig.task;
  
  const tsxBin = path.resolve(cwd, "node_modules/.bin/tsx");
  const hasLocalTsx = fs.existsSync(tsxBin);
  const command = isDev && hasLocalTsx ? tsxBin : isDev ? "npx" : process.execPath;
  const args = isDev
    ? [
        ...(hasLocalTsx ? [] : ["tsx"]),
        "src/cli/index.ts", 
        "validate",
        `--repoRoot=${watchConfig.projectRoot}`,
        `--contractPath=${watchConfig.contractPath}`,
        `--task=${task}`,
        `--changedFiles=${filePayload}`,
        `--format=json`,
      ]
    : [
        path.resolve(cwd, "dist/cli/index.js"),
        "validate",
        `--repoRoot=${watchConfig.projectRoot}`,
        `--contractPath=${watchConfig.contractPath}`,
        `--task=${task}`,
        `--changedFiles=${filePayload}`,
        `--format=json`,
      ];

  return spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
}

function runValidation(changedFile: string, taskOverride?: string): void {
  if (!watchConfig.contractPath) {
    console.error("[watch] Error: Contract path is not configured");
    return;
  }

  const task = taskOverride || watchConfig.task;
  console.log(`\n[watch] validating ${changedFile} (task: ${task}, active: ${activeProcesses.size})`);

  const child = createValidationProcess(changedFile, taskOverride);
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
      if (parsed) {
        // Write status artifact for every validation
        writeStatusArtifact(parsed, changedFile, code);
        
        if (parsed.outcome === "block") {
          const changed = normRelPosix(changedFile);
          const blockingViolations = (parsed.violations ?? []).filter(
            (violation: ValidationViolation) => violation.severity === "block" && normRelPosix(violation.file) === changed,
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
        } else {
          console.log(`[watch] ✅ Validation passed for ${changedFile}`);
        }
      } else {
        console.log(`[watch] ⚠️ Failed to parse validation output for ${changedFile}`);
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

  // Watch directories instead of glob patterns - more reliable with chokidar
  const watchDirectories = watchConfig.watchPaths.map(p => path.join(watchConfig.projectRoot, p));

  console.log(`[watch] Watching directories: ${watchDirectories.join(", ")}`);
  
  const watcher = chokidar.watch(watchDirectories, {
    ignored: [
      "**/node_modules/**",
      "**/.git/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
    ],
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 },
  });

  watcher
    .on("ready", () => {
      console.log("[watch] Chokidar watcher is ready");
    })
    .on("all", (event, filePath) => {
      console.log(`[watch] Event detected: ${event} on ${filePath}`);
    })
    .on("change", (filePath: string) => {
      console.log(`[watch] File changed: ${filePath}`);
      if (isStyleFile(filePath)) {
        console.log(`[watch] Style file detected, scheduling validation: ${filePath}`);
        scheduleValidation(toRepoRelativePosix(filePath, watchConfig.projectRoot));
      }
    })
    .on("add", (filePath: string) => {
      console.log(`[watch] File added: ${filePath}`);
      if (isStyleFile(filePath)) {
        console.log(`[watch] New style file detected, scheduling validation: ${filePath}`);
        scheduleValidation(toRepoRelativePosix(filePath, watchConfig.projectRoot));
      }
    })
    // Skip unlink validation for now - validating deleted files causes confusing errors
    // TODO: Implement boundary-only validation for unlink events
    // .on("unlink", (filePath: string) => {
    //   if (isStyleFile(filePath)) {
    //     scheduleValidation(toRepoRelativePosix(filePath, watchConfig.projectRoot), "boundary-check");
    //   }
    // })
    .on("error", (error: unknown) => {
      console.error("[watch] Watcher error:", error);
    });

  // Keep the process running
  return 0;
}