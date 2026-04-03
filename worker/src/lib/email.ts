/**
 * Email Service — Resend REST API
 *
 * Simple fetch-based wrapper (no SDK needed in Workers).
 * HTML email templates for all transactional emails.
 */

// ─── Resend API ──────────────────────────────────────────────────────────────

export async function sendEmail(
  apiKey: string,
  from: string,
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `CSF Compass <${from}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend API error ${response.status}: ${body}`);
  }
}

// ─── Shared layout ───────────────────────────────────────────────────────────

function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
<tr><td style="background:#6366f1;padding:24px 32px;">
  <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">CSF Compass</h1>
</td></tr>
<tr><td style="padding:32px;">
  ${content}
</td></tr>
<tr><td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
  <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
    CSF Compass — NIST CSF 2.0 Vendor Security Assessment Platform
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function button(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background:#6366f1;border-radius:6px;padding:12px 24px;">
  <a href="${href}" style="color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">${text}</a>
</td></tr>
</table>`;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export function welcomeEmail(userName: string, orgName: string): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px;color:#111827;font-size:18px;">Welcome to CSF Compass!</h2>
    <p style="color:#374151;line-height:1.6;">Hi ${userName},</p>
    <p style="color:#374151;line-height:1.6;">
      Your organization <strong>${orgName}</strong> has been created. You can now start assessing your vendors against NIST CSF 2.0 controls.
    </p>
    <p style="color:#374151;line-height:1.6;">Here's what you can do next:</p>
    <ul style="color:#374151;line-height:1.8;">
      <li>Add your vendors</li>
      <li>Create your first assessment</li>
      <li>Invite vendors for self-assessment</li>
      <li>Invite team members to collaborate</li>
    </ul>
  `);
}

export function vendorInviteEmail(
  vendorName: string,
  orgName: string,
  magicLink: string,
  expiresInDays: number,
): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px;color:#111827;font-size:18px;">Security Assessment Request</h2>
    <p style="color:#374151;line-height:1.6;">
      <strong>${orgName}</strong> has requested that <strong>${vendorName}</strong> complete a security self-assessment based on the NIST Cybersecurity Framework (CSF) 2.0.
    </p>
    <p style="color:#374151;line-height:1.6;">
      Please click the button below to access your assessment portal. This link will expire in <strong>${expiresInDays} days</strong>.
    </p>
    ${button('Start Assessment', magicLink)}
    <p style="color:#6b7280;font-size:13px;line-height:1.5;">
      If you cannot click the button, copy and paste this URL into your browser:<br>
      <a href="${magicLink}" style="color:#6366f1;word-break:break-all;">${magicLink}</a>
    </p>
    <p style="color:#6b7280;font-size:13px;">
      If you did not expect this request, you can safely ignore this email.
    </p>
  `);
}

export function teamInviteEmail(
  inviteeEmail: string,
  inviterName: string,
  orgName: string,
  inviteLink: string,
): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px;color:#111827;font-size:18px;">You're Invited!</h2>
    <p style="color:#374151;line-height:1.6;">
      <strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on CSF Compass.
    </p>
    <p style="color:#374151;line-height:1.6;">
      Click the button below to create your account and start collaborating on vendor security assessments.
    </p>
    ${button('Accept Invitation', inviteLink)}
    <p style="color:#6b7280;font-size:13px;line-height:1.5;">
      This invitation was sent to <strong>${inviteeEmail}</strong>. It will expire in 7 days.
    </p>
  `);
}

export function passwordResetEmail(resetLink: string): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px;color:#111827;font-size:18px;">Password Reset</h2>
    <p style="color:#374151;line-height:1.6;">
      You requested a password reset for your CSF Compass account. Click the button below to set a new password.
    </p>
    ${button('Reset Password', resetLink)}
    <p style="color:#6b7280;font-size:13px;line-height:1.5;">
      This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
    </p>
  `);
}
