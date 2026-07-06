import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Document } from "@langchain/core/documents";
import { assertPdfFileExists, sanitizeMetadata } from "./ingest.js";

describe("assertPdfFileExists", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "rag-ingest-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("não lança erro quando o arquivo .pdf existe", () => {
    const pdfPath = join(tempDir, "doc.pdf");
    writeFileSync(pdfPath, "conteudo fake");

    expect(() => assertPdfFileExists(pdfPath)).not.toThrow();
    expect(existsSync(pdfPath)).toBe(true);
  });

  it("lança erro claro quando o arquivo não existe", () => {
    const missingPath = join(tempDir, "nao-existe.pdf");

    expect(() => assertPdfFileExists(missingPath)).toThrow(/não encontrado/);
  });

  it("lança erro claro quando a extensão não é .pdf", () => {
    const txtPath = join(tempDir, "doc.txt");
    writeFileSync(txtPath, "conteudo fake");

    expect(() => assertPdfFileExists(txtPath)).toThrow(/precisa ser um PDF/);
  });
});

describe("sanitizeMetadata", () => {
  it("achata a metadata aninhada do PDFLoader/splitter em campos primitivos", () => {
    const doc = {
      pageContent: "texto",
      metadata: {
        source: "data/source.pdf",
        pdf: { info: { Producer: "pdf-lib" }, totalPages: 1 },
        loc: { pageNumber: 2, lines: { from: 1, to: 10 } },
      },
    } as Document;

    const sanitized = sanitizeMetadata(doc);

    expect(sanitized.metadata).toEqual({ source: "data/source.pdf", pageNumber: 2 });
  });

  it("usa defaults quando source/pageNumber não estão presentes", () => {
    const doc = { pageContent: "texto", metadata: {} } as Document;

    const sanitized = sanitizeMetadata(doc);

    expect(sanitized.metadata).toEqual({ source: "desconhecida", pageNumber: 1 });
  });
});
