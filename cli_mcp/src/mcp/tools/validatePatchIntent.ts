import { loadContract } from "../../contract/loadContract.js";
import { validatePatch } from "../../engine/validatePatch.js";
import type { ValidationContext } from "../../engine/types.js";

export interface ValidatePatchIntentInput {
  repositoryRoot: string;
  task?: ValidationContext["task"];
  changedFiles?: string[];
}

export function validatePatchIntent(input: ValidatePatchIntentInput) {
  const task = input.task ?? "full";
  const changedFiles = input.changedFiles ?? [];

  return validatePatch(
    {
      repositoryRoot: input.repositoryRoot,
      task,
      changedFiles,
    },
    loadContract(input.repositoryRoot),
  );
}
