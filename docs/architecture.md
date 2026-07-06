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
