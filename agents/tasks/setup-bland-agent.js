#!/usr/bin/env node
// One-time setup: configures Bland.ai inbound agent for (205) 605-9842
// and points Twilio VoiceUrl to Bland.
//
// Run via: node agents/tasks/setup-bland-agent.js
// Or via GitHub Actions: .github/workflows/setup-bland-agent.yml (workflow_dispatch)
//
// Required env vars / GitHub Secrets:
//   BLAND_API_KEY        — from bland.ai → Settings → API Keys
//   TWILIO_ACCOUNT_SID   — from twilio.com console
//   TWILIO_AUTH_TOKEN    — from twilio.com console
//   TWILIO_PHONE_SID     — SID of (205) 605-9842 (starts with PN...)

const PHONE_NUMBER = '+12056059842';
const BLAND_BASE = 'https://us.api.bland.ai';

const AGENT_CONFIG = {
  prompt: `You are Ava, the AI receptionist for GrabCalls — a service that helps small businesses never miss a customer call.

Your job when someone calls (205) 605-9842:
1. Greet them warmly and find out if they're a business owner calling to learn about GrabCalls, or a customer trying to reach a business.
2. If they're a business owner: explain GrabCalls lets them have 24/7 AI answering without hiring staff. Offer to have Eric Glover call them back. Collect their name, business name, and best callback number.
3. If they're a customer reaching a wrong number: apologize politely and let them know this is GrabCalls' demo line.

Keep answers short. Be warm and natural, not robotic. Never say you're an AI unless directly asked — if asked, confirm you are.`,
  voice: 'maya',
  first_sentence: "Thanks for calling GrabCalls! I'm Ava. How can I help you today?",
  wait_for_greeting: false,
  record: true,
  max_duration: 10,
  language: 'en-US',
  model: 'enhanced',
};

async function configureBlandInbound() {
  const apiKey = process.env.BLAND_API_KEY;
  if (!apiKey) {
    console.error('[setup-bland] ERROR: BLAND_API_KEY not set.');
    console.error('[setup-bland] Get it from: https://app.bland.ai/settings → API Keys');
    process.exit(1);
  }

  console.log(`[setup-bland] Configuring inbound agent for ${PHONE_NUMBER}...`);

  const phoneEncoded = encodeURIComponent(PHONE_NUMBER);
  const resp = await fetch(`${BLAND_BASE}/v1/inbound/${phoneEncoded}`, {
    method: 'POST',
    headers: {
      'authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(AGENT_CONFIG),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    console.error(`[setup-bland] Bland API error ${resp.status}:`, JSON.stringify(data, null, 2));
    console.error('[setup-bland] If error is "number not found": you may need to add the number in');
    console.error('[setup-bland] the Bland dashboard first (app.bland.ai → Numbers → Import).');
    process.exit(1);
  }

  console.log('[setup-bland] ✅ Bland inbound agent configured successfully');
  const blandUrl = `${BLAND_BASE}/v1/inbound/${phoneEncoded}`;
  console.log(`[setup-bland] Bland webhook URL: ${blandUrl}`);
  return blandUrl;
}

async function updateTwilioVoiceUrl(blandUrl) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const phoneSid = process.env.TWILIO_PHONE_SID;

  if (!sid || !token || !phoneSid) {
    const missing = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_SID']
      .filter(k => !process.env[k]);
    console.log(`[setup-bland] ⚠️  Skipping Twilio update — missing: ${missing.join(', ')}`);
    console.log('[setup-bland] To finish setup, set Twilio VoiceUrl manually to:');
    console.log(`[setup-bland]   ${blandUrl}`);
    console.log('[setup-bland] Or add the missing secrets and re-run this workflow.');
    return false;
  }

  console.log('[setup-bland] Updating Twilio VoiceUrl...');

  const creds = Buffer.from(`${sid}:${token}`).toString('base64');
  const resp = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers/${phoneSid}.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${creds}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `VoiceUrl=${encodeURIComponent(blandUrl)}&VoiceMethod=POST`,
    }
  );

  if (!resp.ok) {
    const err = await resp.text();
    console.error(`[setup-bland] Twilio API error: ${err}`);
    return false;
  }

  console.log('[setup-bland] ✅ Twilio (205) 605-9842 now points to Bland.ai');
  return true;
}

async function main() {
  console.log('\n[setup-bland] ===== BLAND.AI VOICE AGENT SETUP =====');
  console.log('[setup-bland] Phone: (205) 605-9842 → Agent: Ava (GrabCalls receptionist)');

  try {
    const blandUrl = await configureBlandInbound();
    const twilioUpdated = await updateTwilioVoiceUrl(blandUrl);

    console.log('\n[setup-bland] ===== SETUP COMPLETE =====');
    console.log('[setup-bland] Add this to GitHub Secrets as BLAND_INBOUND_URL:');
    console.log(`[setup-bland]   ${blandUrl}`);

    if (twilioUpdated) {
      console.log('[setup-bland] ✅ (205) 605-9842 is LIVE on Bland.ai. Call it to test Ava.');
    } else {
      console.log('[setup-bland] ⚠️  Twilio not updated. Add Twilio secrets and re-run, or set VoiceUrl manually.');
    }
  } catch (err) {
    console.error(`[setup-bland] Fatal error: ${err.message}`);
    process.exit(1);
  }
}

main();
