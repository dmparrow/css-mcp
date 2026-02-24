import { runGenerateCommand } from "../../cli/commands/generate.js";

export function generateArtifacts(): { ok: boolean; message: string } {
  const code = runGenerateCommand();
  return {
    ok: code === 0,
    message: code === 0 ? "Artifacts generated" : "Artifact generation failed",
  };
}
