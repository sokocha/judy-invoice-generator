export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Expose-Headers', 'X-Invoice-Number, X-Invoice-Id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
      const { additionalEmails, ...invoiceData } = req.body;
      const result = await generateInvoicePDF({
        ...invoiceData,
        invoiceNumber
      });

      await sendInvoiceEmail(
        result.invoice,
        result.firm,
        result.buffer,
        result.filename,
        additionalEmails || []
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

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Invoices API error:', error);
    return res.status(500).json({ error: error.message, stack: error.stack });
  }
}
