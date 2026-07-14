import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ChatOpenAI } from "@langchain/openai";
import { AI, NO_CONTEXT_ANSWER } from "./ai/AI.js";
import { loadConfig } from "./config/index.js";
import { createEmbedder } from "./embeddings/embedder.js";
import { evaluateItem } from "./eval/metrics.js";
import { goldenSet } from "./eval/goldenSet.js";
import { buildReport } from "./eval/report.js";
import { ingestDocument } from "./ingest.js";
import { loadPromptConfig, loadResponseTemplate } from "./prompts/loadPromptConfig.js";

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

  try {
    if (!config.openRouterApiKey) {
      console.warn("⚠️  OPENROUTER_API_KEY não configurada — não é possível rodar a avaliação.");
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

    const results = [];
    for (const item of goldenSet) {
      console.log(`❓ [${item.category}] ${item.question}`);
      const { answer, context } = await ai.answerQuestion(item.question);
      const result = evaluateItem(item, context, answer, NO_CONTEXT_ANSWER);
      console.log(result.passed ? "✅ PASS" : "❌ FAIL");
      results.push(result);
    }

    const report = buildReport(results);
    mkdirSync(config.outputsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const reportPath = join(config.outputsDir, `eval-report-${timestamp}.md`);
    writeFileSync(reportPath, report, "utf-8");

    console.log(`✨ Avaliação concluída. Relatório salvo em ${reportPath}`);
  } finally {
    //sem isso o driver do Neo4j mantém a conexão aberta e o processo nunca termina (mesmo bug de src/index.ts, 3f603f9)
    await vectorStore.close();
  }
}

main().catch((error) => {
  console.error("❌ Erro ao rodar a avaliação:", error);
  process.exitCode = 1;
});
