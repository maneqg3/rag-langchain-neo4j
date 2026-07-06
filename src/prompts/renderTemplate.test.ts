import { describe, expect, it } from "vitest";
import { renderTemplate } from "./renderTemplate.js";

describe("renderTemplate", () => {
  it("substitui todos os placeholders pelos valores fornecidos", () => {
    const template = "Contexto: {{context}}\nPergunta: {{question}}";

    const result = renderTemplate(template, { context: "doc X", question: "O que é X?" });

    expect(result).toBe("Contexto: doc X\nPergunta: O que é X?");
  });

  it("substitui múltiplas ocorrências do mesmo placeholder", () => {
    const template = "{{question}} -- repetido: {{question}}";

    const result = renderTemplate(template, { question: "oi" });

    expect(result).toBe("oi -- repetido: oi");
  });

  it("mantém placeholders sem valor correspondente intactos", () => {
    const template = "{{context}} e {{question}}";

    const result = renderTemplate(template, { context: "X" });

    expect(result).toBe("X e {{question}}");
  });
});
