# Handoff: Mission Control assistant (for Claude)

Read this first. Do not merge anything. Do not put API keys, tokens, or passwords in the repo, the HTML, or items.json. Do not change Telegram or OpenClaw config.

## Paste this to Claude

You are picking up Glover Enterprise Mission Control. The attached folder is the work so far. Put it on branch `claude/mission-control-assistant` in `G-lover10/grabcalls-website` (path `mission-control/`). Open a pull request into `main`. Do not merge. Eric reviews first.

The live page is still the old July 16 file at https://grabcalls.com/mission-control/ until that PR is merged. This folder is ahead of that page.

## Decisions already made

- Voice: free browser speech first. `hostedSpeak` in `index.html` is the empty plug for a hosted voice API later. No ElevenLabs.
- Items live in `mission-control/items.json` in the repo. The browser must not write the repo.
- Chat model: xAI Grok, model id `grok-4.3`. Grok 4.1 Fast was not on the key that was available. One string in the n8n "Build prompt" node changes it.
- GoHighLevel is outdated. The Grok voice agent is the current voice tool.
- BFRS is hands-off. The model list "Fable 5 - Sonnet - Laguna - Ling-1T" is outdated.

## What is already built

- `index.html` keeps every existing tab and adds Items, a live status panel, and a chat/voice dock.
- `items.json` is the seed board. Stale means `last_updated` is more than 14 days ago. Outdated and stale items sit in Needs cleanup.
- `n8n/mc-assistant-chat.json` is the inactive workflow "MC Assistant Chat". It allows only `Origin: https://grabcalls.com`, caps messages at 2000 characters, reads items.json, and calls xAI. The credential id is the placeholder `REPLACE_WITH_XAI_HEADER_CREDENTIAL`.
- `README.md` covers adding an item and rotating the key.

Checked already:

- Phone width: no horizontal scroll. Items, filters, search, STALE, and a session link (`target=_blank`, `rel=noopener`) work.
- Live ops webhook is real. On 2026-11-06 it was fresh but not healthy: "openclaw hit model rate limits 6x in last hour". The panel must say CHECK, not green. A bad URL shows UNAVAILABLE.
- A ListSnap question came back with the real next step (eBay user token).
- A request with `Origin: https://evil.example` is rejected by the chat door.

## What Claude can finish

1. Commit these files and open the PR. Grok could read the repo and could not push (GitHub returned 403, "Resource not accessible by integration").
2. After Eric copies the production webhook URL out of n8n, set `MC_CHAT_WEBHOOK` in `index.html` and update the PR. Leave it empty until that URL exists. On grabcalls.com an empty value keeps chat visibly off.
3. Phase 2, only if Eric asks: goals, a locked decision log, and item edits that apply only after he confirms. Memory belongs in the existing `brain-postgres`, read through PostgREST, written only by n8n. Keep a git export so the page still works if n8n is down. Do not start Phase 3 (reading his three inboxes).

## What only Eric can do

- Create the xAI key at https://console.x.ai and save it in n8n as a Header Auth credential named `xAI API` (`Authorization: Bearer …`). Do not paste the key into a chat.
- In n8n: Import from File on `n8n/mc-assistant-chat.json`, attach that credential to "Call xAI", confirm the origin check, then activate. Copy the production URL back to Claude for `MC_CHAT_WEBHOOK`.
- Review and merge the PR himself.
- Rotate the Telegram bot tokens in @BotFather, and decide whether OpenClaw keeps `allowInsecureAuth=true`.
- Paste real Claude session URLs into `session_url` when he has them. One Notion brain link is only a placeholder on the Sol benchmark item.

Claude cannot log into n8n, BotFather, or the Hetzner web console unless Eric has that session open and asks him to drive it. SSH to the box is still a blocked item. Do not guess passwords.

## Live facts, so you do not trust the July page

Ops webhook (GET, CORS already allows https://grabcalls.com):

https://n8n.grabcalls.com/webhook/ops-status-92cfbede15b161c850df0601

Shape that matters: `generated_at`, `healthy`, `problems[]`, `host`, `uptime`, `disk_used_pct`, `disk_free`, `mem_available_mb`, `openclaw_gateway`, `telegram_bot`, `services[]`, `containers[]`, `endpoints` (HTTP codes as strings). Age is the snapshot time. Older than 6 hours, or a failed fetch, is STALE or UNAVAILABLE. Never a false green.

`https://grabcalls.com/status.json` is 404. Do not build that. Use the webhook.
