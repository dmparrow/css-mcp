# Arrow Stack CSS Validator

Contract-driven CSS validation tool with CLI, MCP server, and stylelint plugin support.

## What this repo contains

- `src/` — TypeScript implementation of shared validator engine, CLI, MCP server, plugins.
- `contract/` — contract, schema, generated artifacts, and example contracts.
- `tests/` — test suites for rules, logging, and CLI/MCP parity.
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
