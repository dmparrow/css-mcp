export type Severity = "info" | "warn" | "block";

export interface Violation {
  rule: string;
  severity: Severity;
  message: string;
  file?: string;
  hint?: string;
}

export interface ValidationContext {
  repositoryRoot: string;
  task: "theme-edit" | "component-add" | "full";
  changedFiles: string[];
}

export interface RuleResult {
  rule: string;
  violations: Violation[];
}

export interface ValidationResult {
  outcome: "pass" | "warn" | "block";
  violations: Violation[];
  summary: {
    total: number;
    warnings: number;
    blocks: number;
  };
}

export interface AgentCssContract {
  version: string;
  project: string;
  themeVariables: {
    count: number;
    writeSurface: string[];
    variables: string[];
  };
  taskWriteSurfaces: Record<string, string[]>;
  layerInvariants: {
    mainCss: string;
    requiredImports: string[];
    requiredLayers: string[];
  };
  componentApi: {
    dataAttributes: string[];
  };
}
