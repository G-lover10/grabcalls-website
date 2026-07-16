// Daily Brief Task
// Ling-1T (free) extracts ideas from emails
// Sonnet synthesizes priority actions — Fable 5 only for deep-research task

const { callModel } = require('../models');

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const BRAIN_PAGE_ID = '30c9ce9b08b180a59acbee743306de9e';

async function appendToNotion(pageId, content) {
  const blocks = content.split('\n').filter(l => l.trim()).map(line => ({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [{ type: 'text', text: { content: line } }],
    },
  }));

  const resp = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ children: blocks }),
  });
  if (!resp.ok) throw new Error(`Notion append failed: ${resp.status}`);
}

async function runDailyBrief(emailSummaries) {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[daily-brief] Running for ${today}`);

  // Step 1: Ling-1T (free) — bulk extraction
  const extractionPrompt = [
    {
      role: 'user',
      content: `You are extracting actionable business/tech ideas from email summaries.

Today: ${today}
Context: Eric Glover runs GrabCalls (AI voice agents for SMBs, 0 paying clients — this is priority #1),
ListEasier (eBay/Facebook listing tool), and is pivoting BFRS staffing app to multi-tenant SaaS.

Email summaries to process:
${emailSummaries}

Extract 3-8 specific, actionable ideas. Format each as:
- [One sentence idea] (source: [newsletter/sender name])

Focus on: AI agent tools, voice AI sales strategies, SMB lead gen, SaaS pricing, automation patterns.
Skip: generic news, promotions, unrelated content.
Output ONLY the bullet list, nothing else.`,
    },
  ];

  console.log('[daily-brief] Extracting ideas with Ling-1T (free)...');
  const rawIdeas = await callModel('ling1T', extractionPrompt, { maxTokens: 1000 });

  // Step 2: Sonnet — synthesis (replaces Fable 5; good enough for this task at 5x lower cost)
  const synthesisPrompt = [
    {
      role: 'user',
      content: `You are helping Eric Glover's GrabCalls business (AI voice agents for SMBs).
His #1 goal: get the first paying client. 0 paying clients today.

Raw ideas extracted from today's emails:
${rawIdeas}

Pick the 1-2 most directly actionable ideas for getting GrabCalls' first paying client THIS WEEK.
Add a one-sentence "→ ACTION:" for each selected idea.
Keep total output under 200 words.`,
    },
  ];

  console.log('[daily-brief] Synthesizing with Sonnet...');
  const synthesis = await callModel('sonnet', synthesisPrompt, { maxTokens: 400 });

  const entry = `\n**[${today}] — Auto Heartbeat**\n${rawIdeas}\n\n🎯 Priority for GrabCalls:\n${synthesis}`;

  console.log('[daily-brief] Output:');
  console.log('=== NOTION ENTRY ===');
  console.log(entry);
  console.log('===================');

  if (NOTION_TOKEN) {
    console.log('[daily-brief] Writing to Notion Brain...');
    await appendToNotion(BRAIN_PAGE_ID, entry);
    console.log('[daily-brief] Notion write complete.');
  } else {
    console.log('[daily-brief] NOTION_TOKEN not set — skipping Notion write.');
  }

  return { date: today, ideas: rawIdeas, priority: synthesis };
}

module.exports = { runDailyBrief };
