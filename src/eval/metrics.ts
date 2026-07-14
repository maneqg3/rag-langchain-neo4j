import type { Document } from "@langchain/core/documents";
import type { GoldenSetItem, HopCategory } from "./goldenSet.js";

export interface EvalItemResult {
  id: string;
  category: HopCategory;
  question: string;
  passed: boolean;
  hitAtK: boolean | null;
  answerCorrect: boolean | null;
  refusalCorrect: boolean | null;
  groundingViolation: boolean | null;
  synthesisFailure: boolean | null;
  answer: string;
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function hitAtK(retrievedDocs: Document[], expectedFacts: string[]): boolean {
  const haystack = normalize(retrievedDocs.map((doc) => doc.pageContent).join(" "));
  return expectedFacts.every((fact) => haystack.includes(normalize(fact)));
}

export function answerContainsFacts(answer: string, expectedFacts: string[]): boolean {
  const haystack = normalize(answer);
  return expectedFacts.every((fact) => haystack.includes(normalize(fact)));
}

export function isCorrectRefusal(answer: string, refusalMessage: string): boolean {
  return normalize(answer) === normalize(refusalMessage);
}

export function isGroundingViolation(hit: boolean | null, answerCorrect: boolean | null): boolean | null {
  if (hit === null || answerCorrect === null) {
    return null;
  }
  return hit === false && answerCorrect === true;
}

export function isSynthesisFailure(
  category: HopCategory,
  hit: boolean | null,
  answerCorrect: boolean | null,
): boolean | null {
  if (category !== "multi-hop" || hit === null || answerCorrect === null) {
    return null;
  }
  return hit === true && answerCorrect === false;
}

export function evaluateItem(
  item: GoldenSetItem,
  retrievedDocs: Document[],
  answer: string,
  refusalMessage: string,
): EvalItemResult {
  if (item.category === "out-of-scope") {
    const refusalCorrect = isCorrectRefusal(answer, refusalMessage);
    return {
      id: item.id,
      category: item.category,
      question: item.question,
      passed: refusalCorrect,
      hitAtK: null,
      answerCorrect: null,
      refusalCorrect,
      groundingViolation: null,
      synthesisFailure: null,
      answer,
    };
  }

  const hit = hitAtK(retrievedDocs, item.expectedFacts);
  const answerCorrect = answerContainsFacts(answer, item.expectedFacts);
  return {
    id: item.id,
    category: item.category,
    question: item.question,
    passed: hit && answerCorrect,
    hitAtK: hit,
    answerCorrect,
    refusalCorrect: null,
    groundingViolation: isGroundingViolation(hit, answerCorrect),
    synthesisFailure: isSynthesisFailure(item.category, hit, answerCorrect),
    answer,
  };
}
