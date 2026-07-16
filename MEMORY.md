# Glover Enterprise — Session Memory

## Purpose
Rolling session log across all Claude sessions. Read at session start (step 3 of CLAUDE.md startup protocol). Update at session end before closing.

**Rules:**
- Never delete old entries
- Add new entries at the TOP (newest first)
- If two sessions run the same day, include approximate time in the header
- If Notion Brain is unreachable, this file is the only context — keep it accurate

**Known limitation:** Updates depend on Claude completing the end-of-session protocol. There is no automated enforcement. If a session crashes mid-task, the last entry may be incomplete. Future fix: GitHub Action that commits MEMORY.md post-session automatically.

---

## Session: Jul 16, 2026 — late evening

### Built & Deployed
- **Outreach Pipeline** (`agents/tasks/outreach-pipeline.js`) — fully built, committed to main. Scrapes YellowPages → Ling-1T scoring → Laguna M.1 cold email → Resend send → logs to `agents/leads/pipeline-log.json`. Fires Mon/Wed/Fri 9am CT via `.github/workflows/outreach-pipeline.yml`.
- **pipeline-log.json** seeded with 5 real verified Alabama leads via Vibe Prospecting MCP:
  1. Robert Cramer — Birmingham Dental — `robert@birminghamdental.com` ✅ valid — software background, high-dollar implants
  2. Kimberly Alston — Quality Car Care LLC — `kim@qualitycarcare.autos` ✅ valid
  3. Scott Sprayberry — Sprayberry Orthodontics — `scottsprayberry@sprayberryortho.com` ✅ valid — $5-10M revenue
  4. Dylan Devall — Next Level Automotive — `dani@nl-autodetail.com` (catch-all)
  5. Sunny Chung — Inverness Smiles — `chung@invernesssmiles.com` (catch-all)
  - All have personalized cold emails written and ready to send. `sent: false` — waiting on RESEND_API_KEY.
- **Reverted bad Notion Brain ID commit** — prior session had wrong ID `30c9ce9b...`. Real Brain ID confirmed: `3629f925-93e5-814e-a7c8-dc4e1d4c93e7`. Reverted with `git revert`.
- **CLAUDE.md** corrected — Brain URL now points to correct ID.

### Decisions Made & Why
| Decision | Why |
|----------|-----|
| OpenClaw = session launcher only, not infra | It ran in a runaway loop and burned OpenRouter credits. Spawning sessions = OK. Autonomous loops = retired. |
| Vibe Prospecting MCP for lead enrichment | YellowPages rarely has email. Vibe finds verified owner emails + LinkedIn + revenue estimates. Only available in claude.ai sessions, not GitHub Actions. |
| Seed pipeline-log.json manually via MCP | Can't trigger GitHub Actions via MCP (403 — no actions:write scope). Worked around by pulling leads in-session. |
| Robert Cramer = #1 outreach priority | Valid email, software background (understands AI immediately), high-dollar procedures ($1,500-3K each), so missed calls cost most. |
| FROM_EMAIL = `Eric Glover <eric@grabcalls.com>` | Warm name+email combo. Domain must be verified in Resend or emails bounce. |

### Open Blockers
1. **RESEND_API_KEY not in GitHub Secrets** — pipeline runs but logs only, does not send. Fix: resend.com → API key (already created per screenshot) → github.com → repo → Settings → Secrets → Actions → `RESEND_API_KEY`
2. **FROM_EMAIL not in GitHub Secrets** — same path, add `FROM_EMAIL` = `Eric Glover <eric@grabcalls.com>`
3. **grabcalls.com not verified in Resend** — without this, emails from eric@grabcalls.com are rejected. Fix: Resend → Domains → Add Domain → grabcalls.com → copy DNS records → add to Cloudflare
4. **NOTION_TOKEN not in GitHub Secrets** — daily agent can't write to Brain. Low priority vs sending emails.
5. **Hetzner SSH broken** — n8n/RealOrAI status unknown. Fix: hetzner.com → web console → VNC → `docker ps`
6. **GrabCalls MRR = $0** — 5 emails ready to send, blocked only on RESEND_API_KEY + domain verify

### Next 3 Priority Actions
1. Add RESEND_API_KEY + FROM_EMAIL to GitHub Secrets (Resend account already created — key is on screen)
2. Verify grabcalls.com in Resend → add DNS records in Cloudflare → pipeline starts auto-sending Monday
3. Manually trigger pipeline at github.com/G-lover10/grabcalls-website/actions to send the 5 seeded leads immediately (don't wait for Monday)

---

## Session: Jul 16, 2026 — evening

### Built & Deployed
- **Mission Control v6** → grabcalls.com/mission-control/ — PR #9 merged to main, live. 7 tabs: Overview, Systems, Agents, Tasks, Projects, Pipeline, Brain.
- **agents/ system** — daily-brief, research, outreach, campaign-analysis, deep-research, test. Live on main, fires 8:15am CT.
- **CLAUDE.md** — full global context layer: startup protocol, model routing, locked decisions, system status, Notion fallback, OPENROUTER error behavior
- **AGENTS.md** — project context layer: architecture, task system with auto/manual flags, coding rules, business context
- **MEMORY.md** — this file. Rolling session log, decisions with WHY column.

### Decisions Made & Why
| Decision | Why |
|----------|-----|
| No draft PRs — merge directly | User had to manually merge every PR. Not autonomous. |
| Three-layer context stack (CLAUDE.md → AGENTS.md → MEMORY.md) | Information environment determines output quality more than prompt wording. |
| Fable 5 = human-triggered only via workflow_dispatch | Costs $10/$50 per 1M tokens. Cannot run in daily scheduled tasks. |
| System Status table in CLAUDE.md, not AGENTS.md | Status spans all projects — wrong to put it in one project's file. |
| Notion fallback: if unreachable, use MEMORY.md | Sessions shouldn't stall if Notion is down. |
| OPENROUTER missing → fail loudly with error | Silent failures in agent tasks are worse than crashes. |
| BFRS = hands off, zero exceptions | In ownership handoff. Any push wastes time and breaks trust. |
| Context engineering > prompt engineering | Build the information environment first. Prompts are the last 1%. |

### Open Blockers
1. **NOTION_TOKEN** — not in GitHub Secrets → daily agent can't write to Brain. Fix: GitHub → Settings → Secrets → Actions → New secret
2. **Hetzner SSH broken** — server status unknown. Fix: hetzner.com → web console → VNC → `docker ps` and `systemctl list-units`
3. **GrabCalls MRR = $0** — no paying clients. Fix: run `campaign-analysis` from Actions → identify best channel → cold email auto repair shops
4. **ListSnap eBay token** — may be expired. Fix: open ListSnap → Settings → test eBay connection → regenerate at developer.ebay.com if expired
5. **eBay store about page** — spelling errors + blank video (eBay banned iframes 2024). Fix: user provides description text + YouTube URL → build inline-CSS HTML

### Next 3 Priority Actions
1. Add `NOTION_TOKEN` to GitHub Secrets → enables Brain auto-write from daily agent
2. Run `campaign-analysis` from GitHub Actions → get first GrabCalls outreach target → run `outreach` for cold email
3. Hetzner web console → confirm n8n running or not → decide keep or cancel the server

---

## How to Add a New Entry
Copy this block and paste it ABOVE the most recent session:

```markdown
## Session: [Date] — [morning/afternoon/evening]

### Built & Deployed
- [what was pushed/merged/deployed and where it lives]

### Decisions Made & Why
| Decision | Why |
|----------|-----|
| [decision] | [reason — the WHY matters for future sessions] |

### Open Blockers
1. [blocker — include how to fix it]

### Next 3 Priority Actions
1. [most urgent]
2. [second]
3. [third]
```
