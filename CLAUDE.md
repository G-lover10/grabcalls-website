# GrabCalls Website — Claude Code Session Startup

## STEP 1: Load Master Brain (do this before anything else)
Use the Notion MCP tool to fetch: https://app.notion.com/p/3629f92593e5814ea7c8dc4e1d4c93e7
Read: Inbox (tasks waiting), Last Session Log (what was just done), Active Flags.

## STEP 2: Check the Inbox
Act on any inbox items relevant to this repo before starting new work.

## STEP 3: Confirm task with Eric before building

---

## Project: GrabCalls.com
AI chatbots and voice agents for small businesses. 0 paying clients — this is priority #1.

## Repo Structure
- `/` — Static HTML pages (index.html, landing pages, demos)
- `/station-12/` — Station 12 B-Shift PWA (watch rotation + equipment swap checklist)
- `/mission-control/` — Mission control dashboard
- `/alabama-cooling-heating/`, `/beyond-blessed/`, `/cloth-on-main/` etc. — Client demo pages

## Deployment
- Auto-deploys to GitHub Pages on push to `main` via `.github/workflows/deploy-pages.yml`
- Live: https://g-lover10.github.io/grabcalls-website/
- Station 12: https://g-lover10.github.io/grabcalls-website/station-12/

## Active Branch for New Work
`claude/open-claw-automation-t94y4e`

## Autonomous Infrastructure Running
- GitHub Actions `deploy-pages.yml`: auto-deploys on push to main
- GitHub Actions `health-check.yml` (bfrs repo): daily BFRS monitoring
- GitHub Actions `grabcalls-health.yml`: daily grabcalls.com + Station 12 monitor

## End of Session Protocol
1. Push all changes to the claude/ branch
2. Create or update the PR
3. Write to Notion Master Brain → Last Session Log section (date, what was done, blockers, next steps)

## Owner
Eric Glover | grabcalls@gmail.com | (205) 914-3390
GitHub: https://github.com/G-lover10
