import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { filterByScore } from "../retrieval/vectorSearch.js";
import { renderTemplate } from "../prompts/renderTemplate.js";
import type { AIParams, ChainState } from "./types.js";

const NO_CONTEXT_ANSWER = "Não tenho informação suficiente no contexto para responder essa pergunta.";

export class AI {
  constructor(private readonly params: AIParams) {}

  async answerQuestion(
    question: string,
  ): Promise<{ answer: string; usedLLM: boolean; sources: string[] }> {
    const chain = RunnableSequence.from([
      RunnableLambda.from((state: ChainState) => this.retrieveVectorSearch(state)),
      RunnableLambda.from((state: ChainState) => this.generateAnswer(state)),
    ]);

    const initialState: ChainState = { question, context: [], answer: "", usedLLM: false };
    const finalState: ChainState = await chain.invoke(initialState);

    if (finalState.error) {
      throw new Error(finalState.error);
    }

    return {
      answer: finalState.answer,
      usedLLM: finalState.usedLLM,
      sources: finalState.context.map((doc) => String(doc.metadata?.source ?? "desconhecida")),
    };
  }

  private async retrieveVectorSearch(state: ChainState): Promise<ChainState> {
    try {
      const resultsWithScore = await this.params.vectorStore.similaritySearchWithScore(
        state.question,
        this.params.topK,
      );
      const context = filterByScore(resultsWithScore, this.params.scoreThreshold);
      return { ...state, context };
    } catch (error) {
      return { ...state, error: (error as Error).message };
    }
  }

  private async generateAnswer(state: ChainState): Promise<ChainState> {
    if (state.error) {
      return state;
    }
    if (state.context.length === 0) {
      return { ...state, answer: NO_CONTEXT_ANSWER, usedLLM: false };
    }

    const contextText = state.context.map((doc) => doc.pageContent).join("\n---\n");
    const systemPrompt = renderTemplate(this.params.responseTemplate, {
      context: contextText,
      instructions: this.params.promptConfig.instructions.join("\n"),
      question: state.question,
    });

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", "{systemPrompt}"],
      ["human", "{question}"],
    ]);
    const messages = await promptTemplate.formatMessages({ systemPrompt, question: state.question });

    const response = await this.params.llm.invoke(messages);
    return { ...state, answer: String(response.content), usedLLM: true };
  }
}
