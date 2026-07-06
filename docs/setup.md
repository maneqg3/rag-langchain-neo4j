# Setup

## 1. Neo4j local

```bash
cp .env.example .env
# edite NEO4J_PASSWORD no .env
npm run infra:up
```

Verifique em `http://localhost:7474` (porta do browser) — deve pedir login com o usuário/senha
definidos em `NEO4J_USERNAME`/`NEO4J_PASSWORD`.

## 2. Key do OpenRouter

1. Crie uma conta gratuita em https://openrouter.ai
2. Gere uma key em https://openrouter.ai/keys
3. Cole em `OPENROUTER_API_KEY` no `.env`
4. Confira modelos gratuitos atuais em https://openrouter.ai/models?q=free e ajuste
   `OPENROUTER_MODEL` se o modelo padrão não estiver mais disponível

## 3. Variáveis de ambiente

| Variável | Obrigatória | Default | Descrição |
|---|---|---|---|
| `NEO4J_URI` | sim | — | endereço bolt do Neo4j |
| `NEO4J_USERNAME` | sim | — | usuário do Neo4j |
| `NEO4J_PASSWORD` | sim | — | senha do Neo4j (deve bater com `docker-compose.yml`) |
| `NEO4J_INDEX_NAME` | não | `vector_index` | nome do índice vetorial |
| `NEO4J_NODE_LABEL` | não | `Chunk` | label dos nós que guardam os chunks |
| `OPENROUTER_API_KEY` | não* | — | sem ela, indexação roda mas LLM não é chamado |
| `OPENROUTER_MODEL` | não | `meta-llama/llama-3.2-3b-instruct:free` | slug do modelo no OpenRouter |
| `OPENROUTER_BASE_URL` | não | `https://openrouter.ai/api/v1` | endpoint compatível com OpenAI |
| `EMBEDDING_MODEL` | não | `Xenova/all-MiniLM-L6-v2` | modelo de embeddings local |
| `DATA_PATH` | não | `./data/source.pdf` | caminho do PDF a indexar |
| `OUTPUTS_DIR` | não | `./outputs` | onde salvar as respostas em markdown |
| `TOP_K` | não | `4` | quantos chunks buscar por pergunta |
| `SCORE_THRESHOLD` | não | `0.5` | score mínimo (0-1) para um chunk entrar no contexto |

*Obrigatória apenas para a etapa de geração de resposta — a indexação funciona sem ela.

## 4. Rodando

```bash
npm run dev
```

Primeira execução baixa o modelo de embeddings local (cache do Transformers.js) — pode
levar 1-2 minutos dependendo da conexão. Execuções seguintes usam o cache.

## 5. Substituindo o PDF placeholder

O repositório vem com um PDF placeholder gerado por `npm run generate:placeholder-pdf`
(texto genérico sobre RAG), só para validar o pipeline. Para usar seu próprio documento:

```bash
cp seu-documento.pdf data/source.pdf
npm run dev
```

## 6. Testes e build

```bash
npm test    # roda a suíte Vitest (unitários, sem depender de Neo4j/OpenRouter)
npm run build   # compila TypeScript para dist/
```
