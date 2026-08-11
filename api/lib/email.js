import nodemailer from 'nodemailer';
import * as db from './db.js';

// Normalize an SMTP password: trim stray whitespace, and strip the grouping
// spaces Google shows inside app passwords ("abcd efgh ijkl mnop") — Gmail
// rejects the password with a 535 error if they are sent along.
export const normalizeSmtpPass = (pass) => {
  if (!pass) return pass;
  const trimmed = String(pass).trim();
  if (/^[a-zA-Z]{4}(\s+[a-zA-Z]{4}){3}$/.test(trimmed)) {
    return trimmed.replace(/\s+/g, '');
  }
  return trimmed;
};

const buildTransporter = (config) => nodemailer.createTransport({
  host: (config.smtp_host || '').trim(),
  port: config.smtp_port || 587,
  secure: config.smtp_port === 465,
  auth: {
    user: (config.smtp_user || '').trim(),
    pass: normalizeSmtpPass(config.smtp_pass)
  }
});

const isSmtpAuthError = (error) => error.code === 'EAUTH' || error.responseCode === 535;

// Rewrap SMTP auth failures (Gmail's "535-5.7.8 Username and Password not
// accepted") into a message that tells the user how to actually fix it.
const translateSmtpError = (error, config) => {
  if (!isSmtpAuthError(error)) return error;
  const isGmail = /gmail|googlemail/i.test(config.smtp_host || '');
  const hint = isGmail
    ? 'Gmail rejected the SMTP username/password. Gmail no longer accepts your regular account password — create an App Password (Google Account → Security → 2-Step Verification → App passwords) and enter it in Settings → Email Configuration.'
    : 'The SMTP server rejected the username/password. Please re-enter your SMTP credentials in Settings → Email Configuration.';
  const wrapped = new Error(`${hint} (Server said: ${error.message})`);
  wrapped.cause = error;
  wrapped.isSmtpAuthError = true;
  return wrapped;
};

const sendMailSafe = async (transporter, config, mailOptions) => {
  try {
    const result = await transporter.sendMail(mailOptions);
    // Sending works again — clear the auth-failure flag (and alert throttle).
    if (config.smtp_auth_failed_at) {
      await db.clearSmtpAuthFailure().catch(() => {});
    }
    return result;
  } catch (error) {
    if (isSmtpAuthError(error)) {
      await db.markSmtpAuthFailure().catch(() => {});
    }
    throw translateSmtpError(error, config);
  }
};

// Send invoice email
export const sendInvoiceEmail = async (invoice, firm, documentBuffer, filename, additionalEmails = [], options = {}) => {
  const config = await db.getEmailConfig();

  if (!config || !config.smtp_host) {
    throw new Error('Email is not configured. Please configure SMTP settings first.');
  }

  const transporter = buildTransporter(config);

  const total = Number(invoice.total).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const dueDate = new Date(invoice.due_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Combine firm's stored CC emails with any additional emails from the form
  const firmCcEmails = firm.cc_emails
    ? firm.cc_emails.split(',').map(e => e.trim()).filter(e => e)
    : [];
  const allCcEmails = [...new Set([...firmCcEmails, ...additionalEmails])]; // Remove duplicates

  // Build BCC list: firm's BCC emails + default JUDY email if enabled
  const firmBccEmails = firm.bcc_emails
    ? firm.bcc_emails.split(',').map(e => e.trim()).filter(e => e)
    : [];
  const defaultBcc = firm.include_default_bcc !== false ? ['hello@judy.legal'] : [];
  const allBccEmails = [...new Set([...firmBccEmails, ...defaultBcc])]; // Remove duplicates

  // Use custom subject/body if provided, otherwise use defaults
  const { customSubject, customBody } = options;

  const defaultSubject = `Invoice ${invoice.invoice_number} from JUDY`;
  const defaultBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9C27B0;">Invoice from JUDY</h2>

        <p>Dear ${firm.firm_name},</p>

        <p>Please find attached your invoice for your JUDY ${invoice.plan_type === 'plus' ? 'Plus' : 'Standard'} Plan subscription.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Invoice Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.invoice_number}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Due Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${dueDate}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Plan:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.plan_type === 'plus' ? 'Plus' : 'Standard'} Plan</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Duration:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.duration}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Users:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.num_users || 1}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Total Amount:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #9C27B0;">GHS ${total}</td>
          </tr>
        </table>

        <p><strong>Payment Details:</strong></p>
        <ul style="line-height: 1.8;">
          <li><strong>Account Name:</strong> JUDY INNOVATIVE TECH LTD</li>
          <li><strong>Account Number:</strong> 216116279110</li>
          <li><strong>Bank:</strong> Guaranty Trust Bank</li>
          <li><strong>Bank Address:</strong> Lagos Avenue, East Legon, Accra</li>
        </ul>

        <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

        <p>Thank you for choosing JUDY!</p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

        <p style="color: #718096; font-size: 12px;">
          JUDY INNOVATIVE TECH LTD<br/>
          19 Banana Street, East Legon<br/>
          Accra, Ghana
        </p>
      </div>
    `;

  // Build custom HTML body if custom body text is provided
  let emailHtml = defaultBody;
  if (customBody && customBody.trim()) {
    // Convert plain text to HTML with proper formatting
    const formattedBody = customBody
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '<br/>')
      .join('\n');

    emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9C27B0;">Invoice from JUDY</h2>

        ${formattedBody}

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

        <p style="color: #718096; font-size: 12px;">
          JUDY INNOVATIVE TECH LTD<br/>
          19 Banana Street, East Legon<br/>
          Accra, Ghana
        </p>
      </div>
    `;
  }

  const mailOptions = {
    from: `"${config.from_name || 'JUDY'}" <${config.from_email}>`,
    to: firm.email,
    cc: allCcEmails.length > 0 ? allCcEmails.join(', ') : undefined,
    bcc: allBccEmails.length > 0 ? allBccEmails.join(', ') : undefined,
    subject: customSubject && customSubject.trim() ? customSubject.trim() : defaultSubject,
    html: emailHtml,
    attachments: [
      {
        filename,
        content: documentBuffer
      }
    ]
  };

  const result = await sendMailSafe(transporter, config, mailOptions);

  // Update invoice status
  await db.updateInvoiceStatus(invoice.id, 'sent', new Date().toISOString());

  return result;
};

// Send a payment receipt to the firm's contacts and (visibly CC'd) the accountant.
export const sendReceiptEmail = async (invoice, firm, documentBuffer, filename, options = {}) => {
  const config = await db.getEmailConfig();

  if (!config || !config.smtp_host) {
    throw new Error('Email is not configured. Please configure SMTP settings first.');
  }

  const transporter = buildTransporter(config);

  const currency = (invoice.home_country || firm.home_country) === 'nigeria' ? 'NGN' : 'GHS';
  const total = Number(invoice.total).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const receiptNo = `REC-${invoice.invoice_number}`;

  // Reuse the invoice recipient model: firm primary -> To, firm CC + any
  // per-invoice extra recipients + the accountant (visible) -> CC,
  // firm BCC + default JUDY address -> BCC.
  const firmCcEmails = firm.cc_emails
    ? firm.cc_emails.split(',').map(e => e.trim()).filter(e => e)
    : [];
  const invoiceExtraEmails = invoice.additional_emails
    ? invoice.additional_emails.split(',').map(e => e.trim()).filter(e => e)
    : [];
  const accountantCc = config.accountant_email ? [config.accountant_email.trim()] : [];
  const allCcEmails = [...new Set([...firmCcEmails, ...invoiceExtraEmails, ...accountantCc])]
    .filter(e => e && e !== firm.email);

  const firmBccEmails = firm.bcc_emails
    ? firm.bcc_emails.split(',').map(e => e.trim()).filter(e => e)
    : [];
  const defaultBcc = firm.include_default_bcc !== false ? ['hello@judy.legal'] : [];
  const allBccEmails = [...new Set([...firmBccEmails, ...defaultBcc])];

  const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9C27B0;">Payment Receipt from JUDY</h2>

        <p>Dear ${firm.firm_name},</p>

        <p>Thank you for your payment. We confirm that we have received payment in full
        for your JUDY ${invoice.plan_type === 'plus' ? 'Plus' : 'Standard'} Plan subscription.
        Your receipt is attached for your records.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Receipt Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${receiptNo}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Invoice Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.invoice_number}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Amount Paid:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #9C27B0;">${currency} ${total}</td>
          </tr>
        </table>

        <p>If you have any questions about this receipt, please don't hesitate to contact us.</p>

        <p>Thank you for choosing JUDY!</p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

        <p style="color: #718096; font-size: 12px;">
          JUDY INNOVATIVE TECH LTD<br/>
          19 Banana Street, East Legon<br/>
          Accra, Ghana
        </p>
      </div>
    `;

  const mailOptions = {
    from: `"${config.from_name || 'JUDY'}" <${config.from_email}>`,
    to: firm.email,
    cc: allCcEmails.length > 0 ? allCcEmails.join(', ') : undefined,
    bcc: allBccEmails.length > 0 ? allBccEmails.join(', ') : undefined,
    subject: `Payment Receipt ${receiptNo} from JUDY`,
    html: emailHtml,
    attachments: [
      {
        filename,
        content: documentBuffer
      }
    ]
  };

  const result = await sendMailSafe(transporter, config, mailOptions);

  // Recipient list for the success message (To + visible CC).
  const recipients = [...new Set([firm.email, ...allCcEmails])].filter(Boolean);
  return { result, recipients };
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  const config = await db.getEmailConfig();

  if (!config || !config.smtp_host) {
    return { configured: false, message: 'Email not configured' };
  }

  const transporter = buildTransporter(config);

  try {
    await transporter.verify();
    if (config.smtp_auth_failed_at) {
      await db.clearSmtpAuthFailure().catch(() => {});
    }
    return { configured: true, message: 'Email configuration verified successfully' };
  } catch (error) {
    if (isSmtpAuthError(error)) {
      await db.markSmtpAuthFailure().catch(() => {});
    }
    return { configured: false, message: `Verification failed: ${translateSmtpError(error, config).message}` };
  }
};

// Send CSV report to accountant
export const sendAccountantReport = async (csvContent, invoiceCount) => {
  const config = await db.getEmailConfig();

  if (!config || !config.smtp_host) {
    throw new Error('Email is not configured. Please configure SMTP settings first.');
  }

  if (!config.accountant_email) {
    throw new Error('Accountant email is not configured. Please add an accountant email in Settings.');
  }

  const transporter = buildTransporter(config);

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const filename = `paid_invoices_${new Date().toISOString().split('T')[0]}.csv`;

  const mailOptions = {
    from: `"${config.from_name || 'JUDY'}" <${config.from_email}>`,
    to: config.accountant_email,
    subject: `JUDY Paid Invoices Report - ${today}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9C27B0;">Paid Invoices Report</h2>

        <p>Hello,</p>

        <p>Please find attached the paid invoices report from JUDY.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Report Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${today}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Total Paid Invoices:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${invoiceCount}</td>
          </tr>
        </table>

        <p>This report contains all invoices that have been marked as paid.</p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

        <p style="color: #718096; font-size: 12px;">
          JUDY INNOVATIVE TECH LTD<br/>
          19 Banana Street, East Legon<br/>
          Accra, Ghana
        </p>
      </div>
    `,
    attachments: [
      {
        filename,
        content: csvContent,
        contentType: 'text/csv'
      }
    ]
  };

  const result = await sendMailSafe(transporter, config, mailOptions);
  return { success: true, message: `Report sent to ${config.accountant_email}`, messageId: result.messageId };
};

// Who gets told when the app can no longer sign in to Gmail to send invoices.
const AUTH_ALERT_RECIPIENTS = ['sokocha@gmail.com', 'sadiq@judy.legal'];
const APP_URL = process.env.APP_URL || 'https://invoice.judy.legal';

// When scheduled sends fail because Gmail rejected the app password, email
// the team telling them exactly how to fix it. The broken credential can't
// send its own obituary, so this prefers the backup sender (a second Gmail
// account + app password configured in Settings) and only falls back to the
// primary sender on the off-chance it still works. Throttled to once a day.
export const maybeSendAuthAlert = async () => {
  const config = await db.getEmailConfig();

  if (config.last_auth_alert_at) {
    const hoursSince = (Date.now() - new Date(config.last_auth_alert_at).getTime()) / 36e5;
    if (hoursSince < 24) {
      return { sent: false, reason: 'Alert already sent within the last 24 hours' };
    }
  }

  const hasBackup = config.backup_smtp_user && config.backup_smtp_pass;
  const transporter = buildTransporter(hasBackup
    ? {
        smtp_host: 'smtp.gmail.com',
        smtp_port: 587,
        smtp_user: config.backup_smtp_user,
        smtp_pass: config.backup_smtp_pass
      }
    : config);
  const fromAddress = hasBackup ? config.backup_smtp_user : config.from_email;

  const brokenUser = config.smtp_user || 'your sending account';
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #1a202c;">
      <div style="padding: 32px 0 8px;">
        <h1 style="font-size: 26px; font-weight: 700; margin: 0 0 8px;">Your invoices have stopped sending.</h1>
        <p style="font-size: 16px; line-height: 1.6; color: #4a5568; margin: 0;">
          Gmail is refusing to let JUDY sign in as <strong>${brokenUser}</strong>.
          This almost always means the App Password was revoked &mdash; it happens automatically
          whenever that account's Google password changes. Scheduled invoices are on hold
          until you give JUDY a new one.
        </p>
      </div>

      <div style="background: #f7fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <p style="font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #9C27B0; margin: 0 0 16px;">The fix takes two minutes</p>

        <table style="border-collapse: collapse;">
          <tr>
            <td style="vertical-align: top; padding: 0 12px 20px 0;"><div style="width: 28px; height: 28px; border-radius: 50%; background: #9C27B0; color: white; font-weight: 700; text-align: center; line-height: 28px;">1</div></td>
            <td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6;">
              <strong>Sign in to Google as ${brokenUser}</strong><br/>
              <span style="color: #4a5568;">and open</span>
              <a href="https://myaccount.google.com/apppasswords" style="color: #9C27B0;">myaccount.google.com/apppasswords</a><br/>
              <span style="color: #718096; font-size: 13px;">(If that page asks for it, turn on 2-Step Verification first at
              <a href="https://myaccount.google.com/security" style="color: #9C27B0;">myaccount.google.com/security</a>.)</span>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 0 12px 20px 0;"><div style="width: 28px; height: 28px; border-radius: 50%; background: #9C27B0; color: white; font-weight: 700; text-align: center; line-height: 28px;">2</div></td>
            <td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6;">
              <strong>Create an app password</strong><br/>
              <span style="color: #4a5568;">Name it <em>JUDY Invoices</em>. Google shows you 16 letters &mdash; copy them.</span>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 0 12px 20px 0;"><div style="width: 28px; height: 28px; border-radius: 50%; background: #9C27B0; color: white; font-weight: 700; text-align: center; line-height: 28px;">3</div></td>
            <td style="padding-bottom: 20px; font-size: 15px; line-height: 1.6;">
              <strong>Paste it into JUDY</strong><br/>
              <span style="color: #4a5568;">Open <a href="${APP_URL}" style="color: #9C27B0;">${APP_URL.replace('https://', '')}</a> &rarr; Settings &rarr; Email Configuration &rarr; SMTP Password, then click <em>Save Settings</em>. Spaces are fine &mdash; JUDY removes them for you.</span>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 0 12px 0 0;"><div style="width: 28px; height: 28px; border-radius: 50%; background: #9C27B0; color: white; font-weight: 700; text-align: center; line-height: 28px;">4</div></td>
            <td style="font-size: 15px; line-height: 1.6;">
              <strong>Click Verify Connection</strong><br/>
              <span style="color: #4a5568;">When it turns green, any scheduled invoices that failed will go out on the next daily run &mdash; nothing is lost.</span>
            </td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${APP_URL}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px;">
          Open JUDY Settings
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="color: #718096; font-size: 12px; line-height: 1.6;">
        You're receiving this because scheduled invoice emails failed with a Gmail sign-in error.
        You'll get at most one of these per day until it's fixed.<br/>
        JUDY INNOVATIVE TECH LTD &middot; 19 Banana Street, East Legon, Accra, Ghana
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"JUDY Invoice Generator" <${fromAddress}>`,
      to: AUTH_ALERT_RECIPIENTS.join(', '),
      subject: 'Action needed: JUDY invoices stopped sending — new Gmail App Password required',
      html: emailHtml
    });
    await db.markAuthAlertSent().catch(() => {});
    return { sent: true, via: hasBackup ? 'backup sender' : 'primary sender', to: AUTH_ALERT_RECIPIENTS };
  } catch (error) {
    // Without a working backup sender there is no route out — the in-app
    // banner is the fallback. Don't throw; the cron run itself succeeded.
    console.error('Could not deliver SMTP auth alert email:', error.message);
    return { sent: false, reason: `Alert delivery failed (${hasBackup ? 'backup' : 'primary'} sender): ${error.message}` };
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken, appUrl) => {
  const config = await db.getEmailConfig();

  if (!config || !config.smtp_host) {
    throw new Error('Email is not configured. Please configure SMTP settings first.');
  }

  const transporter = buildTransporter(config);

  const resetLink = `${appUrl}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"${config.from_name || 'JUDY'}" <${config.from_email}>`,
    to: email,
    subject: 'Reset Your JUDY Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #9C27B0;">Password Reset Request</h2>

        <p>Hello,</p>

        <p>We received a request to reset your password for your JUDY Invoice account.</p>

        <p>Click the button below to reset your password:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset Password
          </a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #9C27B0;">${resetLink}</p>

        <p><strong>This link will expire in 1 hour.</strong></p>

        <p>If you didn't request a password reset, you can safely ignore this email.</p>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />

        <p style="color: #718096; font-size: 12px;">
          JUDY INNOVATIVE TECH LTD<br/>
          19 Banana Street, East Legon<br/>
          Accra, Ghana
        </p>
      </div>
    `
  };

  const result = await sendMailSafe(transporter, config, mailOptions);
  return { success: true, messageId: result.messageId };
};
