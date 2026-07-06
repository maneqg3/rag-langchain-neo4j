import { existsSync } from "node:fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Neo4jVectorStore } from "@langchain/neo4j";
import type { Document } from "@langchain/core/documents";
import type { Embeddings } from "@langchain/core/embeddings";
import type { AppConfig } from "./config/index.js";

/**
 * PDFLoader/RecursiveCharacterTextSplitter anexam metadata aninhada (pdf.info, loc.lines)
 * que o Neo4j rejeita — propriedades de nó só aceitam primitivos ou arrays de primitivos.
 */
export function sanitizeMetadata(doc: Document): Document {
  const loc = doc.metadata?.loc as { pageNumber?: number } | undefined;
  return {
    ...doc,
    metadata: {
      source: String(doc.metadata?.source ?? "desconhecida"),
      pageNumber: Number(loc?.pageNumber ?? 1),
    },
  };
}

export function assertPdfFileExists(path: string): void {
  if (!existsSync(path)) {
    throw new Error(
      `Arquivo de dados não encontrado em "${path}". Configure DATA_PATH no .env ou rode "npm run generate:placeholder-pdf".`,
    );
  }
  if (!path.toLowerCase().endsWith(".pdf")) {
    throw new Error(`Arquivo de dados precisa ser um PDF, recebido: "${path}".`);
  }
}

export async function ingestDocument(
  embeddings: Embeddings,
  config: AppConfig,
): Promise<Neo4jVectorStore> {
  assertPdfFileExists(config.dataPath);

  const loader = new PDFLoader(config.dataPath);
  const rawDocs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = (await splitter.splitDocuments(rawDocs)).map(sanitizeMetadata);

  console.log(`📄 ${rawDocs.length} página(s) carregada(s), ${chunks.length} chunk(s) gerado(s).`);

  return Neo4jVectorStore.fromDocuments(chunks, embeddings, {
    url: config.neo4jUri,
    username: config.neo4jUsername,
    password: config.neo4jPassword,
    indexName: config.neo4jIndexName,
    nodeLabel: config.neo4jNodeLabel,
    preDeleteCollection: true,
  });
}
