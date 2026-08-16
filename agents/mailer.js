// Shared email sender — tries Gmail SMTP first, falls back to Resend
// Gmail path: set GMAIL_APP_PASSWORD in GitHub Secrets (create at myaccount.google.com/apppasswords)
// Resend path: set RESEND_API_KEY in GitHub Secrets (from resend.com dashboard)
// If neither is set, logs the email to Actions output only.

const nodemailer = require('nodemailer');

async function sendViaGmail(to, subject, body) {
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) return false;
  const user = process.env.GMAIL_SENDER || 'grabcalls@gmail.com';
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: `Eric Glover <${user}>`,
      to,
      subject,
      text: body,
    });
    return true;
  } catch (e) {
    console.log(`[mailer] Gmail SMTP failed: ${e.message}`);
    return false;
  }
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
      console.log(`[mailer] Resend error: ${err}`);
      return false;
    }
    return true;
  } catch (e) {
    console.log(`[mailer] Resend failed: ${e.message}`);
    return false;
  }
}

// sendEmail tries Gmail first, then Resend, returns { sent, method }
async function sendEmail(to, subject, body) {
  if (process.env.GMAIL_APP_PASSWORD) {
    const sent = await sendViaGmail(to, subject, body);
    if (sent) return { sent: true, method: 'gmail' };
  }
  if (process.env.RESEND_API_KEY) {
    const sent = await sendViaResend(to, subject, body);
    if (sent) return { sent: true, method: 'resend' };
  }
  return { sent: false, method: null };
}

module.exports = { sendEmail };
