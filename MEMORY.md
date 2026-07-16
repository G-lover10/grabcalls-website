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
