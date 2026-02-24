import { runGenerateCommand } from "../../cli/commands/generate.js";

export function generateArtifacts(input?: {
  repositoryRoot?: string;
  contractPath?: string;
}): { ok: boolean; message: string } {
  const args: string[] = [];
  if (input?.repositoryRoot) {
    args.push(`--repoRoot=${input.repositoryRoot}`);
  }
  if (input?.contractPath) {
    args.push(`--contractPath=${input.contractPath}`);
  }

  const code = runGenerateCommand(args);
  return {
    ok: code === 0,
    message: code === 0 ? "Artifacts generated" : "Artifact generation failed",
  };
}
