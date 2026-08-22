/**
 * Plunk transactional email client
 * Docs: https://useplunk.com/docs
 * API:  POST https://next-api.useplunk.com/v1/send
 *
 * Set PLUNK_SECRET_KEY in .env
 */

const PLUNK_API = 'https://next-api.useplunk.com/v1/send';

interface PlunkPayload {
  to:      string;
  subject: string;
  body:    string;
  name?:   string;
  from?:   string;
}

async function sendEmail(payload: PlunkPayload): Promise<void> {
  const key = process.env.PLUNK_SECRET_KEY;
  if (!key) {
    console.warn('[plunk] PLUNK_SECRET_KEY not set — email skipped:', payload.subject);
    return;
  }
  const res = await fetch(PLUNK_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to:   payload.to,
      subject: payload.subject,
      body: payload.body,
      name: payload.name,
      from: payload.from ?? process.env.PLUNK_FROM_EMAIL ?? 'hello@obinacademy.com',
    }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('[plunk] send failed:', res.status, text);
  }
}

// ─── Shared layout ────────────────────────────────────────────────────────────
// Warm ivory ground · Georgia serif · hairline rules · electric blue accents

const IVORY  = '#F7F5F0';
const INK    = '#18170F';
const MUTED  = '#796F62';
const RULE   = '#DDD8CF';
const ACCENT = '#0B00FF';
const PANEL  = '#EEEAE2';   // slightly darker ivory for inset panels

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#E8E4DC;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#E8E4DC;padding:32px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${IVORY};">

      <!-- Accent top rule -->
      <tr><td style="background:${ACCENT};height:3px;line-height:3px;font-size:1px;">&nbsp;</td></tr>

      <!-- Header / wordmark -->
      <tr><td style="padding:28px 40px 24px;">
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:${INK};">Obin Academy</p>
      </td></tr>

      <!-- Header rule -->
      <tr><td style="padding:0 40px;"><div style="border-top:1px solid ${RULE};"></div></td></tr>

      <!-- Content -->
      <tr><td style="padding:40px 40px 32px;">
        ${content}
      </td></tr>

      <!-- Footer rule -->
      <tr><td style="padding:0 40px;"><div style="border-top:1px solid ${RULE};"></div></td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 40px 36px;">
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:11px;color:${MUTED};line-height:1.8;letter-spacing:0.04em;">
          ObinAcademy &nbsp;·&nbsp; The Creator Class Platform<br>
          <span style="font-size:10px;">If this email wasn't meant for you, you can safely ignore it.</span>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Small uppercase label */
function label(text: string): string {
  return `<p style="margin:0 0 8px;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${MUTED};">${text}</p>`;
}

/** Primary CTA button */
function cta(href: string, text: string): string {
  return `<a href="${href}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-family:system-ui,sans-serif;font-size:13px;font-weight:700;letter-spacing:0.06em;padding:13px 28px;margin-top:4px;">${text}</a>`;
}

/** Hairline rule */
const HR = `<div style="border-top:1px solid ${RULE};margin:28px 0;"></div>`;

// ─── Email templates ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(opts: {
  email:       string;
  name:        string;
  signInUrl:   string;
  schoolName?: string;
}) {
  const platform = opts.schoolName ?? 'ObinAcademy';
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `Welcome to ${platform}`,
    body: layout(`
      ${label('New account')}
      <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:${INK};line-height:1.25;letter-spacing:-0.01em;">
        Welcome, ${opts.name}.
      </h1>
      <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${MUTED};line-height:1.8;">
        Your account on ${platform} is ready. Browse classes from East Africa's best creators, track your progress, and earn certificates as you learn.
      </p>
      ${cta(opts.signInUrl, 'Go to your dashboard →')}
      ${HR}
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:0 16px 0 0;vertical-align:top;width:33%;">
            <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:700;color:${INK};">Browse classes</p>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;color:${MUTED};line-height:1.6;">Finance, tech, business &amp; more.</p>
          </td>
          <td style="padding:0 16px;vertical-align:top;width:33%;border-left:1px solid ${RULE};">
            <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:700;color:${INK};">Earn certificates</p>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;color:${MUTED};line-height:1.6;">Proof of every course you complete.</p>
          </td>
          <td style="padding:0 0 0 16px;vertical-align:top;width:33%;border-left:1px solid ${RULE};">
            <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-weight:700;color:${INK};">Pay with mobile money</p>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;color:${MUTED};line-height:1.6;">MTN or Airtel — no bank card needed.</p>
          </td>
        </tr>
      </table>
    `),
  });
}

export async function sendEnrollmentConfirmation(opts: {
  email:       string;
  name:        string;
  courseTitle: string;
  schoolName:  string;
  learningUrl: string;
  accessCode?: string;
}) {
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `Enrolled — ${opts.courseTitle}`,
    body: layout(`
      ${label('Enrollment confirmed')}
      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:${INK};line-height:1.25;">
        You're enrolled.
      </h1>
      <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${MUTED};line-height:1.8;">
        Hi ${opts.name}, your place in the class below is confirmed.
      </p>
      <div style="background:${PANEL};padding:20px 24px;margin-bottom:28px;border-left:3px solid ${ACCENT};">
        <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:${INK};">${opts.courseTitle}</p>
        <p style="margin:0;font-family:system-ui,sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};">by ${opts.schoolName}</p>
      </div>
      ${opts.accessCode ? `
      <div style="background:${PANEL};padding:16px 24px;margin-bottom:28px;">
        ${label('Your access code')}
        <p style="margin:0;font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:${ACCENT};letter-spacing:0.12em;">${opts.accessCode}</p>
        <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:12px;color:${MUTED};">Keep this for your records. Your enrollment is already active.</p>
      </div>` : ''}
      ${cta(opts.learningUrl, 'Start learning →')}
    `),
  });
}

export async function sendApplicationReceivedEmail(opts: {
  email:       string;
  name:        string;
  channelName: string;
}) {
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `Application received — ObinAcademy`,
    body: layout(`
      ${label('Creator application')}
      <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:${INK};line-height:1.25;">
        Application received.
      </h1>
      <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${MUTED};line-height:1.8;">
        Hi ${opts.name}, we've received your application to launch <strong style="color:${INK};">${opts.channelName}</strong> on ObinAcademy. Our team will review it and get back to you shortly.
      </p>
      ${HR}
      ${label('What happens next')}
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:4px;">
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${RULE};vertical-align:top;">
            <p style="margin:0;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${ACCENT};width:28px;display:inline-block;">01</p>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};">Our team reviews your application — usually within 2 business days.</span>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${RULE};vertical-align:top;">
            <p style="margin:0;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${ACCENT};width:28px;display:inline-block;">02</p>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};">If approved, you'll receive your login credentials and creator dashboard link.</span>
          </td>
        </tr>
        <tr>
          <td style="padding:14px 0;vertical-align:top;">
            <p style="margin:0;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${ACCENT};width:28px;display:inline-block;">03</p>
            <span style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};">Upload your first class, set your price, and start earning.</span>
          </td>
        </tr>
      </table>
      ${HR}
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:${MUTED};line-height:1.8;">Questions? Simply reply to this email.</p>
    `),
  });
}

export async function sendApplicationApprovedEmail(opts: {
  email:         string;
  name:          string;
  channelName:   string;
  studioUrl:     string;
  tempPassword?: string;
}) {
  const credentialsBlock = opts.tempPassword ? `
    ${HR}
    ${label('Your login credentials')}
    <p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${MUTED};line-height:1.7;">
      Use these to sign in for the first time. You will be prompted to set a permanent password immediately after.
    </p>
    <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:8px;">
      <tr>
        <td style="padding:12px 16px;background:${PANEL};border:1px solid ${RULE};border-bottom:none;">
          <p style="margin:0 0 3px;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Email</p>
          <p style="margin:0;font-family:'Courier New',monospace;font-size:14px;color:${INK};">${opts.email}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 16px;background:${PANEL};border:1px solid ${RULE};">
          <p style="margin:0 0 3px;font-family:system-ui,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">Temporary password</p>
          <p style="margin:0;font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:${ACCENT};letter-spacing:0.1em;">${opts.tempPassword}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:12px;color:${MUTED};line-height:1.7;">
      This password is temporary and will expire after your first sign-in.
    </p>` : `
    ${HR}
    <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${MUTED};line-height:1.8;">
      You already have an ObinAcademy account — sign in with your existing password at <strong style="color:${INK};">${opts.email}</strong>.
    </p>`;

  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `You're approved — ${opts.channelName} is live`,
    body: layout(`
      ${label('Creator approval')}
      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:${INK};line-height:1.25;">
        ${opts.channelName} is live.
      </h1>
      <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${MUTED};line-height:1.8;">
        Hi ${opts.name}, your creator channel is set up and ready. Sign in to your studio to publish your first class.
      </p>
      ${cta(opts.studioUrl, 'Open creator studio →')}
      ${credentialsBlock}
      ${HR}
      ${label('Getting started')}
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-top:4px;">
        <tr><td style="padding:12px 0;border-bottom:1px solid ${RULE};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};">Create your first class and add modules</p>
        </td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid ${RULE};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};">Upload videos or link from YouTube</p>
        </td></tr>
        <tr><td style="padding:12px 0;border-bottom:1px solid ${RULE};">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};">Set your price — or make it free</p>
        </td></tr>
        <tr><td style="padding:12px 0;">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};">Publish and share with your audience</p>
        </td></tr>
      </table>
    `),
  });
}

export async function sendApplicationRejectedEmail(opts: {
  email:  string;
  name:   string;
  notes?: string;
}) {
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `Your ObinAcademy creator application`,
    body: layout(`
      ${label('Application update')}
      <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:${INK};line-height:1.25;">
        A decision on your application.
      </h1>
      <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${MUTED};line-height:1.8;">
        Hi ${opts.name}, thank you for your interest in teaching on ObinAcademy. After reviewing your application, we're not able to move forward at this time.
      </p>
      ${opts.notes ? `
      <div style="background:${PANEL};padding:20px 24px;margin-bottom:24px;border-left:3px solid ${RULE};">
        ${label('Reviewer note')}
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};line-height:1.7;">${opts.notes}</p>
      </div>` : ''}
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${MUTED};line-height:1.8;">
        You're welcome to apply again in the future. If you'd like more feedback, simply reply to this email.
      </p>
    `),
  });
}

export async function sendPasswordResetEmail(opts: {
  email:    string;
  name:     string;
  resetUrl: string;
}) {
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `Reset your password — ObinAcademy`,
    body: layout(`
      ${label('Password reset')}
      <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:${INK};line-height:1.25;">
        Reset your password.
      </h1>
      <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${MUTED};line-height:1.8;">
        Hi ${opts.name}, we received a request to reset the password on your ObinAcademy account. Use the link below to choose a new one.
      </p>
      ${cta(opts.resetUrl, 'Reset my password →')}
      ${HR}
      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:${MUTED};line-height:1.8;">
        This link expires in <strong style="color:${INK};">one hour</strong>. If you didn't request a reset, you can safely ignore this email — your password will not change.
      </p>
    `),
  });
}

export async function sendCertificateEmail(opts: {
  email:       string;
  name:        string;
  courseTitle: string;
  certUrl:     string;
}) {
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `Certificate — ${opts.courseTitle}`,
    body: layout(`
      ${label('Certificate of completion')}
      <h1 style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:${INK};line-height:1.25;">
        Congratulations, ${opts.name}.
      </h1>
      <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${MUTED};line-height:1.8;">
        You've completed <strong style="color:${INK};">${opts.courseTitle}</strong> and earned your certificate. It's ready to view and download.
      </p>
      ${cta(opts.certUrl, 'View certificate →')}
    `),
  });
}

export async function sendPaymentReceiptEmail(opts: {
  email:       string;
  name:        string;
  courseTitle: string;
  amount:      number;
  phone:       string;
  learningUrl: string;
  accessCode?: string;
}) {
  const ugx = new Intl.NumberFormat('en-UG').format(opts.amount);
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `Payment confirmed — ${opts.courseTitle}`,
    body: layout(`
      ${label('Payment receipt')}
      <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:${INK};line-height:1.25;">
        Payment confirmed.
      </h1>
      <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${MUTED};line-height:1.8;">
        Hi ${opts.name}, your payment was received and your enrollment is active.
      </p>
      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin-bottom:28px;">
        <tr>
          <td style="padding:13px 0;border-bottom:1px solid ${RULE};font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};width:40%;">Class</td>
          <td style="padding:13px 0;border-bottom:1px solid ${RULE};font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};text-align:right;">${opts.courseTitle}</td>
        </tr>
        <tr>
          <td style="padding:13px 0;border-bottom:1px solid ${RULE};font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">Amount paid</td>
          <td style="padding:13px 0;border-bottom:1px solid ${RULE};font-family:Georgia,'Times New Roman',serif;font-size:14px;font-weight:700;color:${INK};text-align:right;">UGX ${ugx}</td>
        </tr>
        <tr>
          <td style="padding:13px 0;${opts.accessCode ? 'border-bottom:1px solid ' + RULE + ';' : ''}font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">Paid from</td>
          <td style="padding:13px 0;${opts.accessCode ? 'border-bottom:1px solid ' + RULE + ';' : ''}font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${INK};text-align:right;">${opts.phone}</td>
        </tr>
        ${opts.accessCode ? `
        <tr>
          <td style="padding:13px 0;font-family:system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">Access code</td>
          <td style="padding:13px 0;font-family:'Courier New',monospace;font-size:14px;font-weight:700;color:${ACCENT};text-align:right;letter-spacing:0.08em;">${opts.accessCode}</td>
        </tr>` : ''}
      </table>
      ${cta(opts.learningUrl, 'Start learning →')}
    `),
  });
}
