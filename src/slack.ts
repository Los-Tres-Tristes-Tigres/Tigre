import "./env.ts";
import { App } from "@slack/bolt";
import { research } from "./research.ts";
import { acquireProcessLock } from "./process-lock.ts";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
}

const app = new App({
  token: required("SLACK_BOT_TOKEN"),
  appToken: required("SLACK_APP_TOKEN"),
  socketMode: true,
});
const releaseLock = await acquireProcessLock("tigre-slack");

function stripMention(text = ""): string {
  return text.replace(/<@[^>]+>/g, "").trim();
}

async function threadText(
  client: App["client"],
  channel: string,
  threadTs: string,
): Promise<string> {
  try {
    const result = await client.conversations.replies({
      channel,
      ts: threadTs,
      limit: 15,
    });
    return (result.messages ?? [])
      .map((message) => `${message.user ?? "user"}: ${message.text ?? ""}`)
      .join("\n");
  } catch {
    return "";
  }
}

async function answerInThread(
  client: App["client"],
  channel: string,
  ts: string,
  threadTs: string | undefined,
  rawText: string,
) {
  const question =
    stripMention(rawText) || "Resume este hilo y busca en la web lo que falte.";
  const context = await threadText(client, channel, threadTs ?? ts);

  await client.chat.postMessage({
    channel,
    thread_ts: threadTs ?? ts,
    text: "Investigando con Exa…",
  });

  try {
    const answer = await research(question, context);
    await client.chat.postMessage({
      channel,
      thread_ts: threadTs ?? ts,
      text: answer.slice(0, 3500),
    });
  } catch (error) {
    await client.chat.postMessage({
      channel,
      thread_ts: threadTs ?? ts,
      text: `No pude investigar: ${researchError(error)}`,
    });
  }
}

function researchError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/Missing EXA_API_KEY/.test(message)) return "falta configurar Exa.";
  if (/Missing OPENROUTER_API_KEY/.test(message))
    return "falta configurar OpenRouter.";
  if (/OpenRouter 402/.test(message))
    return "el modelo gratuito no está disponible ahora.";
  if (/^Exa \d+/.test(message)) return "la búsqueda web no está disponible ahora.";
  return "inténtalo de nuevo en un momento.";
}

app.event("app_mention", async ({ event, client }) => {
  await answerInThread(client, event.channel, event.ts, event.thread_ts, event.text);
});

app.event("message", async ({ event, client }) => {
  if (event.subtype || event.bot_id || event.channel_type !== "im") return;
  await answerInThread(client, event.channel, event.ts, event.thread_ts, event.text ?? "");
});

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await app.stop().catch(() => {});
  await releaseLock();
}

process.once("SIGINT", () => {
  void stop().finally(() => process.exit(0));
});
process.once("SIGTERM", () => {
  void stop().finally(() => process.exit(0));
});

try {
  await app.start();
  console.log("Tigre is online in Slack. Mention @los-tres-tristes-tigres or DM it.");
} catch (error) {
  await stop();
  throw error;
}
