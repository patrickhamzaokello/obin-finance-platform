/**
 * Plunk transactional email client
 * Docs: https://useplunk.com/docs
 * API:  POST https://api.useplunk.com/v1/send
 *
 * Set PLUNK_SECRET_KEY in .env
 */

const PLUNK_API = 'https://api.useplunk.com/v1/send';

interface PlunkPayload {
  to:      string;
  subject: string;
  body:    string;       // HTML allowed
  name?:   string;       // recipient display name
  from?:   string;       // sender override (must be verified domain)
  headers?: Record<string, string>;
}

async function sendEmail(payload: PlunkPayload): Promise<void> {
  const key = process.env.PLUNK_SECRET_KEY;
  if (!key) {
    console.warn('[plunk] PLUNK_SECRET_KEY not set — email skipped:', payload.subject);
    return;
  }

  const res = await fetch(PLUNK_API, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to:      payload.to,
      subject: payload.subject,
      body:    payload.body,
      name:    payload.name,
      from:    payload.from ?? process.env.PLUNK_FROM_EMAIL ?? 'hello@ObinAcademy.com',
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[plunk] send failed:', res.status, text);
    // Non-fatal — log and continue
  }
}

// ─── Email templates ─────────────────────────────────────────────────────────

export async function sendEnrollmentConfirmation(opts: {
  email:        string;
  name:         string;
  courseTitle:  string;
  schoolName:   string;
  learningUrl:  string;
  accessCode?:  string;
}) {
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `You're enrolled in "${opts.courseTitle}" 🎉`,
    body: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1917;">
  <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;">You're in! 🎉</h1>
  <p style="color:#78716C;margin:0 0 24px;">Hi ${opts.name}, you've successfully enrolled in:</p>
  <div style="background:#EEEEFF;border:1px solid #BBBBFF;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
    <p style="font-size:18px;font-weight:700;margin:0 0 4px;">${opts.courseTitle}</p>
    <p style="color:#4444CC;margin:0;font-size:14px;">by ${opts.schoolName}</p>
  </div>
  ${opts.accessCode ? `
  <div style="background:#F4F4FB;border:1px solid #D0D0E8;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
    <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#5c5c8a;margin:0 0 6px;">Your Access Code</p>
    <p style="font-family:monospace;font-size:17px;font-weight:700;color:#0B00FF;margin:0;letter-spacing:0.05em;">${opts.accessCode}</p>
    <p style="font-size:12px;color:#9898b8;margin:6px 0 0;">Keep this code for your records. Your enrollment is already active.</p>
  </div>` : ''}
  <a href="${opts.learningUrl}" style="display:inline-block;background:#0B00FF;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;">Start Learning →</a>
  <p style="color:#A8A29E;font-size:13px;margin:32px 0 0;">ObinAcademy · The Creator Class Platform</p>
</div>`,
  });
}

export async function sendWelcomeEmail(opts: {
  email:      string;
  name:       string;
  schoolName: string;
  signInUrl:  string;
}) {
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `Welcome to ${opts.schoolName} on ObinAcademy`,
    body: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1917;">
  <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;">Welcome, ${opts.name}!</h1>
  <p style="color:#78716C;margin:0 0 24px;">Your account on <strong>${opts.schoolName}</strong> is ready. Start exploring classes and learning today.</p>
  <a href="${opts.signInUrl}" style="display:inline-block;background:#0B00FF;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;">Go to your dashboard →</a>
  <p style="color:#A8A29E;font-size:13px;margin:32px 0 0;">ObinAcademy · The Creator Class Platform</p>
</div>`,
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
    subject: `Your certificate for "${opts.courseTitle}" is ready`,
    body: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1917;">
  <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;">Congratulations, ${opts.name}! 🏆</h1>
  <p style="color:#78716C;margin:0 0 24px;">You've completed <strong>${opts.courseTitle}</strong> and earned your certificate.</p>
  <a href="${opts.certUrl}" style="display:inline-block;background:#0B00FF;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;">View & download certificate →</a>
  <p style="color:#A8A29E;font-size:13px;margin:32px 0 0;">ObinAcademy · The Creator Class Platform</p>
</div>`,
  });
}

export async function sendPaymentReceiptEmail(opts: {
  email:        string;
  name:         string;
  courseTitle:  string;
  amount:       number;
  phone:        string;
  learningUrl:  string;
  accessCode?:  string;
}) {
  const ugx = new Intl.NumberFormat('en-UG').format(opts.amount);
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `Payment confirmed — ${opts.courseTitle}`,
    body: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1917;">
  <h1 style="font-size:24px;font-weight:700;margin:0 0 8px;">Payment Confirmed ✓</h1>
  <p style="color:#78716C;margin:0 0 24px;">Hi ${opts.name}, your payment was received. You're now enrolled and can start learning immediately.</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
    <tr><td style="padding:10px 0;border-bottom:1px solid #E4E1DA;color:#78716C;font-size:14px;">Class</td><td style="padding:10px 0;border-bottom:1px solid #E4E1DA;font-weight:600;text-align:right;">${opts.courseTitle}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #E4E1DA;color:#78716C;font-size:14px;">Amount paid</td><td style="padding:10px 0;border-bottom:1px solid #E4E1DA;font-weight:600;text-align:right;">UGX ${ugx}</td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #E4E1DA;color:#78716C;font-size:14px;">Paid from</td><td style="padding:10px 0;border-bottom:1px solid #E4E1DA;font-weight:600;text-align:right;">${opts.phone}</td></tr>
    ${opts.accessCode ? `<tr><td style="padding:10px 0;color:#78716C;font-size:14px;">Access code</td><td style="padding:10px 0;font-family:monospace;font-weight:700;color:#0B00FF;text-align:right;letter-spacing:0.05em;">${opts.accessCode}</td></tr>` : ''}
  </table>
  ${opts.accessCode ? `
  <div style="background:#EEEEFF;border:1px solid #BBBBFF;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
    <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#5c5c8a;margin:0 0 6px;">Your Enrollment Access Code</p>
    <p style="font-family:monospace;font-size:20px;font-weight:700;color:#0B00FF;margin:0;letter-spacing:0.08em;">${opts.accessCode}</p>
    <p style="font-size:12px;color:#9898b8;margin:8px 0 0;">Your enrollment is already active — keep this code as your payment reference.</p>
  </div>` : ''}
  <a href="${opts.learningUrl}" style="display:inline-block;background:#0B00FF;color:#fff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;">Start Learning →</a>
  <p style="color:#A8A29E;font-size:13px;margin:32px 0 0;">ObinAcademy · The Creator Class Platform</p>
</div>`,
  });
}
