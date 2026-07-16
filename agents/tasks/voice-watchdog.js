// Voice Agent Watchdog — Checks if n8n webhook is alive
// If down + Twilio/Bland secrets set → auto-switches Twilio to Bland.ai
// Runs every 2 hours via GitHub Actions
//
// Required secrets to enable auto-switch:
//   TWILIO_ACCOUNT_SID   — from twilio.com console
//   TWILIO_AUTH_TOKEN    — from twilio.com console
//   TWILIO_PHONE_SID     — SID of (205) 605-9842 (starts with PN...)
//   BLAND_INBOUND_URL    — from bland.ai → your inbound agent → webhook URL
//
// Optional:
//   N8N_WEBHOOK_URL      — defaults to http://178.156.227.13:5678

async function checkN8nHealth() {
  const base = process.env.N8N_WEBHOOK_URL || 'http://178.156.227.13:5678';
  try {
    const resp = await fetch(base, { signal: AbortSignal.timeout(6000) });
    return resp.status < 500;
  } catch {
    return false;
  }
}

async function switchToBland() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const phoneSid = process.env.TWILIO_PHONE_SID;
  const blandUrl = process.env.BLAND_INBOUND_URL;

  if (!sid || !token || !phoneSid || !blandUrl) {
    const missing = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_SID', 'BLAND_INBOUND_URL']
      .filter(k => !process.env[k]);
    console.log(`[watchdog] Cannot auto-switch — missing secrets: ${missing.join(', ')}`);
    return false;
  }

  try {
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
      console.log(`[watchdog] Twilio API error: ${err}`);
      return false;
    }
    return true;
  } catch (e) {
    console.log(`[watchdog] Twilio switch failed: ${e.message}`);
    return false;
  }
}

async function runVoiceWatchdog() {
  console.log('\n[watchdog] ===== VOICE AGENT WATCHDOG =====');
  console.log(`[watchdog] Checking n8n at ${process.env.N8N_WEBHOOK_URL || 'http://178.156.227.13:5678'}...`);

  const healthy = await checkN8nHealth();

  if (healthy) {
    console.log('[watchdog] ✅ Voice agent healthy — n8n is responding');
    return;
  }

  console.log('[watchdog] ❌ n8n webhook is DOWN');
  console.log('[watchdog] Attempting auto-switch to Bland.ai...');

  const switched = await switchToBland();

  if (switched) {
    console.log('[watchdog] ✅ Auto-switched Twilio (205) 605-9842 → Bland.ai. Voice agent restored.');
    console.log('[watchdog] Note: Fix n8n on Hetzner when able, then re-point Twilio back.');
  } else {
    console.log('[watchdog] ⚠️ Voice agent is DOWN and could not auto-switch.');
    console.log('[watchdog] Add these GitHub Secrets to enable auto-recovery:');
    console.log('[watchdog]   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_SID, BLAND_INBOUND_URL');
    console.log('[watchdog] Manual fix: hetzner.com → Console → docker restart <n8n-container>');
    process.exit(1);
  }
}

module.exports = { runVoiceWatchdog };
