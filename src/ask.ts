import "./env.ts";
import { formatHits, searchWeb } from "./exa.ts";
import { research } from "./research.ts";

const question = process.argv.slice(2).join(" ").trim();

if (!question) {
  console.error('Usage: npm run ask -- "who is this startup and is it real?"');
  process.exit(1);
}

const hits = await searchWeb(question);
const answer = await research(question);

console.log("\n=== Fuentes Exa ===\n");
console.log(formatHits(hits));
console.log("\n=== Tigre ===\n");
console.log(answer);
console.log("");
