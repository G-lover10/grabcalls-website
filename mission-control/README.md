# Mission Control assistant

Phase 1 of the company wall. The page reads `items.json`. It does not write anything. Chat is read-only and the model key never goes in this folder.

## Add an item

1. Edit [items.json](items.json). Add one object to `items`.
2. Fields: `id`, `type` (`idea`, `task`, `project`, or `app`), `title`, `status` (`active`, `blocked`, `paused`, `done`, or `outdated`), `owner`, `last_updated` (`YYYY-MM-DD`), `next_step`, `session_url` (Claude session link, or empty), `tags`.
3. Open a pull request. The browser cannot update the repo.
4. Do not put API keys, bot tokens, or passwords in this file.
5. An item whose `last_updated` is more than 14 days ago shows **STALE**. `outdated` or stale items sit in Needs cleanup.

## Rotate the Grok key

The key lives in n8n, not in `index.html` and not in `items.json`.

1. Create a new key at [console.x.ai](https://console.x.ai).
2. In n8n, open Credentials and the Header Auth credential named **xAI API**.
3. Set the header name to `Authorization` and the value to `Bearer NEW_KEY`.
4. Save the credential. The "Call xAI" node keeps using it. You do not edit the HTML.
5. Revoke the old key in the xAI console.

The workflow model is `grok-4.3` (one line in the Build prompt node). Grok 4.1 Fast was not on the key this page was built against. Change that string if you want a different model. Use a stronger model only for a weekly pass, not for every "what's blocked?" question.

## Import the chat workflow

1. In n8n, import [n8n/mc-assistant-chat.json](n8n/mc-assistant-chat.json). It imports inactive.
2. Create the **xAI API** Header Auth credential above and attach it to **Call xAI**. The file ships with a placeholder credential id, so the node will ask you to pick the real one.
3. Confirm **Validate** only allows `Origin: https://grabcalls.com`. A request from any other site gets `403` and `{ "error": "origin" }`.
4. Messages over 2000 characters get `400`.
5. Activate the workflow. Copy the production webhook URL into `MC_CHAT_WEBHOOK` at the top of the script in `index.html`, then ship that one-line change.
6. Webhook CORS must allow `https://grabcalls.com` (the Webhook node sets allowed origins; nginx in front of n8n must answer OPTIONS the same way the ops-status webhook already does).

Voice is the browser mic and `speechSynthesis`. The hosted-voice hook is the function `hostedSpeak` in `index.html`. It returns false on purpose.

Live status uses the existing ops webhook. If that call fails, or the snapshot is older than 6 hours, the panel says **UNAVAILABLE** or **STALE** and does not turn green.

Do not merge the pull request until you have reviewed it. Do not change Telegram or OpenClaw config from this page.
