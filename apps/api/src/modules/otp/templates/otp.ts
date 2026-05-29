interface OtpInput { to: string; name?: string; code: string; minutes: number }

export function renderOtpEmail({ name, code, minutes }: OtpInput) {
  const subject = `${code} is your WORK verification code`;
  const greeting = name ? `Hi ${name},` : 'Hi,';

  // Layout uses tables for client compatibility, with modern fallbacks.
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fafafa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="padding:24px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right:10px;">
                <div style="width:28px;height:28px;border-radius:8px;
                            background:linear-gradient(135deg,#6b7cff,#c084fc);
                            box-shadow:0 0 24px rgba(107,124,255,0.6);"></div>
              </td>
              <td style="font-size:18px;font-weight:600;letter-spacing:-0.01em;color:#fafafa;">WORK</td>
            </tr>
          </table>
        </td></tr>

        <!-- Main card -->
        <tr><td style="padding:0 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:linear-gradient(180deg,rgba(20,20,28,0.95),rgba(12,12,18,0.95));
                   border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
            <!-- Aurora hero -->
            <tr><td style="height:6px;background:linear-gradient(90deg,#6b7cff,#c084fc,#22d3ee);"></td></tr>
            <tr><td style="padding:40px 40px 8px 40px;">
              <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#a0a0a8;">
                Verify your sign-in
              </p>
              <h1 style="margin:0;font-size:32px;line-height:1.1;letter-spacing:-0.02em;color:#fafafa;font-weight:600;">
                Your code is ready.
              </h1>
            </td></tr>

            <!-- OTP -->
            <tr><td align="center" style="padding:32px 40px 8px 40px;">
              <div style="display:inline-block;padding:24px 32px;border-radius:20px;
                          background:rgba(107,124,255,0.08);
                          border:1px solid rgba(107,124,255,0.35);
                          box-shadow:0 0 60px rgba(107,124,255,0.25),inset 0 0 40px rgba(107,124,255,0.06);">
                <div style="font-family:'JetBrains Mono','Menlo','Consolas',monospace;
                            font-size:46px;line-height:1;letter-spacing:0.42em;
                            color:#ffffff;font-weight:600;
                            text-shadow:0 0 18px rgba(150,160,255,0.55);">
                  ${code.split('').join('&#8202;')}
                </div>
              </div>
              <p style="margin:14px 0 0 0;font-size:13px;color:#a0a0a8;">
                Expires in <strong style="color:#fafafa;">${minutes} minutes</strong>.
              </p>
            </td></tr>

            <!-- Copy -->
            <tr><td style="padding:24px 40px 32px 40px;">
              <p style="margin:0;font-size:15px;line-height:1.6;color:#d0d0d8;">
                ${greeting}<br><br>
                Enter the code above on the verification screen to securely sign in to WORK.
              </p>

              <div style="margin-top:24px;padding:14px 16px;border-radius:14px;
                          background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
                <p style="margin:0;font-size:13px;color:#a0a0a8;line-height:1.5;">
                  <span style="color:#fafafa;font-weight:500;">Didn't request this?</span>
                  Ignore this email — your account is safe. Never share this code.
                </p>
              </div>
            </td></tr>

            <!-- Footer -->
            <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:#707078;line-height:1.6;">
                WORK Authentication · Sent securely<br>
                If you believe someone else is using your email, contact our team immediately.
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Branding -->
        <tr><td align="center" style="padding:28px 16px 8px;font-size:11px;color:#606068;">
          © ${new Date().getFullYear()} WORK · Built in Algiers, for the world
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${greeting}\n\nYour WORK verification code: ${code}\nExpires in ${minutes} minutes.\n\nIf you didn't request this, ignore this email.\n\n— WORK Authentication`;

  return { subject, html, text };
}
