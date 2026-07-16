#!/usr/bin/env node
// Glover Enterprise Agent Orchestrator
// Model routing (cost-optimized):
//   Ling-1T free  → extraction, bulk, scoring
//   Laguna M.1 free → copywriting, emails
//   Sonnet         → daily synthesis, standard research
//   Fable 5        → deep-research only (explicit trigger, expensive)

const { runDailyBrief } = require('./tasks/daily-brief');
const { researchProspects, deepResearch, writeOutreachEmail, analyzeCampaignIdeas } = require('./tasks/grabcalls-research');
const { runOutreachPipeline } = require('./tasks/outreach-pipeline');
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
  console.log(`Routing: Ling-1T/Laguna (free) → Sonnet (standard) → Fable 5 (deep only)\n`);

  try {
    switch (task) {
      case 'daily-brief': {
        const emails = process.env.EMAIL_SUMMARIES || 'No email summaries provided for this run.';
        await runDailyBrief(emails);
        console.log('\n✅ Daily brief complete');
        break;
      }

      case 'research': {
        const bizType = arg1 || 'auto repair shop';
        const location = arg2 || 'Alabama';
        const result = await researchProspects(bizType, location);
        console.log('\n=== RESEARCH RESULTS ===\n' + result);
        break;
      }

      case 'deep-research': {
        // Fable 5 — only use when you need long-horizon strategy
        const topic = arg1 || 'GrabCalls 30-day go-to-market strategy for Alabama SMBs';
        console.log('⚠️  Using Fable 5 — this costs more. Use sparingly.');
        const result = await deepResearch(topic);
        console.log('\n=== DEEP RESEARCH ===\n' + result);
        break;
      }

      case 'outreach': {
        const bizName = arg1 || 'Local Business';
        const type = arg2 || 'small business';
        const email = await writeOutreachEmail(bizName, type);
        console.log('\n=== OUTREACH EMAIL ===\n' + email);
        break;
      }

      case 'outreach-pipeline': {
        await runOutreachPipeline();
        break;
      }

      case 'campaign-analysis': {
        const analysis = await analyzeCampaignIdeas();
        console.log('\n=== CAMPAIGN ANALYSIS ===\n' + analysis);
        break;
      }

      case 'test': {
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
      }

      default:
        console.error(`Unknown task: ${task}`);
        console.error('Available: daily-brief, outreach-pipeline, research, deep-research, outreach, campaign-analysis, test');
        process.exit(1);
    }
  } catch (err) {
    console.error(`\n❌ Agent failed: ${err.message}`);
    process.exit(1);
  }
}

main();
