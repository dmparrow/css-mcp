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

### Local Development

```bash
npm run validate -- --task=full
npm run explain -- --task=full
npm run generate
npm run watch -- --task=component-add
```

### Global Install

Install globally for system-wide access:

```bash
npm install -g arrow-stack-css-validator
```

> **Note:** Currently marked as private. For global install, either publish to npm or install directly from the repository:
> ```bash
> npm install -g /path/to/arrow-stack-themer
> ```

Once installed globally, use the `arrow-validate` command:

```bash
arrow-validate validate --task=full
arrow-validate explain --task=full
arrow-validate generate
arrow-validate watch --task=component-add
```

### Watch Mode

The watch command monitors CSS files for changes and automatically runs validations with debouncing and rate limiting:

**Local development:**
```bash
npm run watch -- --repoRoot=/path/to/target-repo --task=component-add
```

**Global install:**
```bash
arrow-validate watch --repoRoot=/path/to/target-repo --task=component-add
```

**Features:**
- **Real-time validation** on file changes (.css, .scss, .sass)
- **Debouncing** (300ms) prevents rapid successive validations  
- **Rate limiting** (max 2 concurrent validations) prevents system overload
- **Status artifacts** written to `.arrow-stack/validation-status.json`
- **Graceful shutdown** with process cleanup
- **Clean JSON output** with `--format=json` for programmatic consumption

**Options:**
- `--task=theme-edit|component-add|full` - Validation scope (default: component-add)
- `--watch-paths=src,styles` - Directories to monitor (default: src)
- `--contractPath=contract/agent-css-contract.v1.json` - Contract file path
- `--repoRoot=/path/to/project` - Target project directory

Multi-project flags:

- `--repoRoot=/path/to/target-repo`
- `--contractPath=contract/agent-css-contract.v1.json`

**Examples:**

Local development:
```bash
npm run validate -- --repoRoot=/path/to/repo --contractPath=contract/agent-css-contract.v1.json --task=component-add
```

Global install:
```bash
arrow-validate validate --repoRoot=/path/to/repo --contractPath=contract/agent-css-contract.v1.json --task=component-add
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
