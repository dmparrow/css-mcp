# Arrow Stack Themer

CLI and MCP server for validating agent-driven CSS changes against an Arrow Stack policy contract.

## What this repo contains

- `src/` — TypeScript implementation of the validator engine, CLI, and MCP server.
- `tests/` — Vitest test suite.
- `contract/` — contract, schema, and generated artifacts used by the tool.
- `.github/workflows/contract-validation.yml` — CI workflow for build/validate/test.

## Quick start

```bash
npm install
npm run build
npm run test
```

## CLI

```bash
npm run validate -- --task=full
npm run explain -- --task=full
npm run generate
```

Multi-project flags:

- `--repoRoot=/path/to/target-repo`
- `--contractPath=contract/agent-css-contract.v1.json`

Example:

```bash
npm run validate -- --repoRoot=/path/to/repo --contractPath=contract/agent-css-contract.v1.json --task=component-add
```

For React/Vue projects, set `tokenUsage.scanPaths` in the target contract to match framework CSS locations (for example `src/**/*.css`, `src/**/*.module.css`, `src/**/*.scss`).

Starter examples are available at:

- `contract/examples/react-agent-css-contract.v1.json`
- `contract/examples/vue-agent-css-contract.v1.json`

## MCP

Run server locally:

```bash
npm run mcp:dev
```

Available tools:

- `validatePatchIntent`
- `explainViolations`
- `generateArtifacts`

## VS Code MCP

Workspace config example (`.vscode/mcp.json`):

```json
{
  "servers": {
    "arrow-stack-contract": {
      "type": "stdio",
      "command": "node",
      "cwd": "${workspaceFolder}",
      "args": ["./dist/mcp/server.js"]
    }
  }
}
```
