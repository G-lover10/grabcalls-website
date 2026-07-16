# GrabCalls Website — Agent Project Context

## Repository
- **GitHub:** github.com/G-lover10/grabcalls-website
- **Deploy:** Cloudflare Pages → grabcalls.com (auto-deploys on every push to main)
- **Branch rule:** Push to feature branch → merge to main directly. No draft PRs.

## Directory Structure
```
grabcalls-website/
├── agents/
│   ├── index.js              # CLI orchestrator (entry point)
│   ├── models.js             # OpenRouter model registry + routing + callModel()
│   ├── tasks/
│   │   ├── daily-brief.js    # Ling-1T extracts → Sonnet synthesizes → Notion write
│   │   └── grabcalls-research.js  # researchProspects, deepResearch, writeOutreachEmail, analyzeCampaignIdeas
│   └── package.json          # Zero external dependencies (native fetch only)
├── .github/workflows/
│   ├── agent-daily.yml       # Cron 8:15am CT — manual tasks via workflow_dispatch
│   └── grabcalls-health.yml  # Cron 8:07am CT — uptime check
├── mission-control/
│   └── index.html            # Dashboard → grabcalls.com/mission-control/
├── CLAUDE.md                 # Global context (read first)
├── AGENTS.md                 # This file — project context
└── MEMORY.md                 # Session log — read at session start, update at session end
```

## Agent Task System
All tasks run via: `node agents/index.js <task>`  
Trigger from: GitHub Actions → GrabCalls Daily Agent → Run workflow → select task

| Task | Model | Auto/Manual | Purpose |
|------|-------|-------------|--------|
| `daily-brief` | Ling-1T + Sonnet | AUTO 8:15am CT | Extract ideas → synthesize GrabCalls actions → write to Brain |
| `research "type" location` | Sonnet | Manual | Sales angles, pain points, outreach sequence for any biz type |
| `outreach "Biz" "type"` | Laguna M.1 (free) | Manual | Cold email, CTA to (205) 605-9842 |
| `campaign-analysis` | Ling-1T (free) | Manual | Score 10 outreach channels for first paying client |
| `deep-research "topic"` | **Fable 5 ($$$$)** | **Human trigger only** | Long-horizon strategy — costs significantly more, warn before using |
| `test` | All 5 models | Manual | Ping all models via OpenRouter — verify OPENROUTER_API_KEY is working |

**Fable 5 gate:** `deep-research` must only be triggered manually by the user via GitHub Actions → Run workflow → select "deep-research". Never call it from scheduled or automated flows.

## GitHub Actions Secrets
| Secret | Status | Action Required |
|--------|--------|-----------------|
| `OPENROUTER_API_KEY` | ✅ SET | None |
| `NOTION_TOKEN` | ❌ NOT SET | Add via GitHub → Settings → Secrets → Actions → New secret |

Adding `NOTION_TOKEN` enables the daily agent to write summaries to Notion Brain automatically.

## Coding Rules (This Repo)
- **Runtime:** Node.js 18+ only
- **HTTP:** Native `fetch` only — never `axios`, `node-fetch`, or any HTTP library
- **Dependencies:** Zero external npm packages in `agents/`. No `npm install` in Actions workflows.
- **Logging:** Every task must `console.log` its output to stdout — GitHub Actions logs are the audit trail
- **Secrets:** Never hardcode keys. Always `process.env.VARIABLE_NAME`
- **Before pushing new agent code:** run `node agents/index.js test` to verify all models respond
- **Merging:** Push to feature branch → merge to main. Never create draft PRs.

## GrabCalls Business Context
- **What it does:** AI voice agent answers calls 24/7, books appointments, qualifies leads for Alabama SMBs
- **Demo line:** (205) 605-9842 — AI answers live
- **Target price:** $200–400/month per client
- **Current MRR:** $0 — getting the first paying client is the only priority in this repo
- **Best channel (from Brain):** Google Maps scrape → cold email → auto repair shops in Alabama
- **Dashboard:** grabcalls.com/mission-control/
