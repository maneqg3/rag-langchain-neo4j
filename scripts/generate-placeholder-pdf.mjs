import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";

const TEXT = [
  "Retrieval-Augmented Generation, ou RAG, combina busca por similaridade vetorial com geracao de texto via LLM.",
  "O documento e quebrado em pedacos menores chamados chunks, cada chunk vira um vetor numerico atraves de um",
  "modelo de embeddings, e esses vetores sao armazenados em um banco de dados vetorial como o Neo4j.",
  "",
  "Quando o usuario faz uma pergunta, o sistema converte a pergunta em um vetor e busca os chunks mais",
  "similares no banco. Esses chunks formam o contexto que e enviado junto com a pergunta para o modelo de",
  "linguagem, que gera a resposta final baseada apenas no contexto recuperado.",
  "",
  "Este e um documento placeholder gerado automaticamente para validar o pipeline de indexacao antes que",
  "um documento real seja fornecido. Substitua data/source.pdf pelo seu proprio PDF quando quiser.",
].join(" ");

function wrapText(text, maxCharsPerLine) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine) {
      lines.push(current.trim());
      current = word;
    } else {
      current += " " + word;
    }
  }
  if (current) lines.push(current.trim());
  return lines;
}

async function main() {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage();
  const { height } = page.getSize();
  const fontSize = 12;
  const lines = wrapText(TEXT, 90);

  let y = height - 50;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: fontSize, font, color: rgb(0, 0, 0) });
    y -= fontSize + 6;
  }

  const bytes = await pdfDoc.save();
  await mkdir("data", { recursive: true });
  await writeFile("data/source.pdf", bytes);
  console.log(`data/source.pdf gerado (${bytes.length} bytes).`);
}

main();
