import { describe, expect, it, vi } from "vitest";
import type { Document } from "@langchain/core/documents";
import { AI, NO_CONTEXT_ANSWER } from "./AI.js";
import type { AnswerLLM, ScoredRetriever } from "./types.js";

function makeDoc(content: string, source = "source.pdf"): Document {
  return { pageContent: content, metadata: { source } } as Document;
}

const promptConfig = {
  metadata: { version: "1.0.0", updatedAt: "2026-07-06" },
  task: "responder com contexto",
  instructions: ["use só o contexto"],
  outputFormat: "texto",
};

describe("AI.answerQuestion", () => {
  it("retorna a resposta do LLM quando há contexto acima do score mínimo", async () => {
    const contextDoc = makeDoc("RAG combina busca e geração");
    const vectorStore: ScoredRetriever = {
      similaritySearchWithScore: vi.fn().mockResolvedValue([[contextDoc, 0.9]]),
    };
    const llm: AnswerLLM = {
      invoke: vi.fn().mockResolvedValue({ content: "RAG é retrieval-augmented generation." }),
    };

    const ai = new AI({
      vectorStore,
      llm,
      promptConfig,
      responseTemplate: "Contexto:\n{{context}}\n\nInstruções:\n{{instructions}}\n\nPergunta:\n{{question}}",
      topK: 4,
      scoreThreshold: 0.5,
    });

    const result = await ai.answerQuestion("O que é RAG?");

    expect(result.answer).toBe("RAG é retrieval-augmented generation.");
    expect(result.usedLLM).toBe(true);
    expect(result.sources).toEqual(["source.pdf"]);
    expect(result.context).toEqual([contextDoc]);
    expect(llm.invoke).toHaveBeenCalledTimes(1);
  });

  it("retorna mensagem fixa e não chama o LLM quando nenhum chunk atinge o score mínimo", async () => {
    const vectorStore: ScoredRetriever = {
      similaritySearchWithScore: vi.fn().mockResolvedValue([[makeDoc("chunk pouco relevante"), 0.1]]),
    };
    const llm: AnswerLLM = { invoke: vi.fn() };

    const ai = new AI({
      vectorStore,
      llm,
      promptConfig,
      responseTemplate: "{{context}} {{instructions}} {{question}}",
      topK: 4,
      scoreThreshold: 0.5,
    });

    const result = await ai.answerQuestion("Pergunta fora do contexto?");

    expect(result.usedLLM).toBe(false);
    expect(result.answer).toBe(NO_CONTEXT_ANSWER);
    expect(result.context).toEqual([]);
    expect(llm.invoke).not.toHaveBeenCalled();
  });

  it("propaga erro claro quando a busca no Neo4j falha", async () => {
    const vectorStore: ScoredRetriever = {
      similaritySearchWithScore: vi.fn().mockRejectedValue(new Error("connection refused")),
    };
    const llm: AnswerLLM = { invoke: vi.fn() };

    const ai = new AI({
      vectorStore,
      llm,
      promptConfig,
      responseTemplate: "{{context}} {{instructions}} {{question}}",
      topK: 4,
      scoreThreshold: 0.5,
    });

    await expect(ai.answerQuestion("Qualquer pergunta")).rejects.toThrow(/connection refused/);
    expect(llm.invoke).not.toHaveBeenCalled();
  });
});
