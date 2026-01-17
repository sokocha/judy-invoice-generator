import nodemailer from 'nodemailer';
import * as db from './database.js';

let transporter = null;

// Initialize or update email transporter
export const initTransporter = () => {
  const config = db.getEmailConfig();
  
  if (!config || !config.smtp_host || !config.smtp_user) {
    console.log('Email not configured');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port || 587,
    secure: config.smtp_port === 465,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass
    }
  });

  return transporter;
};

// Send invoice email
export const sendInvoiceEmail = async (invoice, firm, documentBuffer, filename) => {
  const config = db.getEmailConfig();
  
  if (!config || !config.smtp_host) {
    throw new Error('Email is not configured. Please configure SMTP settings first.');
  }

  if (!transporter) {
    initTransporter();
  }

  if (!transporter) {
    throw new Error('Failed to initialize email transporter');
  }

  const mailOptions = {
    from: `"${config.from_name || 'JUDY Legal Research'}" <${config.from_email}>`,
    to: firm.email,
    subject: `Invoice ${invoice.invoice_number} from JUDY Legal Research`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c5282;">Invoice from JUDY Legal Research</h2>
        
        <p>Dear ${firm.firm_name},</p>
        
        <p>Please find attached your invoice for your JUDY ${invoice.plan_type === 'plus' ? 'Plus' : 'Standard'} Plan subscription.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Invoice Number:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${invoice.invoice_number}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Due Date:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">${new Date(invoice.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
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
            <td style="padding: 10px; border: 1px solid #e2e8f0;"><strong>Total Amount:</strong></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #2c5282;">GHS ${invoice.total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</td>
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
        
        <p>Thank you for choosing JUDY Legal Research!</p>
        
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
        content: documentBuffer
      }
    ]
  };

  const result = await transporter.sendMail(mailOptions);
  
  // Update invoice status
  await db.updateInvoiceStatus(invoice.id, 'sent', new Date().toISOString());
  
  return result;
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  const config = db.getEmailConfig();
  
  if (!config || !config.smtp_host) {
    return { configured: false, message: 'Email not configured' };
  }

  initTransporter();
  
  if (!transporter) {
    return { configured: false, message: 'Failed to initialize transporter' };
  }

  try {
    await transporter.verify();
    return { configured: true, message: 'Email configuration verified successfully' };
  } catch (error) {
    return { configured: false, message: `Verification failed: ${error.message}` };
  }
};
