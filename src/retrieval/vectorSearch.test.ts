import { describe, expect, it } from "vitest";
import type { Document } from "@langchain/core/documents";
import { filterByScore } from "./vectorSearch.js";

function makeDoc(content: string): Document {
  return { pageContent: content, metadata: {} } as Document;
}

describe("filterByScore", () => {
  it("mantém apenas documentos com score maior ou igual ao threshold", () => {
    const results: Array<[Document, number]> = [
      [makeDoc("alta relevância"), 0.9],
      [makeDoc("baixa relevância"), 0.2],
      [makeDoc("no limite"), 0.5],
    ];

    const filtered = filterByScore(results, 0.5);

    expect(filtered.map((doc) => doc.pageContent)).toEqual(["alta relevância", "no limite"]);
  });

  it("retorna array vazio quando nenhum resultado atinge o threshold", () => {
    const results: Array<[Document, number]> = [[makeDoc("irrelevante"), 0.1]];

    expect(filterByScore(results, 0.5)).toEqual([]);
  });

  it("retorna array vazio quando não há resultados", () => {
    expect(filterByScore([], 0.5)).toEqual([]);
  });
});
