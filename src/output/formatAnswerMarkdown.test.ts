import { describe, expect, it } from "vitest";
import { formatAnswerMarkdown } from "./formatAnswerMarkdown.js";

describe("formatAnswerMarkdown", () => {
  it("formata pergunta, resposta e fontes em markdown", () => {
    const markdown = formatAnswerMarkdown("O que é RAG?", "É retrieval-augmented generation.", [
      "source.pdf",
    ]);

    expect(markdown).toContain("# Pergunta");
    expect(markdown).toContain("O que é RAG?");
    expect(markdown).toContain("# Resposta");
    expect(markdown).toContain("É retrieval-augmented generation.");
    expect(markdown).toContain("- source.pdf");
  });

  it("indica ausência de fontes quando a lista está vazia", () => {
    const markdown = formatAnswerMarkdown("Pergunta fora de contexto", "sem informação", []);

    expect(markdown).toContain("nenhuma (resposta sem contexto)");
  });
});
