# Handoff: Mission Control (for Claude)

Read this first. Do not merge. Do not force-push. Do not put API keys, tokens, or passwords in the repo, the HTML, or items.json. Do not change Telegram, OpenClaw, or BotFather. Do not ask Eric to import n8n, create a key, paste a webhook, or rotate a token.

## Where this came from

Eric is the boss. The glass sphere is the manager. Voice is first. Typing is optional. This folder is ahead of the live page.

The live page at https://grabcalls.com/mission-control/ is still the July 16, 2026 snapshot. Do not trust its model list, revenue, or status.

GitHub write from Grok returned 403 ("Resource not accessible by integration"). Nothing here has been pushed.

Leave these alone unless Eric says otherwise:

- Repo: G-lover10/grabcalls-website
- Branch `claude/mission-control-assistant` (latest known commit d0adca2). Do not force-push it.
- Branch `claude/mission-control-phase1` is PR #61. Do not merge it. It does not have the sphere, meters, or live voice.

Put these files on a new branch. Open a pull request into main. Stop. Eric reviews.

## What is built

- `index.html` — glass sphere, disk and memory rings, GrabCalls at $0 of $300, lamps for Server, Telegram, ListSnap, and eBay. Lamps stay dim when fine. eBay has no live feed, so that lamp stays dim. Projects / Business switches one sentence.
- Tap the sphere to talk. Tap again to stop. Type is optional.
- Voice is xAI speech-to-speech, model `grok-voice-latest`, voice `eve`. The page calls `GET /api/voice-secret` and opens `wss://api.x.ai/v1/realtime` with protocol `xai-client-secret.<token>`. The long-lived key stays in the server environment. It is not in these files.
- Text chat uses `GET /api/chat` in the preview. Model `grok-4.3`. On grabcalls.com, `MC_CHAT_WEBHOOK` stays empty.
- `items.json` — the board. Stale means `last_updated` is more than 14 days ago. The browser must not write the repo.
- `n8n/mc-assistant-chat.json` — inactive. Placeholder credential only. Do not activate it.
- `server/mc-preview.mjs` — preview server. Serves the page, proxies ops status, answers `/api/chat`, and mints `/api/voice-secret` from `XAI_API_KEY`.

## Rules

- GoHighLevel is outdated. The Grok voice agent replaced it.
- BFRS is hands-off.
- The model list Fable 5, Sonnet, Laguna, Ling-1T is outdated.
- Synology is for private filing later. It is not connected. Do not build a local model yet.
- Learning is not built. Yes and Not now only show a message. Nothing is saved. Money, keys, email, and merging never run on their own.
- Important mail goes only to medicglover@gmail.com, and only for a real decision or a real problem. Do not send a running log.

## Live status

GET https://n8n.grabcalls.com/webhook/ops-status-92cfbede15b161c850df0601

Use `generated_at`, `healthy`, `problems[]`, `disk_used_pct`, `mem_available_mb`, `openclaw_gateway`, `telegram_bot`. Older than 6 hours, or a failed fetch, is STALE or UNAVAILABLE. Never a false green. https://grabcalls.com/status.json is 404. Do not build it.

Voice will not work on grabcalls.com until a server holds the xAI key. `server/mc-preview.mjs` is that server. Do not paste the key into GitHub.

