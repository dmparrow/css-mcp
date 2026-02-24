import path from "node:path";
import { loadContract } from "../../contract/loadContract.js";
import { validatePatch } from "../../engine/validatePatch.js";
import type { ValidationContext } from "../../engine/types.js";

export interface ArrowStylelintConfig {
  repositoryRoot?: string;
  contractPath?: string;
  task?: "theme-edit" | "component-add" | "full";
}

// Generic plugin interface to avoid requiring @types/stylelint at compile time
interface StylelintPlugin {
  ruleName: string;
  messages: Record<string, string>;
  meta: { url: string; fixable: boolean };
  lint(root: unknown, result: any): Promise<any>;
}

const plugin = (options: ArrowStylelintConfig = {}): StylelintPlugin => {
  return {
    ruleName: "arrow-stack",
    messages: {
      tokenUsageViolation: "Hard-coded color detected; use CSS variables instead",
      fileBoundaryViolation: "File outside allowed write surface for this task",
      layerIntegrityViolation: "CSS layer or import structure violation",
      apiParityViolation: "API documentation missing required attribute mention",
      docsSyncViolation: "Documentation inconsistency between files",
      scssViolation: "SCSS/Sass pattern violation",
    },
    meta: {
      url: "https://github.com/dmparrow/Arrow-stack-themer",
      fixable: false,
    },
    async lint(root: any, result: any) {
      const repositoryRoot = options.repositoryRoot ?? process.cwd();
      const contractPath = options.contractPath ?? "contract/agent-css-contract.v1.json";
      const task = options.task ?? "full";

      try {
        const contract = loadContract(repositoryRoot, contractPath);
        const filePath = (root.source?.input as any)?.file ?? "";

        if (!filePath) {
          return result;
        }

        const relativeFile = path.relative(repositoryRoot, filePath);
        const context: ValidationContext = {
          repositoryRoot,
          task,
          changedFiles: [relativeFile],
        };

        const validationResult = validatePatch(context, contract);

        // Map violations to stylelint issues
        for (const violation of validationResult.violations) {
          const severity = violation.severity === "block" ? "error" : "warning";
          result.report({
            message: violation.message,
            rule: `arrow-${violation.rule}`,
            severity,
            line: 1,
            column: 1,
          });
        }
      } catch (error) {
        if (process.env.ARROW_STYLELINT_DEBUG === "true") {
          console.error("Arrow Stack stylelint plugin error:", error);
        }
      }

      return result;
    },
  };
};

(plugin as any).ruleName = "arrow-stack";

export default plugin;
