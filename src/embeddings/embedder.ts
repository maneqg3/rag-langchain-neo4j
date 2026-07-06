import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import type { AppConfig } from "../config/index.js";

export function createEmbedder(
  config: Pick<AppConfig, "embeddingModel">,
): HuggingFaceTransformersEmbeddings {
  return new HuggingFaceTransformersEmbeddings({
    model: config.embeddingModel,
  });
}
