import { describe, expect, it } from "vitest";
import { buildReport } from "./report.js";
import type { EvalItemResult } from "./metrics.js";

function makeResult(overrides: Partial<EvalItemResult>): EvalItemResult {
  return {
    id: "id-1",
    category: "single-hop",
    question: "pergunta?",
    passed: true,
    hitAtK: true,
    answerCorrect: true,
    refusalCorrect: null,
    answer: "resposta",
    ...overrides,
  };
}

describe("buildReport", () => {
  it("agrupa resultados por categoria com contagem de acerto", () => {
    const results: EvalItemResult[] = [
      makeResult({ id: "single-1", category: "single-hop", passed: true }),
      makeResult({ id: "single-2", category: "single-hop", passed: false }),
      makeResult({ id: "multi-1", category: "multi-hop", passed: true }),
      makeResult({
        id: "oos-1",
        category: "out-of-scope",
        passed: true,
        hitAtK: null,
        answerCorrect: null,
        refusalCorrect: true,
      }),
    ];

    const report = buildReport(results);

    expect(report).toContain("Hop único: 1/2");
    expect(report).toContain("Multi-hop: 1/1");
    expect(report).toContain("Fora de escopo: 1/1");
  });

  it("marca PASS/FAIL por item individual", () => {
    const results: EvalItemResult[] = [makeResult({ id: "single-1", passed: false, question: "Qual o placar?" })];

    const report = buildReport(results);

    expect(report).toContain("[FAIL] single-1: Qual o placar?");
  });

  it("reporta 0/0 quando nenhuma categoria tem itens", () => {
    const report = buildReport([]);

    expect(report).toContain("Hop único: 0/0");
    expect(report).toContain("Multi-hop: 0/0");
    expect(report).toContain("Fora de escopo: 0/0");
  });
});
