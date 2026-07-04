#!/usr/bin/env node
// Glover Enterprise Agent Orchestrator
// Routes tasks to the right model via OpenRouter
// Run: node agents/index.js <task>
// Tasks: daily-brief, research, outreach, campaign-analysis

const { runDailyBrief } = require('./tasks/daily-brief');
const { researchProspects, writeOutreachEmail, analyzeCampaignIdeas } = require('./tasks/grabcalls-research');
const { MODELS, callModel } = require('./models');

const task = process.argv[2] || 'daily-brief';
const arg1 = process.argv[3] || '';
const arg2 = process.argv[4] || '';

async function main() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.error('ERROR: OPENROUTER_API_KEY not set. Add it as a GitHub secret or env var.');
    process.exit(1);
  }

  console.log(`\n🤖 Glover Enterprise Agent — task: ${task}`);
  console.log(`Stack: Fable 5 (orchestrate) + Laguna M.1 (code) + Ling-1T (bulk)\n`);

  try {
    switch (task) {
      case 'daily-brief':
        // In GitHub Actions, EMAIL_SUMMARIES env var is set by a prior step
        const emails = process.env.EMAIL_SUMMARIES || 'No email summaries provided for this run.';
        const brief = await runDailyBrief(emails);
        console.log('\n✅ Daily brief complete');
        break;

      case 'research':
        const bizType = arg1 || 'auto repair shop';
        const location = arg2 || 'Alabama';
        const research = await researchProspects(bizType, location);
        console.log('\n=== RESEARCH RESULTS ===\n' + research);
        break;

      case 'outreach':
        const bizName = arg1 || 'Local Business';
        const type = arg2 || 'small business';
        const email = await writeOutreachEmail(bizName, type);
        console.log('\n=== OUTREACH EMAIL ===\n' + email);
        break;

      case 'campaign-analysis':
        const analysis = await analyzeCampaignIdeas();
        console.log('\n=== CAMPAIGN ANALYSIS ===\n' + analysis);
        break;

      case 'test':
        console.log('Testing all models...\n');
        for (const [key, model] of Object.entries(MODELS)) {
          try {
            const resp = await callModel(key, [
              { role: 'user', content: 'Reply with exactly: OK' }
            ], { maxTokens: 10 });
            console.log(`✅ ${model.name}: ${resp.trim()}`);
          } catch (e) {
            console.log(`❌ ${model.name}: ${e.message}`);
          }
        }
        break;

      default:
        console.error(`Unknown task: ${task}`);
        console.error('Available: daily-brief, research, outreach, campaign-analysis, test');
        process.exit(1);
    }
  } catch (err) {
    console.error(`\n❌ Agent failed: ${err.message}`);
    process.exit(1);
  }
}

main();
