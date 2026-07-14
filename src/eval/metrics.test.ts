import { describe, expect, it } from "vitest";
import type { Document } from "@langchain/core/documents";
import {
  answerContainsFacts,
  evaluateItem,
  hitAtK,
  isCorrectRefusal,
  isGroundingViolation,
  isSynthesisFailure,
} from "./metrics.js";
import type { GoldenSetItem } from "./goldenSet.js";

function makeDoc(content: string): Document {
  return { pageContent: content, metadata: {} } as Document;
}

const REFUSAL = "Não tenho informação suficiente no contexto para responder essa pergunta.";

describe("hitAtK", () => {
  it("retorna true quando todo fato esperado aparece em algum chunk recuperado", () => {
    const docs = [makeDoc("O Brasil perdeu por 2 a 1 para a Noruega")];
    expect(hitAtK(docs, ["2 a 1"])).toBe(true);
  });

  it("retorna false quando um fato esperado não aparece em nenhum chunk", () => {
    const docs = [makeDoc("texto sem relação nenhuma")];
    expect(hitAtK(docs, ["2 a 1"])).toBe(false);
  });

  it("retorna true quando expectedFacts está vazio", () => {
    expect(hitAtK([], [])).toBe(true);
  });

  it("combina fatos de chunks diferentes (caso multi-hop)", () => {
    const docs = [makeDoc("Erling Haaland marcou os gols"), makeDoc("eliminação para a Croácia em 2022")];
    expect(hitAtK(docs, ["Haaland", "Croácia"])).toBe(true);
  });

  it("é insensível a maiúsculas/minúsculas e acentos", () => {
    const docs = [makeDoc("Capitaes do Mundo narra a eliminacao")];
    expect(hitAtK(docs, ["Capitães do Mundo"])).toBe(true);
  });

  it("é insensível a quebras de linha no meio do fato esperado", () => {
    const docs = [makeDoc("direção de Ana Luiza Azevedo e Jorge\nFurtado")];
    expect(hitAtK(docs, ["Jorge Furtado"])).toBe(true);
  });
});

describe("answerContainsFacts", () => {
  it("retorna true quando a resposta final contém todo fato esperado", () => {
    expect(answerContainsFacts("O Brasil perdeu de 2 a 1 para a Noruega.", ["2 a 1"])).toBe(true);
  });

  it("retorna false quando falta um fato esperado", () => {
    expect(answerContainsFacts("O Brasil perdeu.", ["2 a 1"])).toBe(false);
  });
});

describe("isCorrectRefusal", () => {
  it("retorna true quando a resposta é exatamente a mensagem de recusa", () => {
    expect(isCorrectRefusal(REFUSAL, REFUSAL)).toBe(true);
  });

  it("retorna false quando a resposta não é a recusa", () => {
    expect(isCorrectRefusal("A França fica na Europa.", REFUSAL)).toBe(false);
  });
});

describe("isGroundingViolation", () => {
  it("retorna true quando não houve hit mas a resposta acertou os fatos", () => {
    expect(isGroundingViolation(false, true)).toBe(true);
  });

  it("retorna false quando houve hit e a resposta acertou (sem violação)", () => {
    expect(isGroundingViolation(true, true)).toBe(false);
  });

  it("retorna false quando não houve hit nem acerto (miss genuíno, não é violação)", () => {
    expect(isGroundingViolation(false, false)).toBe(false);
  });

  it("retorna null quando hit ou answerCorrect são null (fora de escopo)", () => {
    expect(isGroundingViolation(null, null)).toBeNull();
  });
});

describe("isSynthesisFailure", () => {
  it("retorna true em multi-hop quando houve hit mas a resposta não acertou", () => {
    expect(isSynthesisFailure("multi-hop", true, false)).toBe(true);
  });

  it("retorna false em multi-hop quando houve hit e a resposta acertou", () => {
    expect(isSynthesisFailure("multi-hop", true, true)).toBe(false);
  });

  it("retorna null em single-hop mesmo com hit true e answerCorrect false", () => {
    expect(isSynthesisFailure("single-hop", true, false)).toBeNull();
  });

  it("retorna null em out-of-scope", () => {
    expect(isSynthesisFailure("out-of-scope", null, null)).toBeNull();
  });
});

describe("evaluateItem", () => {
  it("passa item hop único quando hit@k e resposta batem com os fatos esperados", () => {
    const item: GoldenSetItem = {
      id: "single-1",
      category: "single-hop",
      question: "Qual o placar?",
      expectedFacts: ["2 a 1"],
    };
    const docs = [makeDoc("o placar foi 2 a 1")];

    const result = evaluateItem(item, docs, "O placar foi 2 a 1 para a Noruega.", REFUSAL);

    expect(result.passed).toBe(true);
    expect(result.hitAtK).toBe(true);
    expect(result.answerCorrect).toBe(true);
    expect(result.refusalCorrect).toBeNull();
    expect(result.groundingViolation).toBe(false);
    expect(result.synthesisFailure).toBeNull();
  });

  it("reprova item multi-hop quando falta um dos fatos na resposta (falha de síntese)", () => {
    const item: GoldenSetItem = {
      id: "multi-1",
      category: "multi-hop",
      question: "Quem e o quê?",
      expectedFacts: ["Haaland", "Croácia"],
    };
    const docs = [makeDoc("Haaland marcou. Croácia eliminou o Brasil em 2022.")];

    const result = evaluateItem(item, docs, "Haaland marcou os gols.", REFUSAL);

    expect(result.passed).toBe(false);
    expect(result.hitAtK).toBe(true);
    expect(result.answerCorrect).toBe(false);
    expect(result.groundingViolation).toBe(false);
    expect(result.synthesisFailure).toBe(true);
  });

  it("avalia item fora de escopo só pela recusa, ignorando hit@k/answerCorrect/grounding/síntese", () => {
    const item: GoldenSetItem = {
      id: "oos-1",
      category: "out-of-scope",
      question: "Onde fica a França?",
      expectedFacts: [],
    };

    const result = evaluateItem(item, [], REFUSAL, REFUSAL);

    expect(result.passed).toBe(true);
    expect(result.refusalCorrect).toBe(true);
    expect(result.hitAtK).toBeNull();
    expect(result.answerCorrect).toBeNull();
    expect(result.groundingViolation).toBeNull();
    expect(result.synthesisFailure).toBeNull();
  });

  it("marca violação de grounding quando a resposta acerta um fato fora dos chunks recuperados", () => {
    const item: GoldenSetItem = {
      id: "multi-2",
      category: "multi-hop",
      question: "Compare o placar de 2026 com o de 2014.",
      expectedFacts: ["2 a 1", "7 a 1"],
    };
    // só o chunk de 2026 foi recuperado — "7 a 1" (semifinal de 2014) não está aqui
    const docs = [makeDoc("Em 2026 o Brasil perdeu por 2 a 1 para a Noruega.")];

    const result = evaluateItem(item, docs, "O placar de 2026 foi 2 a 1, e o de 2014 foi 7 a 1.", REFUSAL);

    expect(result.hitAtK).toBe(false);
    expect(result.answerCorrect).toBe(true);
    expect(result.passed).toBe(false);
    expect(result.groundingViolation).toBe(true);
    // hitAtK é false aqui, então a fórmula de synthesisFailure (hitAtK === true && ...)
    // não é satisfeita — miss de retrieval e falha de síntese são sinais mutuamente
    // exclusivos por construção, isso não é um caso dos dois ao mesmo tempo.
    expect(result.synthesisFailure).toBe(false);
  });
});
