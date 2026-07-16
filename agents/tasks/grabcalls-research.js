// GrabCalls Research Tasks
// Standard research: Sonnet (cost-efficient)
// Deep research: Fable 5 (explicit trigger only — expensive)

const { callModel } = require('../models');

// Standard prospect research — Sonnet handles this well at 5x lower cost than Fable 5
async function researchProspects(businessType, location = 'Alabama') {
  console.log(`[grabcalls-research] Researching ${businessType} in ${location} (Sonnet)`);

  const prompt = [
    {
      role: 'user',
      content: `You are a sales researcher for GrabCalls — an AI voice agent company targeting small businesses.

Research task: Find the best sales angle for selling AI voice agents to ${businessType} businesses in ${location}.

GrabCalls value prop: An AI agent answers calls 24/7, books appointments, answers FAQs, and qualifies leads —
so small business owners don't miss calls when they're busy or closed.

Provide:
1. Top 3 pain points this business type has with missed calls
2. Best one-liner pitch for cold outreach
3. 3 specific objections and how to handle them
4. Suggested outreach sequence (Day 1, Day 3, Day 7)
5. Price anchor ($X/month feels right for this segment)

Be specific, practical, and conversational — not corporate.`,
    },
  ];

  const result = await callModel('sonnet', prompt, { maxTokens: 2000 });
  console.log(`[grabcalls-research] Research complete for ${businessType}`);
  return result;
}

// Deep research — Fable 5 only when you need long-horizon strategy (run manually, not on cron)
async function deepResearch(topic) {
  console.log(`[grabcalls-research] Deep research on: ${topic} (Fable 5)`);

  const prompt = [
    {
      role: 'user',
      content: `You are a senior growth strategist for GrabCalls — an AI voice agent company targeting SMBs in Alabama.
GrabCalls has 0 paying clients. Goal: first paying client within 30 days.

Deep research topic: ${topic}

Provide a comprehensive, multi-angle analysis. Think step by step. Consider:
- Market dynamics and timing
- Competitive positioning
- Specific Alabama market nuances
- Realistic 30-day action plan with milestones
- Risk factors and how to mitigate them

Be thorough — this is a strategic brief, not a quick answer.`,
    },
  ];

  const result = await callModel('fable5', prompt, { maxTokens: 4000 });
  console.log(`[grabcalls-research] Deep research complete`);
  return result;
}

// Outreach email — Laguna M.1 (free)
async function writeOutreachEmail(businessName, businessType, ownerName = '') {
  console.log(`[grabcalls-research] Writing outreach for ${businessName} (Laguna free)`);

  const prompt = [
    {
      role: 'user',
      content: `Write a short, personal cold email for GrabCalls targeting this business:

Business: ${businessName}
Type: ${businessType}
Owner name: ${ownerName || '(unknown)'}
Location: Alabama

GrabCalls: AI voice agent that answers calls 24/7, books appointments, answers FAQs.
Price: ~$200-400/month. Demo call number: (205) 605-9842.

Write a 5-sentence max email. Sound like a real person, not a corporation.
Subject line first, then the email.
End with a soft CTA to call (205) 605-9842 to hear the AI in action.`,
    },
  ];

  const result = await callModel('lagunaMid', prompt, { maxTokens: 500 });
  return result;
}

// Campaign channel scoring — Ling-1T (free)
async function analyzeCampaignIdeas() {
  console.log('[grabcalls-research] Analyzing campaign ideas (Ling-1T free)...');

  const prompt = [
    {
      role: 'user',
      content: `GrabCalls needs its first paying client. It sells AI voice agents to small businesses in Alabama.

Rate these outreach channels from 1-10 for likelihood of getting a paying client in 30 days:
1. Cold email to local restaurants
2. Cold email to auto repair shops
3. Cold email to medical/dental offices
4. Cold calling local contractors
5. Facebook Groups for local business owners
6. LinkedIn outreach to Alabama business owners
7. Google Maps scraping → email owners
8. Referral from existing network contacts
9. Local chamber of commerce
10. Running Facebook ads

For each: score (1-10), one sentence why, and what the first action is.`,
    },
  ];

  const result = await callModel('ling1T', prompt, { maxTokens: 1500 });
  return result;
}

module.exports = { researchProspects, deepResearch, writeOutreachEmail, analyzeCampaignIdeas };
