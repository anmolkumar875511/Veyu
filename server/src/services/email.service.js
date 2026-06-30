import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

const SCOPE = 'Email';

function createTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        logger.warn(SCOPE, 'Missing SMTP config — emails will not be sent.');
        return null;
    }

    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT ?? '587', 10),
        secure: parseInt(SMTP_PORT ?? '587', 10) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
}

let _transporter = null;
function getTransporter() {
    if (!_transporter) _transporter = createTransporter();
    return _transporter;
}

export async function sendOtpEmail(toEmail, otp) {
    const transporter = getTransporter();
    const from = process.env.EMAIL_FROM ?? 'Veyu <noreply@veyu.in>';

    if (!transporter) {
        logger.warn(SCOPE, `[DEV] OTP for ${toEmail}: ${otp}`);
        return;
    }

    try {
        await transporter.sendMail({
            from,
            to: toEmail,
            subject: `${otp} is your Veyu verification code`,
            text: `Your Veyu verification code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09111f;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09111f;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#111d2e;border:1px solid #243c58;border-radius:16px;padding:40px 32px;">
        <tr><td>
          <!-- Brand -->
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
            <span style="font-size:13px;font-weight:700;color:#eef4ff;letter-spacing:0.12em;text-transform:uppercase;">Veyu</span>
          </div>

          <h1 style="font-size:22px;font-weight:800;color:#eef4ff;margin:0 0 8px 0;letter-spacing:-0.02em;">
            Verify your email
          </h1>
          <p style="font-size:14px;color:#6e93b8;margin:0 0 32px 0;line-height:1.6;">
            Enter this code in the app to complete your registration.
          </p>

          <!-- OTP box -->
          <div style="background:#09111f;border:1px solid #243c58;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
            <span style="font-size:40px;font-weight:800;color:#22d3ee;letter-spacing:0.18em;font-family:monospace;">
              ${otp}
            </span>
          </div>

          <p style="font-size:13px;color:#354e66;line-height:1.6;margin:0;">
            This code expires in <strong style="color:#6e93b8;">10 minutes</strong>.
            If you didn't create a Veyu account, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
        });

        logger.success(SCOPE, `OTP email sent to ${toEmail}`);
    } catch (err) {
        logger.error(SCOPE, `Failed to send OTP to ${toEmail}`, err);
        throw err;
    }
}
