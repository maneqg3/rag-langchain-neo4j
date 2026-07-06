# Estratégia de Prompts

## JSON + template, não prompt livre

`src/prompts/answer-prompt.json` guarda a intenção estruturada (tarefa, instruções,
formato de saída) com `metadata.version` — mudanças de prompt viram diffs revisáveis no
histórico do git, em vez de strings soltas espalhadas pelo código.

`src/prompts/response-template.txt` é o template de montagem final, com os placeholders
`{{context}}`, `{{instructions}}` e `{{question}}`, substituídos por
`renderTemplate()` (`src/prompts/renderTemplate.ts`) via `String.replaceAll`.

## Regras do sistema

1. Usar somente o contexto fornecido.
2. Dizer explicitamente quando o contexto não é suficiente.
3. Nunca inventar fatos fora do contexto.
4. Responder sempre em português do Brasil.
5. Ser direto e objetivo.

## Por que o filtro de score acontece antes do prompt, não dentro dele

Poderíamos confiar só na instrução "diga que não sabe" e deixar o LLM decidir. Em vez
disso, `filterByScore` (`src/retrieval/vectorSearch.ts`) descarta chunks abaixo de 50% de
similaridade *antes* de montar o prompt — se nenhum chunk sobra, a resposta fixa
("não tenho informação suficiente...") é retornada sem sequer chamar o LLM. Isso é mais
barato (economiza a chamada) e mais determinístico (não depende do LLM obedecer a
instrução à risca).
