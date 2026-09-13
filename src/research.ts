import { formatHits, searchWeb } from "./exa.ts";
import { chat } from "./llm.ts";

export async function research(question: string, threadContext = ""): Promise<string> {
  const hits = await searchWeb(question);
  return chat([
    {
      role: "system",
      content:
        "You are Tigre, a Slack research agent. Use the Slack thread for who/what they mean. Answer using the web sources. Be concise. Use bullets. Cite source URLs. Reply in the same language as the question.",
    },
    {
      role: "user",
      content: [
        threadContext ? `Slack thread:\n${threadContext}\n` : "",
        `Question: ${question}`,
        "",
        "Web sources:",
        formatHits(hits),
      ].join("\n"),
    },
  ]);
}
