import type { Document } from "@langchain/core/documents";
import type { BaseMessage } from "@langchain/core/messages";
import type { PromptConfig } from "../prompts/loadPromptConfig.js";

export interface ChainState {
  question: string;
  context: Document[];
  answer: string;
  usedLLM: boolean;
  error?: string;
}

export interface ScoredRetriever {
  similaritySearchWithScore(query: string, k: number): Promise<Array<[Document, number]>>;
}

export interface AnswerLLM {
  invoke(messages: BaseMessage[]): Promise<{ content: unknown }>;
}

export interface AIParams {
  vectorStore: ScoredRetriever;
  llm: AnswerLLM;
  promptConfig: PromptConfig;
  responseTemplate: string;
  topK: number;
  scoreThreshold: number;
}

export interface AnswerResult {
  answer: string;
  usedLLM: boolean;
  sources: string[];
  context: Document[];
}
