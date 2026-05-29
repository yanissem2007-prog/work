export interface DigestPayload {
  name: string;
  level?: number;
  xpThisWeek?: number;
  streak?: number;
  matchesCount?: number;
  upcomingSteps: { title: string; due: string }[];
  topMatches: { title: string; company?: string; href: string }[];
  upcomingEvents: { title: string; when: string; href: string }[];
  loginHref: string;
}

export function renderDigestEmail(d: DigestPayload) {
  const subject = `Your WORK week · Lvl ${d.level ?? 1} · +${d.xpThisWeek ?? 0} XP`;

  const stepsHtml = d.upcomingSteps.length
    ? d.upcomingSteps.map((s) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
           <span style="color:#fafafa;font-size:14px;">${escapeHtml(s.title)}</span><br>
           <span style="color:#a0a0a8;font-size:11px;">Due ${escapeHtml(s.due)}</span>
         </td></tr>`).join('')
    : `<tr><td style="padding:8px 0;color:#a0a0a8;font-size:13px;">No steps due this week — pick a roadmap to keep moving.</td></tr>`;

  const matchesHtml = d.topMatches.length
    ? d.topMatches.map((m) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
           <a href="${escapeAttr(m.href)}" style="color:#fafafa;font-size:14px;text-decoration:none;">${escapeHtml(m.title)}</a><br>
           ${m.company ? `<span style="color:#a0a0a8;font-size:11px;">${escapeHtml(m.company)}</span>` : ''}
         </td></tr>`).join('')
    : '';

  const eventsHtml = d.upcomingEvents.length
    ? d.upcomingEvents.map((e) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
           <a href="${escapeAttr(e.href)}" style="color:#fafafa;font-size:14px;text-decoration:none;">${escapeHtml(e.title)}</a><br>
           <span style="color:#a0a0a8;font-size:11px;">${escapeHtml(e.when)}</span>
         </td></tr>`).join('')
    : '';

  const html = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fafafa;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0a0a;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td style="padding:24px 32px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right:10px;">
                <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#6b7cff,#c084fc);box-shadow:0 0 24px rgba(107,124,255,0.6);"></div>
              </td>
              <td style="font-size:18px;font-weight:600;letter-spacing:-0.01em;">WORK</td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:0 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background:linear-gradient(180deg,rgba(20,20,28,0.95),rgba(12,12,18,0.95));
                   border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
            <tr><td style="height:6px;background:linear-gradient(90deg,#6b7cff,#c084fc,#22d3ee);"></td></tr>

            <!-- Hero -->
            <tr><td style="padding:36px 36px 12px 36px;">
              <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#a0a0a8;">Your week on WORK</p>
              <h1 style="margin:0 0 8px 0;font-size:30px;line-height:1.15;letter-spacing:-0.02em;font-weight:600;">
                Hey ${escapeHtml(d.name)},<br>here's where you are.
              </h1>
            </td></tr>

            <!-- Stats strip -->
            <tr><td style="padding:8px 36px 24px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  ${statCell('Level', String(d.level ?? 1), '#6b7cff')}
                  ${statCell('XP this week', `+${d.xpThisWeek ?? 0}`, '#22d3ee')}
                  ${statCell('Streak', `${d.streak ?? 0}d`, '#fb923c')}
                </tr>
              </table>
            </td></tr>

            ${section('Coming up this week', stepsHtml)}
            ${matchesHtml ? section('Top job matches', matchesHtml) : ''}
            ${eventsHtml ? section('Events you RSVP\'d to', eventsHtml) : ''}

            <!-- CTA -->
            <tr><td align="center" style="padding:8px 36px 36px 36px;">
              <a href="${escapeAttr(d.loginHref)}"
                style="display:inline-block;padding:12px 22px;border-radius:999px;
                       background:linear-gradient(135deg,#6b7cff,#c084fc);
                       color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;
                       box-shadow:0 0 24px rgba(107,124,255,0.4);">
                Continue on WORK →
              </a>
            </td></tr>

            <tr><td style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;font-size:11px;color:#707078;line-height:1.6;">
              You're getting this weekly recap because you have an active WORK account.<br>
              Manage email preferences in your settings.
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:28px 16px 8px;font-size:11px;color:#606068;">
          © ${new Date().getFullYear()} WORK · Built in Algiers, for the world
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Your week on WORK\n\nHi ${d.name},\nLevel ${d.level ?? 1} · +${d.xpThisWeek ?? 0} XP · ${d.streak ?? 0}-day streak\n\n` +
    `Coming up:\n${d.upcomingSteps.map((s) => `· ${s.title} — due ${s.due}`).join('\n')}\n\n` +
    `Continue: ${d.loginHref}\n`;

  return { subject, html, text };
}

function statCell(label: string, value: string, color: string): string {
  return `<td style="padding:0 8px;width:33%;">
    <div style="padding:16px;border-radius:16px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.02);text-align:center;">
      <p style="margin:0;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#a0a0a8;">${label}</p>
      <p style="margin:6px 0 0 0;font-size:24px;font-weight:600;letter-spacing:-0.01em;color:${color};">${value}</p>
    </div>
  </td>`;
}

function section(title: string, body: string): string {
  return `<tr><td style="padding:0 36px 18px 36px;">
    <p style="margin:0 0 12px 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#a0a0a8;">${title}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${body}</table>
  </td></tr>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
function escapeAttr(s: string): string { return escapeHtml(s); }
