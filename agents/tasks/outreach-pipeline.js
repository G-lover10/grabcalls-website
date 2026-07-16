// Outreach Pipeline — Automated Lead Generation for GrabCalls
// Flow: Scrape YellowPages → Score with Ling-1T → Write email with Laguna → Send via Resend
//
// Required secrets:  OPENROUTER_API_KEY (already set)
// Optional secrets:  RESEND_API_KEY    (enables auto-send; without it, logs only)
//                    FROM_EMAIL        (defaults to eric@grabcalls.com)
//
// Without RESEND_API_KEY the pipeline still runs and logs every email to Actions output.
// Add RESEND_API_KEY → GitHub Settings → Secrets → Actions to enable auto-send.

const { callModel } = require('../models');
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '../leads/pipeline-log.json');

const CHAIN_KEYWORDS = [
  'jiffy lube', 'firestone', 'pep boys', 'midas', 'autozone', "o'reilly", 'advance auto',
  'napa auto', 'valvoline', 'take 5', 'walmart', 'costco', 'sears', 'mavis', 'monro',
  'christian brothers', 'mr. tire', 'big o tire', 'goodyear', 'discount tire', 'dealership',
  'honda', 'toyota', 'ford', 'chevrolet', 'nissan', 'hyundai', 'kia', 'bmw', 'mercedes',
];

// Business types + Alabama cities to rotate through
const TARGETS = [
  { type: 'auto repair', cities: ['Birmingham', 'Huntsville', 'Montgomery', 'Mobile', 'Tuscaloosa', 'Hoover', 'Auburn', 'Decatur', 'Dothan', 'Gadsden'] },
  { type: 'HVAC contractor', cities: ['Birmingham', 'Huntsville', 'Montgomery', 'Mobile', 'Tuscaloosa'] },
  { type: 'plumber', cities: ['Birmingham', 'Huntsville', 'Montgomery', 'Mobile'] },
  { type: 'dentist', cities: ['Birmingham', 'Huntsville', 'Montgomery', 'Mobile', 'Tuscaloosa'] },
  { type: 'roofing contractor', cities: ['Birmingham', 'Huntsville', 'Montgomery'] },
  { type: 'electrician', cities: ['Birmingham', 'Huntsville', 'Montgomery', 'Mobile'] },
];

function loadLog() {
  try {
    return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function saveLog(entries) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2));
}

function isChain(name) {
  const lower = name.toLowerCase();
  return CHAIN_KEYWORDS.some(k => lower.includes(k));
}

function extractEmails(html) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const noise = ['yellowpages', 'yelp.com', 'example.com', 'sentry', 'mapbox', 'twilio', 'wixpress', 'squarespace'];
  const matches = (html.match(emailRegex) || []).filter(e =>
    !noise.some(n => e.toLowerCase().includes(n)) &&
    !e.startsWith('2x@') &&
    e.length < 80
  );
  return [...new Set(matches)];
}

async function fetchHtml(url, timeoutMs = 12000) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.text();
}

async function scrapeYellowPages(businessType, city) {
  const query = encodeURIComponent(businessType);
  const loc = encodeURIComponent(`${city}, AL`);
  const url = `https://www.yellowpages.com/search?search_terms=${query}&geo_location_terms=${loc}`;

  console.log(`[pipeline] Scraping ${businessType} in ${city}, AL`);

  let html;
  try {
    html = await fetchHtml(url);
  } catch (e) {
    console.log(`[pipeline] Scrape failed: ${e.message}`);
    return [];
  }

  const businesses = [];

  // YellowPages embeds business data in structured divs
  // Split on result cards and extract per-card
  const cards = html.split('class="v-card"');
  for (const card of cards.slice(1)) {
    const nameMatch = card.match(/class="business-name"[^>]*>(?:<[^>]+>)*\s*([^<]{2,70})\s*(?:<[^>]+>)*<\/a/);
    const phoneMatch = card.match(/class="phones?[^"]*"[^>]*>(?:<[^>]+>)*\s*(\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4})/);
    const addressMatch = card.match(/class="street-address"[^>]*>([^<]{4,80})<\/span/);
    const cityMatch = card.match(/class="locality"[^>]*>([^<]{2,40})<\/span/);
    const websiteMatch = card.match(/class="track-visit-website"[^>]*href="([^"]{10,200})"/);

    if (!nameMatch) continue;
    const name = nameMatch[1].trim();
    if (!name || name.length < 3 || isChain(name)) continue;

    businesses.push({
      name,
      phone: phoneMatch ? phoneMatch[1].trim() : '',
      address: addressMatch ? `${addressMatch[1].trim()}, ${cityMatch ? cityMatch[1].trim() : city}, AL` : `${city}, AL`,
      website: websiteMatch ? websiteMatch[1] : '',
      city,
      type: businessType,
    });
  }

  console.log(`[pipeline] Scraped ${businesses.length} raw leads`);
  return businesses;
}

async function findEmailOnWebsite(websiteUrl) {
  if (!websiteUrl) return null;
  const pagesToTry = [
    websiteUrl,
    websiteUrl.replace(/\/?$/, '/contact'),
    websiteUrl.replace(/\/?$/, '/contact-us'),
    websiteUrl.replace(/\/?$/, '/about'),
  ];
  for (const url of pagesToTry) {
    try {
      const html = await fetchHtml(url, 8000);
      const emails = extractEmails(html);
      if (emails.length) return emails[0];
    } catch {
      // continue to next page
    }
  }
  return null;
}

async function scoreLeads(leads) {
  if (leads.length === 0) return [];
  if (leads.length <= 5) return leads.map(l => ({ ...l, score: 7, reason: 'small batch, skipped scoring' }));

  console.log(`[pipeline] Scoring ${leads.length} leads with Ling-1T...`);

  const prompt = `You are scoring Alabama small business leads for GrabCalls, an AI phone answering service ($200-400/month).
Best fit: owner-operated, misses calls when busy, not a chain, under 100 employees.

Score each 1-10. 10 = perfect fit. Return ONLY a valid JSON array, nothing else:
[{"index": 0, "score": 8, "reason": "brief reason"}]

Leads:
${leads.map((b, i) => `${i}: ${b.name} | ${b.type} | ${b.address}`).join('\n')}`;

  try {
    const result = await callModel('ling1T', [{ role: 'user', content: prompt }], { maxTokens: 2000 });
    const jsonMatch = result.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) throw new Error('No JSON found');
    const scores = JSON.parse(jsonMatch[0]);
    return leads
      .map((lead, i) => {
        const s = scores.find(x => x.index === i) || { score: 5, reason: '' };
        return { ...lead, score: s.score, reason: s.reason };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  } catch (e) {
    console.log(`[pipeline] Scoring parse error: ${e.message}. Using first 5.`);
    return leads.slice(0, 5).map(l => ({ ...l, score: 5, reason: '' }));
  }
}

async function generateEmail(lead) {
  const prompt = `Write a cold outreach email for GrabCalls targeting this Alabama small business:

Business: ${lead.name}
Type: ${lead.type}
Location: ${lead.address}

GrabCalls value: AI answers their phones 24/7, books appointments, handles FAQs.
Every missed call = missed revenue. They never miss one with GrabCalls.
Price: $200-400/month. Demo line: (205) 605-9842 — AI answers live right now.
Sender: Eric Glover, founder of GrabCalls.

Format — first line is subject line, then blank line, then email body:
Subject: [subject]

[email body]

Rules: 5 sentences max. Personal, conversational, not corporate. Lead with their specific pain.
End with ONE call to action: call (205) 605-9842 to hear the AI in action.`;

  const result = await callModel('lagunaMid', [{ role: 'user', content: prompt }], { maxTokens: 450 });
  const text = result.trim();
  const subjectMatch = text.match(/^Subject:\s*(.+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : `Quick question about ${lead.name}'s phone coverage`;
  const body = text.replace(/^Subject:[^\n]*\n\n?/i, '').trim();
  return { subject, body };
}

async function sendViaResend(to, subject, body) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const from = process.env.FROM_EMAIL || 'Eric Glover <eric@grabcalls.com>';
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text: body }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.log(`[pipeline] Resend error: ${err}`);
      return false;
    }
    return true;
  } catch (e) {
    console.log(`[pipeline] Resend failed: ${e.message}`);
    return false;
  }
}

async function runOutreachPipeline() {
  const log = loadLog();
  const contacted = new Set(log.map(e => e.name.toLowerCase().trim()));

  // Rotate targets by day so each run hits a different city/type combo
  const allCombos = TARGETS.flatMap(t => t.cities.map(c => ({ type: t.type, city: c })));
  const dayIndex = Math.floor(Date.now() / 86400000) % allCombos.length;
  const target = allCombos[dayIndex];

  console.log(`\n[pipeline] ===== OUTREACH PIPELINE =====`);
  console.log(`[pipeline] Target: ${target.type} in ${target.city}, AL`);
  console.log(`[pipeline] Total leads contacted so far: ${log.length}`);

  // 1. Scrape
  let leads = await scrapeYellowPages(target.type, target.city);
  leads = leads.filter(l => !contacted.has(l.name.toLowerCase().trim()));

  if (leads.length === 0) {
    console.log('[pipeline] No new leads today — all already contacted or scrape returned empty.');
    console.log('[pipeline] Tip: The pipeline will auto-rotate to the next city tomorrow.');
    return;
  }

  // 2. Score
  const topLeads = await scoreLeads(leads);
  console.log(`\n[pipeline] Top ${topLeads.length} leads:`);
  topLeads.forEach(l => console.log(`  ${l.score}/10 — ${l.name} | ${l.address}`));

  // 3. Find emails + generate emails + send
  const newEntries = [];
  for (const lead of topLeads) {
    console.log(`\n[pipeline] Processing: ${lead.name}`);

    // Try to find email on their website
    let email = null;
    if (lead.website) {
      console.log(`[pipeline] Looking for email on ${lead.website}`);
      email = await findEmailOnWebsite(lead.website);
    }

    // Generate cold email copy
    const { subject, body } = await generateEmail(lead);

    console.log(`\n${'─'.repeat(60)}`);
    console.log(`LEAD: ${lead.name}`);
    console.log(`Phone: ${lead.phone || '(not found)'}`);
    console.log(`Email: ${email || '(not found — log only)'}`);
    console.log(`Score: ${lead.score}/10 — ${lead.reason}`);
    console.log(`\nSubject: ${subject}`);
    console.log(`\n${body}`);
    console.log('─'.repeat(60));

    let sent = false;
    if (email) {
      sent = await sendViaResend(email, subject, body);
      console.log(`[pipeline] Email ${sent ? '✅ SENT' : '⚠️  logged only (RESEND_API_KEY not set)'} to ${email}`);
    } else {
      console.log(`[pipeline] No email found — add HUNTER_API_KEY secret for email enrichment`);
    }

    newEntries.push({
      name: lead.name,
      phone: lead.phone,
      email: email || '',
      address: lead.address,
      website: lead.website || '',
      type: lead.type,
      city: lead.city,
      score: lead.score,
      emailSubject: subject,
      emailBody: body,
      sent,
      loggedAt: new Date().toISOString(),
    });
  }

  // 4. Save log
  saveLog([...log, ...newEntries]);

  const sentCount = newEntries.filter(e => e.sent).length;
  const loggedCount = newEntries.filter(e => !e.sent).length;

  console.log(`\n[pipeline] ===== DONE =====`);
  console.log(`[pipeline] Emails sent: ${sentCount}`);
  console.log(`[pipeline] Logged (not sent): ${loggedCount}`);
  console.log(`[pipeline] Total in pipeline log: ${log.length + newEntries.length}`);
  if (!process.env.RESEND_API_KEY) {
    console.log(`[pipeline] → Add RESEND_API_KEY to GitHub Secrets to enable auto-sending`);
  }
}

module.exports = { runOutreachPipeline };
