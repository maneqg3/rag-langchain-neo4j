export function formatAnswerMarkdown(question: string, answer: string, sources: string[]): string {
  const sourcesList =
    sources.length > 0 ? sources.map((source) => `- ${source}`).join("\n") : "- nenhuma (resposta sem contexto)";

  return `# Pergunta\n\n${question}\n\n# Resposta\n\n${answer}\n\n# Fontes\n\n${sourcesList}\n`;
}
