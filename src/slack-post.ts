export async function postToSlack(
  channel: string,
  text: string,
  threadTs?: string,
): Promise<{ channel: string; ts: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) throw new Error("Missing SLACK_BOT_TOKEN");

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    signal: AbortSignal.timeout(30000),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel,
      text: text.slice(0, 3500),
      thread_ts: threadTs,
    }),
  });

  const data = (await response.json()) as {
    ok?: boolean;
    error?: string;
    channel?: string;
    ts?: string;
  };

  if (!data.ok || !data.channel || !data.ts) {
    throw new Error(data.error || "Slack chat.postMessage failed");
  }

  return { channel: data.channel, ts: data.ts };
}
