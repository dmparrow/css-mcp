# V1 Implementation Plan — Agent-Usable CSS Contract Tooling

## 1) Prioritized execution backlog (v1)

### P0 — Contract correctness + shared engine (must ship)
1. **Normalize source-of-truth inconsistencies**
   - Align `AGENT_API.md`, `README.md`, and `css/theme.config.css` on config variable count (18 vs 19), motion defaults, and allowed edit surface language.
   - Resolve dark theme contract ambiguity in `css/themes/dark.css` (documented intent vs selector structure).
2. **Create canonical contract artifact**
   - Add machine-readable root contract file covering:
     - Theme config vars + ranges (`css/theme.config.css`)
     - Component/layout `data-*` APIs (`AGENT_API.md`, CSS selectors)
     - Write-surface policy by task type
     - Layer/import invariants (`css/main.css`, `css/components.css`)
3. **Build validator rule catalog + engine**
   - Implement policy checks for full-repo scope:
     - File-boundary violations
     - Token-usage violations in `css/components/*.css`
     - API completeness/parity (docs ↔ selectors)
     - Docs sync drift (`AGENT_API.md`, `README.md`)
   - Return structured results: `pass | warn | block`, violations, fix hints.
4. **Expose same engine via CLI + MCP**
   - CLI commands for validate/explain/generate-doc-artifacts.
   - MCP tools for agent patch validation with identical policy outcomes.

### P1 — Soft-block operations + generated outputs
5. **Add soft-block profile**
   - Block: write-surface breach, import/layer corruption, forbidden hard-coded tokens.
   - Warn: docs/example drift, optional API coverage gaps.
6. **Generate agent-facing artifacts from contract**
   - Regenerate API tables in `AGENT_API.md`.
   - Emit compact runtime hints (task-scoped allowed files + enum values).
   - Emit CI-readable policy report artifact.
7. **Wire CI for changed-file validation**
   - Run validator on changed files in PRs.
   - Publish deterministic report; mirror local CLI output format.

### P2 — Stabilization
8. **Seed regression fixtures + parity checks**
   - Add `valid`, `warn`, `block` fixture cases.
   - Assert CLI and MCP outcome parity over same inputs.

---

## 2) Concrete artifacts/files to create

### Contract + generated artifacts
- `contract/agent-css-contract.v1.json` — canonical machine-readable policy/contract.
- `contract/schemas/agent-css-contract.schema.json` — JSON Schema for contract validation.
- `contract/generated/agent-runtime-hints.json` — compact agent hints (allowed files, enums, task scopes).
- `contract/generated/policy-report.schema.json` — schema for validation report output.

### Shared validator engine
- `cli_mcp/package.json` — workspace package metadata + scripts.
- `cli_mcp/src/contract/loadContract.ts` — load + schema-validate contract.
- `cli_mcp/src/engine/types.ts` — result/violation/fix-hint types.
- `cli_mcp/src/engine/rules/`:
  - `fileBoundaries.ts`
  - `importLayerIntegrity.ts`
  - `tokenUsage.ts`
  - `apiParity.ts`
  - `docsSync.ts`
- `cli_mcp/src/engine/validatePatch.ts` — orchestrates rules, merges severity.
- `cli_mcp/src/engine/profiles/softBlock.ts` — warn/block policy mapping.

### CLI interface
- `cli_mcp/src/cli/index.ts` — command entry.
- `cli_mcp/src/cli/commands/validate.ts` — validate changed files/patch intent.
- `cli_mcp/src/cli/commands/explain.ts` — human-readable remediation output.
- `cli_mcp/src/cli/commands/generate.ts` — regenerate docs + runtime hints.

### MCP interface
- `cli_mcp/src/mcp/server.ts` — MCP server bootstrap.
- `cli_mcp/src/mcp/tools/validatePatchIntent.ts` — tool endpoint.
- `cli_mcp/src/mcp/tools/explainViolations.ts` — tool endpoint.
- `cli_mcp/src/mcp/tools/generateArtifacts.ts` — tool endpoint.

### CI + tests
- `.github/workflows/contract-validation.yml` — PR validation workflow.
- `cli_mcp/tests/fixtures/{valid,warn,block}/...` — seeded patch fixtures.
- `cli_mcp/tests/parity/cli-mcp-parity.test.ts` — same input => same outcome.
- `cli_mcp/tests/rules/*.test.ts` — targeted rule tests.

### Required updates to existing files
- `AGENT_API.md` — generated API tables + clarified write-surface policy text.
- `README.md` — variable-count and tooling workflow alignment.
- `css/themes/dark.css` — corrected/clarified dark-mode contract implementation.

---

## 3) Minimal command list (bootstrap + run local)

```bash
# from repo root
cd cli_mcp
npm init -y
npm i zod ajv fast-glob postcss postcss-safe-parser commander @modelcontextprotocol/sdk
npm i -D typescript tsx vitest @types/node
npx tsc --init

# dev usage
npm run build
npm run test
npm run validate -- --changed
npm run explain -- --input ./tests/fixtures/block/sample.patch.json
npm run generate
npm run mcp:dev
```

**Recommended scripts to define in `cli_mcp/package.json`:**
- `build`: `tsc -p tsconfig.json`
- `test`: `vitest run`
- `validate`: `tsx src/cli/index.ts validate`
- `explain`: `tsx src/cli/index.ts explain`
- `generate`: `tsx src/cli/index.ts generate`
- `mcp:dev`: `tsx src/mcp/server.ts`

---

## 4) Acceptance criteria checklist

- [ ] Source-of-truth docs/config consistency is resolved (`AGENT_API.md`, `README.md`, `css/theme.config.css`, `css/themes/dark.css`).
- [ ] `contract/agent-css-contract.v1.json` fully encodes theme vars/ranges, APIs, write surfaces, and import/layer invariants.
- [ ] Contract-to-code parity passes for `css/theme.config.css`, `css/components/*.css`, `css/layout.css`, `css/main.css`.
- [ ] Validator classifies seeded cases correctly: valid → pass, non-critical drift → warn, high-risk violations → block.
- [ ] CLI and MCP return identical policy outcomes for the same patch input.
- [ ] Soft-block profile blocks only high-risk classes and warns on non-critical drift.
- [ ] `AGENT_API.md` generated section and runtime hint artifact stay in sync after a sample API change.
- [ ] CI runs on PR changed files and publishes deterministic, readable remediation report.

---

## 5) Risks and mitigations

1. **Risk:** Contract drift between docs, CSS selectors, and machine contract.
   - **Mitigation:** Make contract the single source of truth; generate API sections/hints from contract; fail CI on drift.

2. **Risk:** False-positive policy blocks slow iteration.
   - **Mitigation:** Soft-block profile with strict block-only for high-risk classes; downgrade uncertain checks to warn in v1.

3. **Risk:** CLI/MCP behavior divergence.
   - **Mitigation:** One shared engine package; parity tests run in CI using identical fixture inputs.

4. **Risk:** CSS parsing edge cases (grouped selectors, layered imports, custom props) produce inconsistent checks.
   - **Mitigation:** Parse via PostCSS AST, avoid regex-only checks, and maintain regression fixtures for known patterns.

5. **Risk:** Initial normalization touches too many files and creates review noise.
   - **Mitigation:** Isolate rollout in two PRs:
     - PR1: normalization + contract skeleton
     - PR2: engine + interfaces + CI
