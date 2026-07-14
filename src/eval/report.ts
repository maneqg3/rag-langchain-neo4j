import type { HopCategory } from "./goldenSet.js";
import type { EvalItemResult } from "./metrics.js";

const CATEGORY_ORDER: HopCategory[] = ["single-hop", "multi-hop", "out-of-scope"];

const CATEGORY_LABELS: Record<HopCategory, string> = {
  "single-hop": "Hop único",
  "multi-hop": "Multi-hop",
  "out-of-scope": "Fora de escopo",
};

export function buildReport(results: EvalItemResult[]): string {
  const lines: string[] = ["# Relatório de Avaliação", ""];

  for (const category of CATEGORY_ORDER) {
    const items = results.filter((result) => result.category === category);
    const passedCount = items.filter((result) => result.passed).length;

    lines.push(`## ${CATEGORY_LABELS[category]}: ${passedCount}/${items.length}`, "");
    for (const item of items) {
      lines.push(`- [${item.passed ? "PASS" : "FAIL"}] ${item.id}: ${item.question}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
