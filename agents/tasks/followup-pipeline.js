// Follow-Up Pipeline — Auto follow-up on sent leads after 3 days, 7 days
// Reads pipeline-log.json, finds sent leads past threshold, generates new angle, sends
// Updates log with followUpSent, followUp2Sent tracking

const { callModel } = require('../models');
const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '../leads/pipeline-log.json');
const FOLLOWUP_1_DAYS = 3;
const FOLLOWUP_2_DAYS = 7;

function loadLog() {
  try { return JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8')); }
  catch { return []; }
}

function saveLog(entries) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, JSON.stringify(entries, null, 2));
}

function daysSince(dateStr) {
  return (Date.now() - new Date(dateStr).getTime()) / 86400000;
}

async function generateFollowUp(lead, round) {
  const angles = {
    1: `Write a 2-sentence follow-up cold email. Softer than the first. Just checking if they had a chance to call (205) 605-9842. No hard sell. Human tone.`,
    2: `Write a 2-sentence final follow-up. Brief. Offer to answer any questions. Mention the demo line (205) 605-9842 one more time. If not a fit that's okay too — make it easy to say no.`,
  };

  const prompt = `You are following up for GrabCalls (AI phone answering, $200-400/month for Alabama SMBs).

Business: ${lead.name} — ${lead.type} in ${lead.address}
Original email subject: ${lead.emailSubject}
Follow-up round: ${round}

${angles[round]}

Format:
Subject: [subject]

[body]

Sender: Eric Glover, GrabCalls`;

  const result = await callModel('lagunaMid', [{ role: 'user', content: prompt }], { maxTokens: 200 });
  const text = result.trim();
  const subjectMatch = text.match(/^Subject:\s*(.+)/i);
  const subject = subjectMatch ? subjectMatch[1].trim() : `Re: ${lead.emailSubject}`;
  const body = text.replace(/^Subject:[^\n]*\n\n?/i, '').trim();
  return { subject, body };
}

async function sendViaResend(to, subject, body) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const from = process.env.FROM_EMAIL || 'Eric Glover <onboarding@resend.dev>';
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text: body }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.log(`[followup] Resend error: ${err}`);
      return false;
    }
    return true;
  } catch (e) {
    console.log(`[followup] Send failed: ${e.message}`);
    return false;
  }
}

async function runFollowUpPipeline() {
  const log = loadLog();
  const updatedLog = log.map(e => ({ ...e }));

  const followUp1Due = updatedLog.filter(e =>
    e.sent && !e.followUpSent && e.email &&
    daysSince(e.loggedAt) >= FOLLOWUP_1_DAYS
  );

  const followUp2Due = updatedLog.filter(e =>
    e.sent && e.followUpSent && !e.followUp2Sent && e.email &&
    daysSince(e.followUpSentAt || e.loggedAt) >= FOLLOWUP_2_DAYS - FOLLOWUP_1_DAYS
  );

  console.log(`\n[followup] ===== FOLLOW-UP PIPELINE =====`);
  console.log(`[followup] Total leads in log: ${log.length}`);
  console.log(`[followup] Round 1 due (${FOLLOWUP_1_DAYS}+ days): ${followUp1Due.length}`);
  console.log(`[followup] Round 2 due (${FOLLOWUP_2_DAYS}+ days): ${followUp2Due.length}`);

  if (followUp1Due.length === 0 && followUp2Due.length === 0) {
    console.log('[followup] Nothing to follow up on today.');
    return;
  }

  for (const lead of followUp1Due) {
    console.log(`\n[followup] Round 1 → ${lead.name} (${lead.email})`);
    let subject, body;
    try {
      ({ subject, body } = await generateFollowUp(lead, 1));
    } catch (e) {
      console.log(`[followup] Generation failed for ${lead.name}: ${e.message}. Skipping — will retry next run.`);
      continue;
    }
    console.log(`Subject: ${subject}\n${body}`);
    const sent = await sendViaResend(lead.email, subject, body);
    console.log(`[followup] ${sent ? '✅ SENT' : '⚠️ logged only'}`);
    const idx = updatedLog.findIndex(e => e.name === lead.name && e.email === lead.email);
    if (idx !== -1) {
      updatedLog[idx].followUpSent = sent;
      updatedLog[idx].followUpSentAt = new Date().toISOString();
      updatedLog[idx].followUpSubject = subject;
      updatedLog[idx].followUpBody = body;
    }
  }

  for (const lead of followUp2Due) {
    console.log(`\n[followup] Round 2 → ${lead.name} (${lead.email})`);
    let subject, body;
    try {
      ({ subject, body } = await generateFollowUp(lead, 2));
    } catch (e) {
      console.log(`[followup] Generation failed for ${lead.name}: ${e.message}. Skipping — will retry next run.`);
      continue;
    }
    console.log(`Subject: ${subject}\n${body}`);
    const sent = await sendViaResend(lead.email, subject, body);
    console.log(`[followup] ${sent ? '✅ SENT' : '⚠️ logged only'}`);
    const idx = updatedLog.findIndex(e => e.name === lead.name && e.email === lead.email);
    if (idx !== -1) {
      updatedLog[idx].followUp2Sent = sent;
      updatedLog[idx].followUp2SentAt = new Date().toISOString();
      updatedLog[idx].followUp2Subject = subject;
      updatedLog[idx].followUp2Body = body;
    }
  }

  saveLog(updatedLog);
  console.log(`\n[followup] ===== DONE =====`);
  if (!process.env.RESEND_API_KEY) {
    console.log('[followup] → Add RESEND_API_KEY to GitHub Secrets to enable sending');
  }
}

module.exports = { runFollowUpPipeline };
