import { authenticate } from './lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Expose-Headers', 'X-Invoice-Number, X-Invoice-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Authenticate request
  const auth = await authenticate(req);
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error });
  }

  const { action, id } = req.query;

  try {
    // Dynamic import db to catch any errors
    const db = await import('./lib/db.js');

    // GET /api/invoices - List all invoices
    if (req.method === 'GET' && !action) {
      const invoices = await db.getAllInvoices();
      return res.status(200).json(invoices);
    }

    // GET /api/invoices?action=next-number
    if (req.method === 'GET' && action === 'next-number') {
      const invoiceNumber = await db.getNextInvoiceNumber();
      return res.status(200).json({ invoiceNumber });
    }

    // GET /api/invoices?action=download&id=123&format=pdf|docx
    if (req.method === 'GET' && action === 'download' && id) {
      const invoice = await db.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const format = req.query.format || 'pdf';
      const { regenerateInvoice } = await import('./lib/invoice.js');
      const result = await regenerateInvoice(invoice, format);

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    }

    // POST /api/invoices?action=preview
    if (req.method === 'POST' && action === 'preview') {
      const { getInvoicePreview } = await import('./lib/invoice.js');
      const preview = await getInvoicePreview(req.body);
      return res.status(200).json(preview);
    }

    // POST /api/invoices?action=generate&format=pdf|docx
    if (req.method === 'POST' && action === 'generate') {
      const format = req.query.format || 'docx';
      const invoiceNumber = await db.getNextInvoiceNumber();

      let result;
      if (format === 'pdf') {
        const { generateInvoicePDF } = await import('./lib/invoice.js');
        result = await generateInvoicePDF({
          ...req.body,
          invoiceNumber
        });
        res.setHeader('Content-Type', 'application/pdf');
      } else {
        const { generateInvoice } = await import('./lib/invoice.js');
        result = await generateInvoice({
          ...req.body,
          invoiceNumber
        });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      }

      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('X-Invoice-Number', result.invoice.invoice_number);
      res.setHeader('X-Invoice-Id', result.invoice.id);

      return res.send(result.buffer);
    }

    // POST /api/invoices?action=generate-and-send (always sends PDF)
    if (req.method === 'POST' && action === 'generate-and-send') {
      const { generateInvoicePDF } = await import('./lib/invoice.js');
      const { sendInvoiceEmail } = await import('./lib/email.js');
      const invoiceNumber = await db.getNextInvoiceNumber();
      const { additionalEmails, emailSubject, emailBody, ...invoiceData } = req.body;
      const result = await generateInvoicePDF({
        ...invoiceData,
        invoiceNumber
      });

      await sendInvoiceEmail(
        result.invoice,
        result.firm,
        result.buffer,
        result.filename,
        additionalEmails || [],
        { customSubject: emailSubject, customBody: emailBody }
      );

      // Build recipient list for the message (firm email + firm CC emails + additional emails)
      const firmCcEmails = result.firm.cc_emails
        ? result.firm.cc_emails.split(',').map(e => e.trim()).filter(e => e)
        : [];
      const allRecipients = [...new Set([result.firm.email, ...firmCcEmails, ...(additionalEmails || [])])];
      return res.status(200).json({
        invoice: result.invoice,
        sent: true,
        message: `Invoice sent to ${allRecipients.join(', ')}`
      });
    }

    // POST /api/invoices?action=send&id=123
    if (req.method === 'POST' && action === 'send' && id) {
      const invoice = await db.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      return res.status(400).json({
        error: 'Invoice file not available. Please use "Generate & Send" to create and send a new invoice.'
      });
    }

    // POST /api/invoices?action=mark-paid&id=123
    if (req.method === 'POST' && action === 'mark-paid' && id) {
      const invoice = await db.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      await db.updateInvoiceStatus(id, 'paid');
      return res.status(200).json({ success: true, message: 'Invoice marked as paid' });
    }

    // POST /api/invoices?action=mark-unpaid&id=123
    if (req.method === 'POST' && action === 'mark-unpaid' && id) {
      const invoice = await db.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      // Revert to sent status (since it was sent before being marked paid)
      await db.updateInvoiceStatus(id, 'sent');
      return res.status(200).json({ success: true, message: 'Invoice marked as unpaid' });
    }

    // POST /api/invoices?action=update-draft&id=123 - Update draft invoice
    if (req.method === 'POST' && action === 'update-draft' && id) {
      const invoice = await db.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      if (invoice.status !== 'draft') {
        return res.status(400).json({ error: 'Only draft invoices can be edited' });
      }

      const { calculateAmounts } = await import('./lib/invoice.js');
      const amounts = calculateAmounts(req.body.baseAmount);

      const updated = await db.updateDraftInvoice(id, {
        plan_type: req.body.planType,
        duration: req.body.duration,
        num_users: req.body.numUsers,
        base_amount: req.body.baseAmount,
        subtotal: amounts.subtotal,
        gtfl: amounts.gtfl,
        nihl: amounts.nihl,
        vat: amounts.vat,
        total: amounts.total,
        due_date: req.body.dueDate
      });

      if (!updated) {
        return res.status(400).json({ error: 'Failed to update invoice' });
      }

      return res.status(200).json({ success: true, invoice: updated });
    }

    // DELETE /api/invoices?id=123 - Delete single invoice
    if (req.method === 'DELETE' && id) {
      const invoice = await db.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      await db.deleteInvoice(id);
      return res.status(200).json({ success: true, message: 'Invoice deleted' });
    }

    // POST /api/invoices?action=delete-bulk - Delete multiple invoices
    if (req.method === 'POST' && action === 'delete-bulk') {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'No invoice IDs provided' });
      }
      const result = await db.deleteInvoices(ids);
      return res.status(200).json({
        success: true,
        message: `${result.count} invoice(s) deleted`
      });
    }

    // POST /api/invoices?action=email-accountant - Email paid invoices CSV to accountant
    if (req.method === 'POST' && action === 'email-accountant') {
      const { sendAccountantReport } = await import('./lib/email.js');

      // Get all paid invoices
      const allInvoices = await db.getAllInvoices();
      const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');

      if (paidInvoices.length === 0) {
        return res.status(400).json({ error: 'No paid invoices to export' });
      }

      // Generate CSV content
      const headers = ['Invoice #', 'Firm', 'Plan', 'Duration', 'Users', 'Base Amount', 'GTFL', 'NIHL', 'VAT', 'Total', 'Due Date', 'Status', 'Created'];
      const rows = paidInvoices.map(inv => [
        inv.invoice_number,
        inv.firm_name,
        inv.plan_type === 'plus' ? 'Plus' : 'Standard',
        inv.duration,
        inv.num_users,
        inv.base_amount,
        inv.gtfl,
        inv.nihl,
        inv.vat,
        inv.total,
        inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '',
        inv.status,
        inv.created_at ? new Date(inv.created_at).toLocaleDateString() : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const result = await sendAccountantReport(csvContent, paidInvoices.length);
      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Invoices API error:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
