#!/usr/bin/env node
import { runValidateCommand } from "./commands/validate.js";
import { runExplainCommand } from "./commands/explain.js";
import { runGenerateCommand } from "./commands/generate.js";

function printHelp(): void {
  console.log(`arrow-stack-cli-mcp

Usage:
  validate [--task=theme-edit|component-add|full] [--files=a,b,c]
  explain  [--task=theme-edit|component-add|full] [--files=a,b,c]
  generate
`);
}

const [, , command, ...args] = process.argv;

let exitCode = 0;

switch (command) {
  case "validate":
    exitCode = runValidateCommand(args);
    break;
  case "explain":
    exitCode = runExplainCommand(args);
    break;
  case "generate":
    exitCode = runGenerateCommand();
    break;
  default:
    printHelp();
    exitCode = command ? 1 : 0;
}

process.exit(exitCode);
