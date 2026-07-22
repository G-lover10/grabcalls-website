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

## Session: Jul 22, 2026 — afternoon

### Built & Deployed
- **Glover Heating & Air Conditioning website** → `grabcalls.com/glover-heating-air/` (new directory: `glover-heating-air/`). Real client site for Eric's dad's HVAC business, not a demo/prospecting page.
- Custom design (not copied from `alabama-cooling-heating` template) — navy/red brand palette matched to the business card logo, Fraunces + Inter typography, hand-built SVG icon set and a recreated "GL✻VER" wordmark (flame-over-snowflake mark). No stock photos, no emoji.
- Content is 100% fact-checked against what Eric confirmed — no fabricated years-in-business, license numbers, review counts, or fake testimonials (the alabama-cooling-heating template has all of these; deliberately did not reuse that pattern).
- Owner story section built from real details: Ralph Glover — 30-year fire & rescue career (Center Point Fire, North Shelby Fire, retired from Odenville Fire & Rescue). Eric Glover — active firefighter, Birmingham Fire and Rescue + Odenville Fire and Rescue. This is the site's core trust/differentiation angle.
- SEO: `HVACBusiness` + `FAQPage` JSON-LD schema, canonical tag, OG/Twitter card tags, geo-targeted title/meta (Birmingham AL + surrounding cities pulled from the family's actual fire-department service area: Center Point, Trussville, Clay, Springville, Odenville, Moody, Argo, Pell City, Chelsea, Pelham, North Shelby County).
- Added root-level `robots.txt` (none existed before) and `sitemap.xml` listing the homepage + the new Glover page.
- Generated `favicon.svg`, `apple-touch-icon.png`, `favicon-32.png`, `og-image.png` via a one-off Playwright/Chromium render script (no image-gen tool available in this session — asked Eric about Grok, but there's no Grok/image tool in the toolset, so went with hand-built SVG brand assets instead).
- Visually QA'd desktop + mobile via Playwright screenshots before shipping.

### Decisions Made & Why
| Decision | Why |
|----------|-----|
| Did not fabricate "years in business," licensing, financing, or 24/7 claims | Eric didn't confirm these; the business card only confirms "New Installations, Repairs, Replacement, Etc." and "Firefighter Owned and Operated." Fabricating trust signals is the opposite of "people you can trust." |
| No testimonials/reviews section | No real Google reviews exist yet for this business — fake ones would be dishonest and risk FTC issues. Left a note in the plan (not on-page) that GBP + real reviews are the next step. |
| Hosted at `grabcalls.com/glover-heating-air/` for now, not a new domain | Eric chose to ship now rather than wait on a domain purchase. Code is domain-agnostic — moving to a dedicated domain later is a DNS change in Cloudflare, no rebuild. |
| Custom-built SVG icons/logo instead of stock photos or emoji | Eric explicitly said no generic emojis or cheap-looking elements, and no real photos were available yet. |
| Ralph's number (205-296-8029) is primary; Eric's (205-914-3390) is secondary | Eric's own answer when asked. |

### Open Blockers
1. **No Google Business Profile yet** — this is the single biggest lever for "AC repair near me" search visibility (more than the website itself). Someone (Ralph or Eric) needs to claim/verify a free GBP listing at business.google.com with category "HVAC Contractor," matching NAP to the site. I have no GBP/GMB tool access to do this myself.
2. **No real photos** — truck, Ralph, completed jobs. Site is built to drop photos in later (hero, about section) without a redesign.
3. **Domain** — still on `grabcalls.com/glover-heating-air/`. Recommended a dedicated domain (e.g. gloverheatingandair.com, ~$12/yr) for stronger long-term local SEO/credibility; Eric deferred this.
4. **No verified business email** — contact section is call/text only (tel: and sms: links), intentionally, since no email was confirmed and there's no form backend in this static setup.

### Next 3 Priority Actions
1. Claim & verify Google Business Profile for Glover Heating & Air Conditioning (Birmingham, AL) — biggest unlock for actually showing up in "AC repair near me" searches.
2. Submit `https://grabcalls.com/sitemap.xml` in Google Search Console and request indexing of `/glover-heating-air/`.
3. Get first few real Google reviews once GBP is live — review velocity matters more than a review dump.

---

## Session: Jul 16, 2026 — night (continued)

### Key Diagnosis
- **Voice agent root cause FOUND**: n8n CLOUD trial expired Feb 22, 2026. Workflows have been dead for 4+ months, not just today. The self-hosted n8n on Hetzner may also be down (server was locked for non-payment July 9–14, paid July 14, but services may not have restarted automatically). Either way, n8n is no longer viable. Moving permanently to Bland.ai.
- Eric has active Bland.ai account (signed up March 30, 2026) and active VAPI account — both cloud-hosted, no Hetzner dependency.

### Built & Deployed
- **`agents/tasks/setup-bland-agent.js`** — one-shot script that: (1) creates GrabCalls inbound agent "Ava" on Bland.ai for (205) 605-9842, (2) updates Twilio VoiceUrl to point to Bland. Agent prompt: GrabCalls receptionist, collects callback info from interested business owners.
- **`.github/workflows/setup-bland-agent.yml`** — workflow_dispatch-only GitHub Action. Eric runs it once with the right secrets and the voice agent is live on Bland forever.

### Secrets Needed to Run Setup Bland Agent
| Secret | Where to get it |
|--------|----------------|
| `BLAND_API_KEY` | app.bland.ai → Settings → API Keys |
| `TWILIO_ACCOUNT_SID` | twilio.com console → Account Info |
| `TWILIO_AUTH_TOKEN` | twilio.com console → Account Info |
| `TWILIO_PHONE_SID` | twilio.com → Phone Numbers → (205) 605-9842 → SID (starts with PN) |

### After Setup
- Add `BLAND_INBOUND_URL` = printed by the workflow to GitHub Secrets — enables voice-watchdog to auto-recover if Bland goes down
- Voice watchdog already built and running every 2 hours — it will auto-switch to Bland if n8n is ever checked again
- Hetzner can be canceled (RealOrAI is the only remaining dependency — still blocked on SSH)

### Next 3 Priority Actions
1. **Add 4 secrets above → run "Setup Bland.ai Voice Agent" workflow** → (205) 605-9842 is live again
2. **Add RESEND_API_KEY + FROM_EMAIL to GitHub Secrets** → 5 pre-seeded leads auto-send on next pipeline run
3. **Manually trigger outreach-pipeline from GitHub Actions** → don't wait for the 9am CT cron

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
