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
    groundingViolation: null,
    synthesisFailure: null,
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

  it("marca FAIL com marcador de grounding quando groundingViolation é true", () => {
    const results: EvalItemResult[] = [
      makeResult({
        id: "multi-2",
        category: "multi-hop",
        question: "Compare os placares.",
        passed: false,
        hitAtK: false,
        answerCorrect: true,
        groundingViolation: true,
        synthesisFailure: false,
      }),
    ];

    const report = buildReport(results);

    expect(report).toContain("[FAIL ⚠️ GROUNDING] multi-2: Compare os placares.");
  });

  it("marca FAIL com marcador de síntese quando synthesisFailure é true", () => {
    const results: EvalItemResult[] = [
      makeResult({
        id: "multi-3",
        category: "multi-hop",
        question: "Quais documentários?",
        passed: false,
        hitAtK: true,
        answerCorrect: false,
        groundingViolation: false,
        synthesisFailure: true,
      }),
    ];

    const report = buildReport(results);

    expect(report).toContain("[FAIL ⚠️ SYNTHESIS] multi-3: Quais documentários?");
  });

  it("soma contagens de grounding e síntese no topo do relatório, por categoria", () => {
    const results: EvalItemResult[] = [
      makeResult({
        id: "single-1",
        category: "single-hop",
        passed: false,
        hitAtK: false,
        answerCorrect: true,
        groundingViolation: true,
        synthesisFailure: null,
      }),
      makeResult({
        id: "multi-1",
        category: "multi-hop",
        passed: false,
        hitAtK: false,
        answerCorrect: true,
        groundingViolation: true,
        synthesisFailure: false,
      }),
      makeResult({
        id: "multi-2",
        category: "multi-hop",
        passed: false,
        hitAtK: true,
        answerCorrect: false,
        groundingViolation: false,
        synthesisFailure: true,
      }),
    ];

    const report = buildReport(results);

    expect(report).toContain("Violações de grounding: 2 (hop único: 1, multi-hop: 1)");
    expect(report).toContain("Falhas de síntese: 1 (aplica-se somente a multi-hop)");
  });
});
