# Tigre Slack Bot

Socket Mode Slack bot for Exa-backed research. Requires Node 22.18+ and a local `.env` with `OPENROUTER_API_KEY`, `EXA_API_KEY`, `SLACK_BOT_TOKEN`, and `SLACK_APP_TOKEN`.

```sh
npm install
npm run typecheck
npm run slack
```

Run exactly one instance. The process lock prevents duplicate Socket Mode connections and is removed when the process stops. Copy `.env.example` to `.env`; never commit the resulting file.
