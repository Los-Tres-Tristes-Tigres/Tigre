export type SearchHit = {
  title: string;
  url: string;
  highlights: string[];
};

export async function searchWeb(query: string, numResults = 5): Promise<SearchHit[]> {
  const apiKey = process.env.EXA_API_KEY;
  if (!apiKey) throw new Error("Missing EXA_API_KEY");

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    signal: AbortSignal.timeout(30000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      type: "auto",
      numResults,
      contents: { highlights: true },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Exa ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    results?: Array<{
      title?: string;
      url?: string;
      highlights?: string[];
    }>;
  };

  return (data.results ?? []).map((result) => ({
    title: result.title ?? "Untitled",
    url: result.url ?? "",
    highlights: result.highlights ?? [],
  }));
}

export function formatHits(hits: SearchHit[]): string {
  if (hits.length === 0) return "No web results found.";

  return hits
    .map((hit, index) => {
      const excerpts = hit.highlights
        .slice(0, 2)
        .map((text) => (text.length > 280 ? `${text.slice(0, 280)}…` : text))
        .join(" ")
        .trim();
      return `${index + 1}. ${hit.title}\n   ${hit.url}\n   ${excerpts}`;
    })
    .join("\n\n");
}
