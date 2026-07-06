import type { Document } from "@langchain/core/documents";

export function filterByScore(
  resultsWithScore: Array<[Document, number]>,
  threshold: number,
): Document[] {
  return resultsWithScore.filter(([, score]) => score >= threshold).map(([doc]) => doc);
}
