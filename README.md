# RAG Pipeline com LangChain JS + Neo4j

Pipeline de Retrieval-Augmented Generation: lê um documento PDF, gera embeddings locais,
armazena no Neo4j e responde perguntas em linguagem natural usando apenas o contexto
recuperado — sem inventar informação quando o contexto não é suficiente.

![Node](https://img.shields.io/badge/node-%3E%3D24-brightgreen)
![TypeScript](https://img.shields.io/badge/typescript-6.x-blue)
![LangChain](https://img.shields.io/badge/langchain.js-v1-black)
![Neo4j](https://img.shields.io/badge/neo4j-5.26-008cc1)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

## O que é este projeto

Um sistema de perguntas e respostas que lê um PDF, indexa o conteúdo por similaridade
vetorial e responde perguntas citando apenas o que está no documento — a base prática de
como ferramentas como o ChatGPT "leem" arquivos.

## Arquitetura

```
[Documento PDF] → [Chunking] → [Embeddings] → [Neo4j]
                                                   ↓
[Pergunta do usuário] → [Embedding da query] → [Similaridade]
                                                   ↓
                    [Contexto recuperado] → [Prompt] → [LLM] → [Resposta]
```

Ver detalhes em [`docs/architecture.md`](docs/architecture.md).

## Stack e por quê

| Ferramenta | Por quê |
|---|---|
| LangChain JS v1 | Orquestra retrieve→generate via `RunnableSequence`, integra Neo4j e OpenAI-compatible LLMs sem código de baixo nível |
| Neo4j | Vector store com índice nativo, além de já ser um grafo — espaço para evoluir para GraphRAG depois |
| OpenRouter | Endpoint compatível com OpenAI, dá acesso a modelos gratuitos sem cartão de crédito |
| Transformers.js | Embeddings rodando 100% local, sem custo de API e sem depender de rede para essa etapa |
| TypeScript strict | Pega erro de tipo antes de rodar contra um banco/LLM de verdade |

## Pré-requisitos

- Node.js 20+
- Docker
- Conta gratuita no [OpenRouter](https://openrouter.ai)

## Instalação e execução

```bash
git clone https://github.com/maneqg3/rag-langchain-neo4j.git
cd rag-langchain-neo4j
npm install
cp .env.example .env   # preencha NEO4J_PASSWORD e OPENROUTER_API_KEY

npm run infra:up       # sobe o Neo4j local
npm run dev            # indexa o documento e responde as perguntas de teste
```

Sem `OPENROUTER_API_KEY`, o comando acima ainda indexa o documento no Neo4j, mas avisa e
encerra antes de chamar o LLM.

## Como personalizar

- **Trocar o documento**: substitua `data/source.pdf` (ou aponte `DATA_PATH` no `.env` para outro caminho).
- **Trocar o modelo**: altere `OPENROUTER_MODEL` no `.env` — veja [modelos gratuitos](https://openrouter.ai/models?q=free).
- **Ajustar o prompt**: edite `src/prompts/answer-prompt.json` e `src/prompts/response-template.txt`.
- **Ajustar chunking e top-K**: `chunkSize`/`chunkOverlap` em `src/ingest.ts`; `TOP_K` e `SCORE_THRESHOLD` no `.env`.

## Avaliação automática

`npm run eval` roda um golden set de 11 perguntas (`src/eval/goldenSet.ts`) contra o
documento indexado, em 3 categorias: hop único, multi-hop (resposta exige combinar
fatos de chunks diferentes) e fora de escopo (deve disparar a recusa). Métricas são
objetivas, sem LLM-judge: hit@k de retrieval, presença do fato esperado na resposta, e
recusa correta — ver `docs/architecture.md`.

Precisa de Neo4j de pé (`npm run infra:up`) e `OPENROUTER_API_KEY` configurada. Fica
fora do `npm test` padrão — não quebra CI sem essa infra. Relatório vai pra
`outputs/eval-report-<timestamp>.md`, um arquivo novo por run (nunca sobrescreve, pra
dar pra comparar antes/depois de uma mudança).

## Aprendizados e limitações conhecidas

- `@langchain/community` está marcado como deprecated no npm, mas ainda é a única fonte
  para `HuggingFaceTransformersEmbeddings` e `PDFLoader` — o aviso no install é esperado.
- O `PDFLoader` anexa metadata aninhada (`pdf.info`, `loc.lines`) que o Neo4j rejeita —
  propriedades de nó só aceitam primitivos ou arrays de primitivos. `src/ingest.ts` achata
  essa metadata para `{ source, pageNumber }` antes de indexar (`sanitizeMetadata`).
- O score mínimo de 50% é descartado deliberadamente: preferimos responder "não tenho
  informação suficiente" a arriscar contexto fraco viesando a resposta — e isso evita
  chamar o LLM à toa quando não há contexto relevante.
- Na primeira indexação (`preDeleteCollection: true` sem índice existente ainda), o
  driver do Neo4j loga `"Unable to drop index... There is no such index"` — é
  informativo, não interrompe o pipeline.
- Testado de ponta a ponta com Neo4j real e um PDF real (receita de bolo): indexação,
  busca vetorial e geração de resposta via LLM funcionam. Perguntas sobre RAG corretamente
  retornam "não há informação no contexto" — o documento é sobre culinária, não sobre RAG,
  e o pipeline não inventa uma resposta só porque tem um LLM disponível.
- Bug real encontrado: o processo nunca fechava a conexão do Neo4j
  (`Neo4jVectorStore.close()`), então `npm run dev` ficava pendurado mesmo após terminar
  ou falhar. Rodar várias vezes sem perceber isso empilha processos concorrentes batendo
  na mesma API ao mesmo tempo — o que pareceu, por um tempo, um rate-limit implacável do
  modelo gratuito. A causa real era os processos zumbis, não o modelo. Corrigido com
  `try/finally` em `src/index.ts`.
- Modelos gratuitos do OpenRouter têm disponibilidade instável por provider (ex:
  `meta-llama/llama-3.2-3b-instruct:free` via provider "Venice" ficou rate-limited por
  vários minutos seguidos). O default do projeto é `openai/gpt-oss-20b:free`, mas vale
  conferir a lista atual em https://openrouter.ai/models?q=free se a resposta não vier.
- Primeiro smoke test do harness de avaliação (`npm run eval`) contra Neo4j real: 6/11
  passaram (hop único 2/4, multi-hop 2/4, fora de escopo 0/3). As 3 recusas fora de
  escopo falharam porque `scoreThreshold: 0.5` quase nunca esvazia o contexto num corpus
  pequeno (12 chunks) — o LLM decide sozinho recusar, com texto livre em vez da mensagem
  fixa `NO_CONTEXT_ANSWER`. Ele não inventou resposta em nenhum dos 3 casos (não
  alucinou), só não usou o caminho determinístico — o filtro de score, hoje, não é
  suficiente sozinho pra bloquear o LLM nesses casos.
- Achado mais sério: em `multi-2` ("compare o placar de 2026 com o de 2014"), o LLM
  respondeu "7 a 1" corretamente, mas o chunk com esse fato (semifinal de 2014 x
  Alemanha) não estava entre os 4 chunks recuperados — o modelo puxou conhecimento
  próprio sobre um evento histórico real e famoso, não o contexto fornecido. Viola a
  regra "usar somente o contexto" (`docs/prompts-strategy.md`) mesmo respondendo certo.
  `single-3` e `single-4` tiveram miss de retrieval genuíno: o chunk relevante não entrou
  no top-K, e ruído de rodapé de página ("Inglaterra segura pressão...") competiu com
  conteúdo relevante. `multi-4` foi limitação da própria métrica: a resposta usou "cinco
  títulos" em vez do texto-fonte literal "cinco no total" — `answerContainsFacts` é
  substring exata, sem LLM-judge, então não reconhece paráfrase.

## Próximos passos / melhorias planejadas

- Reconectar a um índice já existente via `Neo4jVectorStore.fromExistingIndex` (separar
  processo de indexação do processo de consulta).
- Sumarização automática dos chunks antes do índice.
- Interface web simples.

## Licença

MIT — veja [LICENSE](LICENSE).
