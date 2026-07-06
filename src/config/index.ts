export interface AppConfig {
  neo4jUri: string;
  neo4jUsername: string;
  neo4jPassword: string;
  neo4jIndexName: string;
  neo4jNodeLabel: string;
  openRouterApiKey?: string;
  openRouterModel: string;
  openRouterBaseUrl: string;
  embeddingModel: string;
  dataPath: string;
  outputsDir: string;
  topK: number;
  scoreThreshold: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${name}. Configure-a no arquivo .env (veja .env.example).`,
    );
  }
  return value;
}

export function loadConfig(): AppConfig {
  return {
    neo4jUri: requireEnv("NEO4J_URI"),
    neo4jUsername: requireEnv("NEO4J_USERNAME"),
    neo4jPassword: requireEnv("NEO4J_PASSWORD"),
    neo4jIndexName: process.env.NEO4J_INDEX_NAME || "vector_index",
    neo4jNodeLabel: process.env.NEO4J_NODE_LABEL || "Chunk",
    openRouterApiKey: process.env.OPENROUTER_API_KEY || undefined,
    openRouterModel: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct:free",
    openRouterBaseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    embeddingModel: process.env.EMBEDDING_MODEL || "Xenova/all-MiniLM-L6-v2",
    dataPath: process.env.DATA_PATH || "./data/source.pdf",
    outputsDir: process.env.OUTPUTS_DIR || "./outputs",
    topK: process.env.TOP_K ? Number(process.env.TOP_K) : 4,
    scoreThreshold: process.env.SCORE_THRESHOLD ? Number(process.env.SCORE_THRESHOLD) : 0.5,
  };
}
