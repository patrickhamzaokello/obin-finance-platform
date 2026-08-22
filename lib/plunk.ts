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
  signInUrl:  string;
  schoolName?: string;
}) {
  const platform = opts.schoolName ?? 'ObinAcademy';
  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `Welcome to ${platform} 🎉`,
    body: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1917;">
  <div style="background:linear-gradient(135deg,#0B00FF 0%,#06007A 100%);border-radius:12px;padding:32px 28px;margin-bottom:28px;">
    <h1 style="font-size:26px;font-weight:800;color:#fff;margin:0 0 8px;letter-spacing:-0.02em;">Welcome to ${platform}!</h1>
    <p style="color:rgba(255,255,255,0.75);margin:0;font-size:15px;">Your account is ready. Start exploring classes from East Africa's best creators.</p>
  </div>
  <p style="color:#444;margin:0 0 20px;line-height:1.6;">Hi ${opts.name}, you've successfully created your account. Here's what you can do now:</p>
  <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:28px;">
    <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:#F8F8FF;border-radius:10px;border:1px solid #E5E5F0;">
      <span style="font-size:18px;">📚</span>
      <div><p style="font-weight:700;font-size:14px;color:#111;margin:0 0 2px;">Browse Classes</p><p style="font-size:13px;color:#666;margin:0;">Discover finance, tech, and business classes.</p></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:#F8F8FF;border-radius:10px;border:1px solid #E5E5F0;">
      <span style="font-size:18px;">🎓</span>
      <div><p style="font-weight:700;font-size:14px;color:#111;margin:0 0 2px;">Earn Certificates</p><p style="font-size:13px;color:#666;margin:0;">Complete classes and earn proof of your learning.</p></div>
    </div>
    <div style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;background:#F8F8FF;border-radius:10px;border:1px solid #E5E5F0;">
      <span style="font-size:18px;">📱</span>
      <div><p style="font-weight:700;font-size:14px;color:#111;margin:0 0 2px;">Pay with Mobile Money</p><p style="font-size:13px;color:#666;margin:0;">MTN or Airtel Money — no bank card needed.</p></div>
    </div>
  </div>
  <a href="${opts.signInUrl}" style="display:inline-block;background:#0B00FF;color:#fff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:10px;font-size:15px;">Go to your dashboard →</a>
  <hr style="border:none;border-top:1px solid #E5E5F0;margin:32px 0 20px;">
  <p style="color:#A8A29E;font-size:12px;margin:0;line-height:1.6;">You're receiving this because you created an account on ${platform}. If this wasn't you, you can ignore this email.<br>ObinAcademy · The Creator Class Platform</p>
</div>`,
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
    subject: `We received your creator application — ObinAcademy`,
    body: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1917;">
  <h1 style="font-size:24px;font-weight:800;margin:0 0 8px;letter-spacing:-0.02em;">Application received! ✅</h1>
  <p style="color:#555;margin:0 0 24px;line-height:1.6;">Hi ${opts.name}, thanks for applying to teach on ObinAcademy. We've received your application for <strong>${opts.channelName}</strong> and our team will review it shortly.</p>
  <div style="background:#F4F4FB;border:1px solid #D0D0E8;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#5c5c8a;margin:0 0 10px;">What happens next</p>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;gap:12px;align-items:flex-start;"><span style="background:#0B00FF;color:#fff;font-size:11px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">1</span><p style="font-size:14px;color:#333;margin:0;line-height:1.5;">Our team reviews your application (usually within 2 business days).</p></div>
      <div style="display:flex;gap:12px;align-items:flex-start;"><span style="background:#0B00FF;color:#fff;font-size:11px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">2</span><p style="font-size:14px;color:#333;margin:0;line-height:1.5;">If approved, you'll receive an email with your creator dashboard link.</p></div>
      <div style="display:flex;gap:12px;align-items:flex-start;"><span style="background:#0B00FF;color:#fff;font-size:11px;font-weight:700;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;">3</span><p style="font-size:14px;color:#333;margin:0;line-height:1.5;">Upload your first class and start earning.</p></div>
    </div>
  </div>
  <p style="color:#A8A29E;font-size:12px;margin:0;line-height:1.6;">Questions? Reply to this email and we'll help you out.<br>ObinAcademy · The Creator Class Platform</p>
</div>`,
  });
}

export async function sendApplicationApprovedEmail(opts: {
  email:         string;
  name:          string;
  channelName:   string;
  studioUrl:     string;
  tempPassword?: string;  // present only for newly created accounts
}) {
  const credentialsBlock = opts.tempPassword ? `
  <div style="background:#FFF8E1;border:2px solid #F59E0B;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#92400E;margin:0 0 12px;">🔑 Your login credentials</p>
    <p style="font-size:13px;color:#555;margin:0 0 10px;">Use these to sign in for the first time. Please change your password after logging in.</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:8px 12px;background:#fff;border:1px solid #F59E0B;border-radius:6px 6px 0 0;font-size:12px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.06em;">Email</td>
        <td style="padding:8px 12px;background:#fff;border:1px solid #F59E0B;border-top:none;font-size:14px;font-weight:600;color:#111;font-family:monospace;">${opts.email}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#fff;border:1px solid #F59E0B;border-top:none;border-radius:0 0 6px 6px;font-size:12px;font-weight:700;color:#92400E;text-transform:uppercase;letter-spacing:0.06em;">Temp&nbsp;password</td>
        <td style="padding:8px 12px;background:#fff;border:1px solid #F59E0B;border-top:none;font-size:15px;font-weight:700;color:#0B00FF;font-family:monospace;letter-spacing:0.08em;">${opts.tempPassword}</td>
      </tr>
    </table>
    <p style="font-size:12px;color:#92400E;margin:10px 0 0;">⚠️ This password is temporary. Change it in your profile settings after you first log in.</p>
  </div>` : `
  <div style="background:#F4F4FB;border:1px solid #D0D0E8;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
    <p style="font-size:14px;color:#444;margin:0;">You already have an ObinAcademy account with <strong>${opts.email}</strong>. Sign in with your existing password.</p>
  </div>`;

  await sendEmail({
    to:      opts.email,
    name:    opts.name,
    subject: `You're approved — start teaching on ObinAcademy 🚀`,
    body: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1917;">
  <div style="background:linear-gradient(135deg,#0B00FF 0%,#06007A 100%);border-radius:12px;padding:32px 28px;margin-bottom:28px;">
    <h1 style="font-size:26px;font-weight:800;color:#fff;margin:0 0 8px;letter-spacing:-0.02em;">You're approved! 🎉</h1>
    <p style="color:rgba(255,255,255,0.8);margin:0;font-size:15px;">Your creator community <strong style="color:#CDFB5E;">${opts.channelName}</strong> is live on ObinAcademy.</p>
  </div>
  <p style="color:#444;margin:0 0 20px;line-height:1.6;">Hi ${opts.name}, welcome to the creator family. Your community is set up and ready.</p>
  ${credentialsBlock}
  <a href="${opts.studioUrl}" style="display:inline-block;background:#0B00FF;color:#fff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:10px;font-size:15px;margin-bottom:24px;">Open your creator studio →</a>
  <div style="background:#F4F4FB;border:1px solid #D0D0E8;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
    <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#5c5c8a;margin:0 0 10px;">Getting started checklist</p>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <p style="font-size:14px;color:#333;margin:0;">☐ &nbsp;Create your first class</p>
      <p style="font-size:14px;color:#333;margin:0;">☐ &nbsp;Add modules and upload your videos</p>
      <p style="font-size:14px;color:#333;margin:0;">☐ &nbsp;Set your price (or make it free)</p>
      <p style="font-size:14px;color:#333;margin:0;">☐ &nbsp;Publish and share with your audience</p>
    </div>
  </div>
  <p style="color:#A8A29E;font-size:12px;margin:0;line-height:1.6;">Need help? Reply to this email anytime.<br>ObinAcademy · The Creator Class Platform</p>
</div>`,
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
    subject: `Update on your ObinAcademy creator application`,
    body: `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1C1917;">
  <h1 style="font-size:24px;font-weight:800;margin:0 0 8px;letter-spacing:-0.02em;">Application update</h1>
  <p style="color:#555;margin:0 0 20px;line-height:1.6;">Hi ${opts.name}, thank you for your interest in teaching on ObinAcademy. After reviewing your application, we're not able to move forward at this time.</p>
  ${opts.notes ? `<div style="background:#FFF5F5;border:1px solid #FECACA;border-radius:10px;padding:16px 20px;margin-bottom:20px;"><p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#991b1b;margin:0 0 6px;">Reviewer notes</p><p style="font-size:14px;color:#333;margin:0;line-height:1.6;">${opts.notes}</p></div>` : ''}
  <p style="color:#555;margin:0 0 24px;line-height:1.6;">You're welcome to apply again in the future. If you have questions or would like more feedback, simply reply to this email.</p>
  <p style="color:#A8A29E;font-size:12px;margin:0;line-height:1.6;">ObinAcademy · The Creator Class Platform</p>
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
