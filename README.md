# Arrow Stack CLI + MCP

Repository for the `cli_mcp` contract-validation toolchain.

## What this repo contains

- `cli_mcp/` — TypeScript implementation of shared validator engine, CLI, MCP server, tests.
- `contract/` — contract, schema, and generated artifacts used by the tool.
- `.github/workflows/contract-validation.yml` — CI workflow for build/validate/test.

## Quick start

```bash
cd cli_mcp
npm install
npm run build
npm run test
```

## CLI

```bash
cd cli_mcp
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

## MCP

Run server locally:

```bash
cd cli_mcp
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
      "args": ["./cli_mcp/dist/mcp/server.js"]
    }
  }
}
```
