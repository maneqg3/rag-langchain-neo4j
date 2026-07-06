import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ChatOpenAI } from "@langchain/openai";
import { AI } from "./ai/AI.js";
import { loadConfig } from "./config/index.js";
import { createEmbedder } from "./embeddings/embedder.js";
import { ingestDocument } from "./ingest.js";
import { formatAnswerMarkdown } from "./output/formatAnswerMarkdown.js";
import { loadPromptConfig, loadResponseTemplate } from "./prompts/loadPromptConfig.js";

const TEST_QUESTIONS = [
  "O que é Retrieval-Augmented Generation?",
  "O que é um chunk?",
  "Qual banco de dados é usado para armazenar os embeddings?",
  "Como o RAG evita respostas inventadas?",
  "Qual é a capital da França?",
];

async function main(): Promise<void> {
  try {
    process.loadEnvFile();
  } catch {
    console.warn("⚠️  Nenhum arquivo .env encontrado. Usando variáveis de ambiente já definidas.");
  }

  const config = loadConfig();
  const embeddings = createEmbedder(config);

  console.log("📚 Indexando documento...");
  const vectorStore = await ingestDocument(embeddings, config);

  if (!config.openRouterApiKey) {
    console.warn(
      "⚠️  OPENROUTER_API_KEY não configurada — indexação concluída, mas as perguntas não serão respondidas pelo LLM ainda.",
    );
    return;
  }

  const llm = new ChatOpenAI({
    apiKey: config.openRouterApiKey,
    model: config.openRouterModel,
    temperature: 0.2,
    maxRetries: 2,
    configuration: { baseURL: config.openRouterBaseUrl },
  });

  const ai = new AI({
    vectorStore,
    llm,
    promptConfig: loadPromptConfig(),
    responseTemplate: loadResponseTemplate(),
    topK: config.topK,
    scoreThreshold: config.scoreThreshold,
  });

  mkdirSync(config.outputsDir, { recursive: true });

  for (const [index, question] of TEST_QUESTIONS.entries()) {
    console.log(`❓ ${question}`);
    const { answer, sources } = await ai.answerQuestion(question);
    console.log(`✅ ${answer}`);

    const markdown = formatAnswerMarkdown(question, answer, sources);
    writeFileSync(join(config.outputsDir, `resposta-${index + 1}.md`), markdown, "utf-8");
  }

  console.log(`✨ Concluído. Respostas salvas em ${config.outputsDir}/`);
}

main().catch((error) => {
  console.error("❌ Erro ao rodar o pipeline:", error);
  process.exitCode = 1;
});
