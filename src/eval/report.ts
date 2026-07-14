import type { HopCategory } from "./goldenSet.js";
import type { EvalItemResult } from "./metrics.js";

const CATEGORY_ORDER: HopCategory[] = ["single-hop", "multi-hop", "out-of-scope"];

const CATEGORY_LABELS: Record<HopCategory, string> = {
  "single-hop": "Hop único",
  "multi-hop": "Multi-hop",
  "out-of-scope": "Fora de escopo",
};

function itemMarker(item: EvalItemResult): string {
  if (item.passed) {
    return "PASS";
  }
  if (item.groundingViolation) {
    return "FAIL ⚠️ GROUNDING";
  }
  if (item.synthesisFailure) {
    return "FAIL ⚠️ SYNTHESIS";
  }
  return "FAIL";
}

function countByCategory(
  results: EvalItemResult[],
  category: HopCategory,
  field: "groundingViolation" | "synthesisFailure",
): number {
  return results.filter((result) => result.category === category && result[field] === true).length;
}

export function buildReport(results: EvalItemResult[]): string {
  const lines: string[] = ["# Relatório de Avaliação", ""];

  const groundingSingle = countByCategory(results, "single-hop", "groundingViolation");
  const groundingMulti = countByCategory(results, "multi-hop", "groundingViolation");
  const synthesisMulti = countByCategory(results, "multi-hop", "synthesisFailure");

  lines.push(
    `Violações de grounding: ${groundingSingle + groundingMulti} (hop único: ${groundingSingle}, multi-hop: ${groundingMulti})`,
    `Falhas de síntese: ${synthesisMulti} (aplica-se somente a multi-hop)`,
    "",
  );

  for (const category of CATEGORY_ORDER) {
    const items = results.filter((result) => result.category === category);
    const passedCount = items.filter((result) => result.passed).length;

    lines.push(`## ${CATEGORY_LABELS[category]}: ${passedCount}/${items.length}`, "");
    for (const item of items) {
      lines.push(`- [${itemMarker(item)}] ${item.id}: ${item.question}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
