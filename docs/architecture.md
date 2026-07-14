# Arquitetura

## Fluxo

```
[PDF] --PDFLoader--> [Document[]] --RecursiveCharacterTextSplitter--> [chunks]
  --sanitizeMetadata--> --HuggingFaceTransformersEmbeddings--> [vetores]
  --Neo4jVectorStore.fromDocuments--> [Neo4j]

[pergunta] --similaritySearchWithScore--> [chunks + score] --filterByScore(>=0.5)--> [contexto]
  --renderTemplate + ChatPromptTemplate--> [mensagens] --ChatOpenAI.invoke (OpenRouter)--> [resposta]
```

## RunnableSequence e ChainState

`AI.answerQuestion` monta um `RunnableSequence` de dois passos (`retrieveVectorSearch` →
`generateAnswer`), cada um recebendo e retornando um `ChainState` imutável:

```typescript
interface ChainState {
  question: string;
  context: Document[];
  answer: string;
  usedLLM: boolean;
  error?: string;
}
```

Erros de qualquer etapa são gravados em `state.error` em vez de lançados na hora — o passo
seguinte verifica `state.error` e, se presente, apenas repassa o estado adiante sem
executar sua própria lógica. No fim, `answerQuestion` lança o erro (propagado, nunca
engolido) se `finalState.error` estiver presente.

## `similaritySearch` vs `similaritySearchWithScore`

Usamos sempre `similaritySearchWithScore`, nunca `similaritySearch` puro: sem o score não
temos como aplicar o filtro de relevância mínima, e o sistema responderia com base em
chunks que sequer são parecidos com a pergunta.

## Sanitização de metadata (`sanitizeMetadata`)

`PDFLoader` e `RecursiveCharacterTextSplitter` anexam metadata aninhada aos chunks
(`metadata.pdf.info`, `metadata.loc.lines`) para depuração. O Neo4j só aceita
propriedades de nó primitivas ou arrays de primitivas — gravar essa metadata direto
falha com `Neo.ClientError.Statement.TypeError`. `src/ingest.ts` achata a metadata para
`{ source: string, pageNumber: number }` antes de chamar `Neo4jVectorStore.fromDocuments`.

## Harness de avaliação (`src/eval/`, `src/evalRunner.ts`)

`src/eval/goldenSet.ts` guarda 11 perguntas rotuladas (`single-hop` | `multi-hop` |
`out-of-scope`) com os fatos que a resposta precisa conter. `src/eval/metrics.ts`
calcula 3 métricas puras, sem LLM-judge:

- `hitAtK`: todo fato esperado aparece em algum chunk do `context` retornado por
  `AI.answerQuestion`?
- `answerContainsFacts`: todo fato esperado aparece no texto da resposta final?
- `isCorrectRefusal`: a resposta bate exatamente com `NO_CONTEXT_ANSWER` (exportada de
  `src/ai/AI.ts`, não duplicada)?

As três normalizam texto antes de comparar (minúsculas, sem acento, espaços colapsados)
— o PDF real tem artefatos de extração (acento sumindo, quebra de linha no meio de um
nome) que quebrariam comparação literal sem isso.

`src/eval/report.ts` agrupa os resultados por categoria — nunca um agregado único, pra
não esconder uma categoria fraca atrás da média das outras.

`src/evalRunner.ts` é o entry point real: reaproveita `ingestDocument`, `AI` e
`loadConfig` já existentes no pipeline principal, roda o golden set contra Neo4j+LLM de
verdade, e grava `outputs/eval-report-<timestamp>.md`.
