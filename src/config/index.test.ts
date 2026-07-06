import { afterEach, describe, expect, it, vi } from "vitest";
import { loadConfig } from "./index.js";

describe("loadConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna config tipada quando as variáveis obrigatórias estão presentes", () => {
    vi.stubEnv("NEO4J_URI", "bolt://localhost:7687");
    vi.stubEnv("NEO4J_USERNAME", "neo4j");
    vi.stubEnv("NEO4J_PASSWORD", "secret");

    const config = loadConfig();

    expect(config.neo4jUri).toBe("bolt://localhost:7687");
    expect(config.neo4jUsername).toBe("neo4j");
    expect(config.neo4jPassword).toBe("secret");
    expect(config.neo4jIndexName).toBe("vector_index");
    expect(config.neo4jNodeLabel).toBe("Chunk");
    expect(config.topK).toBe(4);
    expect(config.scoreThreshold).toBe(0.5);
    expect(config.dataPath).toBe("./data/source.pdf");
    expect(config.embeddingModel).toBe("Xenova/all-MiniLM-L6-v2");
  });

  it("lança erro claro quando NEO4J_URI está faltando", () => {
    vi.stubEnv("NEO4J_USERNAME", "neo4j");
    vi.stubEnv("NEO4J_PASSWORD", "secret");

    expect(() => loadConfig()).toThrow(/NEO4J_URI/);
  });

  it("usa valores customizados de TOP_K e SCORE_THRESHOLD quando definidos", () => {
    vi.stubEnv("NEO4J_URI", "bolt://localhost:7687");
    vi.stubEnv("NEO4J_USERNAME", "neo4j");
    vi.stubEnv("NEO4J_PASSWORD", "secret");
    vi.stubEnv("TOP_K", "8");
    vi.stubEnv("SCORE_THRESHOLD", "0.75");

    const config = loadConfig();

    expect(config.topK).toBe(8);
    expect(config.scoreThreshold).toBe(0.75);
  });
});
