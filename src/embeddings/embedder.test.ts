import { describe, expect, it, vi } from "vitest";

const constructorSpy = vi.fn();

vi.mock("@langchain/community/embeddings/huggingface_transformers", () => ({
  HuggingFaceTransformersEmbeddings: class {
    constructor(fields: unknown) {
      constructorSpy(fields);
    }
  },
}));

const { createEmbedder } = await import("./embedder.js");

describe("createEmbedder", () => {
  it("instancia HuggingFaceTransformersEmbeddings com o modelo configurado", () => {
    createEmbedder({ embeddingModel: "Xenova/all-MiniLM-L6-v2" });

    expect(constructorSpy).toHaveBeenCalledWith({ model: "Xenova/all-MiniLM-L6-v2" });
  });
});
