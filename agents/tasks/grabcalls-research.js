// GrabCalls Research Task
// Uses Fable 5 to research prospects, competitors, and sales angles
// Runs weekly — output saved to Notion

const { callModel } = require('../models');

async function researchProspects(businessType, location = 'Alabama') {
  console.log(`[grabcalls-research] Researching ${businessType} prospects in ${location}`);

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

  const result = await callModel('fable5', prompt, { maxTokens: 2000 });
  console.log(`[grabcalls-research] Research complete for ${businessType}`);
  return result;
}

async function writeOutreachEmail(businessName, businessType, ownerName = '') {
  console.log(`[grabcalls-research] Writing outreach for ${businessName}`);

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

  // Use Laguna M.1 for copywriting — it's free and handles this well
  const result = await callModel('lagunaMid', prompt, { maxTokens: 500 });
  return result;
}

async function analyzeCampaignIdeas() {
  console.log('[grabcalls-research] Analyzing campaign ideas with Ling-1T...');

  // Use cheap Ling-1T for bulk classification
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

module.exports = { researchProspects, writeOutreachEmail, analyzeCampaignIdeas };
