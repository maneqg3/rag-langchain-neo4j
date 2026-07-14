import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const dataPath = process.argv[2] ?? "./data/source.pdf";

async function main() {
  const loader = new PDFLoader(dataPath);
  const rawDocs = await loader.load();

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
  const chunks = await splitter.splitDocuments(rawDocs);

  console.log(`${dataPath}: ${chunks.length} chunk(s) gerado(s) a partir de ${rawDocs.length} página(s).\n`);
  chunks.forEach((chunk, index) => {
    console.log(`=== chunk ${index} (${chunk.pageContent.length} chars, página ${chunk.metadata?.loc?.pageNumber}) ===`);
    console.log(chunk.pageContent);
    console.log("");
  });
}

main();
