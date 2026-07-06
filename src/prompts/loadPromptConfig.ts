import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const currentDir = dirname(fileURLToPath(import.meta.url));

export interface PromptConfig {
  metadata: { version: string; updatedAt: string };
  task: string;
  instructions: string[];
  outputFormat: string;
}

export function loadPromptConfig(): PromptConfig {
  const raw = readFileSync(join(currentDir, "answer-prompt.json"), "utf-8");
  return JSON.parse(raw) as PromptConfig;
}

export function loadResponseTemplate(): string {
  return readFileSync(join(currentDir, "response-template.txt"), "utf-8");
}
