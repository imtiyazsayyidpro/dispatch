/**
 * Email templates in the Dispatch theme: near-black canvas, amber accent,
 * monospace marks. Built with table layout + inline styles for client support.
 */

const BG = '#09090b'; // zinc-950
const PANEL = '#18181b'; // zinc-900
const BORDER = '#27272a'; // zinc-800
const TEXT = '#e4e4e7'; // zinc-200
const MUTED = '#a1a1aa'; // zinc-400
const FAINT = '#71717a'; // zinc-500
const AMBER = '#fbbf24'; // amber-400

const MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Brand wordmark — a dial mark (SVG isn't reliable in email, so a CSS tick). */
function header(): string {
  return `
    <tr>
      <td style="padding: 0 0 28px 0;">
        <span style="font-family: ${MONO}; font-size: 15px; font-weight: 600; color: ${TEXT}; letter-spacing: -0.01em;">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${AMBER}; vertical-align:middle; margin-right:8px;"></span>dispatch
        </span>
      </td>
    </tr>`;
}

function footer(): string {
  return `
    <tr>
      <td style="padding: 28px 0 0 0; border-top: 1px solid ${BORDER};">
        <p style="margin: 0; font-family: ${MONO}; font-size: 11px; line-height: 1.6; color: ${FAINT}; letter-spacing: 0.04em;">
          Dispatch &middot; scheduled webhooks, fired on time.<br />
          If you didn&rsquo;t request this, you can safely ignore this email.
        </p>
      </td>
    </tr>`;
}

/** Wraps body rows in the shared dark shell. */
function layout(bodyRows: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark" />
  </head>
  <body style="margin:0; padding:0; background:${BG};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BG};">
      <tr>
        <td align="center" style="padding: 40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 460px; background:${PANEL}; border:1px solid ${BORDER}; border-radius: 12px;">
            <tr>
              <td style="padding: 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${header()}
                  ${bodyRows}
                  ${footer()}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function verificationEmail(name: string, code: string): {
  subject: string;
  html: string;
  text: string;
} {
  const greeting = name?.trim() ? name.trim().split(' ')[0] : 'there';

  const body = `
    <tr>
      <td>
        <p style="margin: 0 0 6px 0; font-family: ${MONO}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: ${AMBER};">
          verify email
        </p>
        <h1 style="margin: 0 0 16px 0; font-family: ${SANS}; font-size: 22px; font-weight: 600; color: ${TEXT};">
          Confirm your email
        </h1>
        <p style="margin: 0 0 24px 0; font-family: ${SANS}; font-size: 14px; line-height: 1.6; color: ${MUTED};">
          Hi ${greeting}, enter this code to finish setting up your Dispatch account.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
          <tr>
            <td style="background:${BG}; border:1px solid ${BORDER}; border-radius:10px; padding: 18px 28px;">
              <span style="font-family: ${MONO}; font-size: 30px; font-weight: 600; letter-spacing: 0.32em; color: ${AMBER};">
                ${code}
              </span>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 24px 0; font-family: ${SANS}; font-size: 13px; line-height: 1.6; color: ${FAINT};">
          This code expires in 15 minutes. Didn&rsquo;t try to sign up? You can ignore this email.
        </p>
      </td>
    </tr>`;

  return {
    subject: `${code} is your Dispatch verification code`,
    html: layout(body),
    text: `Hi ${greeting},\n\nYour Dispatch verification code is: ${code}\n\nIt expires in 15 minutes. If you didn't request this, ignore this email.`,
  };
}

export function passwordResetEmail(name: string, link: string): {
  subject: string;
  html: string;
  text: string;
} {
  const greeting = name?.trim() ? name.trim().split(' ')[0] : 'there';

  const body = `
    <tr>
      <td>
        <p style="margin: 0 0 6px 0; font-family: ${MONO}; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: ${AMBER};">
          reset password
        </p>
        <h1 style="margin: 0 0 16px 0; font-family: ${SANS}; font-size: 22px; font-weight: 600; color: ${TEXT};">
          Reset your password
        </h1>
        <p style="margin: 0 0 24px 0; font-family: ${SANS}; font-size: 14px; line-height: 1.6; color: ${MUTED};">
          Hi ${greeting}, we got a request to reset your Dispatch password. Click below to choose a new one.
        </p>

        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
          <tr>
            <td style="border-radius:8px; background:${AMBER};">
              <a href="${link}" target="_blank" style="display:inline-block; padding: 12px 24px; font-family: ${SANS}; font-size: 14px; font-weight: 600; color: ${BG}; text-decoration: none;">
                Reset password
              </a>
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 8px 0; font-family: ${SANS}; font-size: 13px; line-height: 1.6; color: ${FAINT};">
          This link expires in 1 hour. If you didn&rsquo;t request it, ignore this email &mdash; your password won&rsquo;t change.
        </p>
        <p style="margin: 0; font-family: ${MONO}; font-size: 11px; line-height: 1.6; color: ${FAINT}; word-break: break-all;">
          ${link}
        </p>
      </td>
    </tr>`;

  return {
    subject: 'Reset your Dispatch password',
    html: layout(body),
    text: `Hi ${greeting},\n\nReset your Dispatch password with this link (expires in 1 hour):\n${link}\n\nIf you didn't request this, ignore this email.`,
  };
}
