export type HopCategory = "single-hop" | "multi-hop" | "out-of-scope";

export interface GoldenSetItem {
  id: string;
  category: HopCategory;
  question: string;
  expectedFacts: string[];
}

/**
 * Perguntas validadas contra o chunking real de data/source.pdf via `npm run inspect:chunks`
 * em 2026-07-13 (ver Task 1 do plano de implementação). Se o documento mudar, rode o
 * inspetor de novo e revise category/expectedFacts — a categorização depende de em quais
 * chunks os fatos realmente caem, não de proximidade no texto-fonte.
 */
export const goldenSet: GoldenSetItem[] = [
  {
    id: "single-1",
    category: "single-hop",
    question: "Qual foi o placar da partida entre Brasil e Noruega na Copa do Mundo de 2026?",
    expectedFacts: ["2 a 1"],
  },
  {
    id: "single-2",
    category: "single-hop",
    question: 'Quem dirigiu o documentário "Maracanã - O Filme"?',
    expectedFacts: ["Sebastián Bednarik", "Andrés Varela"],
  },
  {
    id: "single-3",
    category: "single-hop",
    question: "Contra qual seleção o Brasil perdeu na semifinal da Copa de 2014, e qual foi o placar?",
    expectedFacts: ["Alemanha", "7 a 1"],
  },
  {
    id: "single-4",
    category: "single-hop",
    question: "Quantos títulos de Copa do Mundo o Brasil tem, segundo o texto?",
    expectedFacts: ["cinco no total"],
  },
  {
    id: "multi-1",
    category: "multi-hop",
    question:
      "Quem marcou os gols decisivos contra o Brasil em 2026, e qual documentário retrata a eliminação de 2022?",
    expectedFacts: ["Haaland", "Croácia", "Capitães do Mundo"],
  },
  {
    id: "multi-2",
    category: "multi-hop",
    question: "Compare o placar da eliminação de 2026 com o da semifinal de 2014 — qual foi mais contundente?",
    expectedFacts: ["2 a 1", "7 a 1"],
  },
  {
    id: "multi-3",
    category: "multi-hop",
    question: "Dois documentários abordam a mesma derrota de 1950 — quais, e quem dirigiu cada um?",
    expectedFacts: ["Sebastián Bednarik", "Jorge Furtado"],
  },
  {
    id: "multi-4",
    category: "multi-hop",
    question: "Quantos títulos o Brasil tem, e quem eliminou o Brasil na Copa mais recente citada?",
    expectedFacts: ["cinco no total", "Noruega"],
  },
  {
    id: "oos-1",
    category: "out-of-scope",
    question: "Onde fica a França?",
    expectedFacts: [],
  },
  {
    id: "oos-2",
    category: "out-of-scope",
    question: "O que é Retrieval-Augmented Generation?",
    expectedFacts: [],
  },
  {
    id: "oos-3",
    category: "out-of-scope",
    question: "Qual foi o resultado de Argentina x Alemanha na Copa de 2026?",
    expectedFacts: [],
  },
];
