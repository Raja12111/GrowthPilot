# GrowthPilot

Light-theme growth tools with Parasite Posting.

## Local

```bash
npm install
npm run dev -- --port 43123
```

Open http://127.0.0.1:43123 — **Sign up / Sign in**, then use Create a Post.

Accounts are stored in the browser (local). Posts and connections are scoped to the signed-in user.

## Product

- **Login** — create an account, then compose and publish
- **Parasite Posting** — Create a Post, Queue, Published, History (timeline of published vs not)
- **AI Write / Rewrite** — OpenAI Chat Completions (`OPENAI_API_KEY` + `gpt-4o-mini`)
- **Prompts** — save writing prompts in the sidebar and use them on Create a Post
- **Integrations** — one tab for platforms with Connect to GrowthPilot status
- **Support** — connection guides + tutorials
- **Auto publish** — Ghost, Telegram, Webflow, LiveJournal, Threads, DEV.to, Hashnode, Bluesky, WordPress, Tumblr, Mastodon
- **Medium** — manual posting only (Medium no longer issues new Integration Tokens)
- **Instantly Email** — API v2 connect, list campaigns, add leads, start/pause

### OpenAI

- Endpoint: `https://api.openai.com/v1/chat/completions`
- Env: `OPENAI_API_KEY` (optional `OPENAI_MODEL`, default `gpt-4o-mini`)
- Or connect a key in **Integrations → OpenAI**, then use **Write** / **Rewrite** on Create a Post

## Stack

Next.js + TypeScript + Tailwind + shadcn/ui
