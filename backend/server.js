import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './database.js';
import { generateInvoice, getInvoicePreview, calculateAmounts } from './invoiceGenerator.js';
import { sendInvoiceEmail, verifyEmailConfig, initTransporter } from './emailService.js';
import { startScheduler, stopScheduler, getSchedulerStatus, processScheduledInvoices } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React app in production
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Store generated invoices temporarily for download
const generatedInvoices = new Map();

// =============== LAW FIRMS ENDPOINTS ===============

// Get all law firms
app.get('/api/firms', (req, res) => {
  try {
    const firms = db.getAllFirms();
    res.json(firms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single firm
app.get('/api/firms/:id', (req, res) => {
  try {
    const firm = db.getFirmById(req.params.id);
    if (!firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }
    res.json(firm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create firm
app.post('/api/firms', async (req, res) => {
  try {
    const firm = await db.createFirm(req.body);
    res.status(201).json(firm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update firm
app.put('/api/firms/:id', async (req, res) => {
  try {
    const firm = await db.updateFirm(req.params.id, req.body);
    if (!firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }
    res.json(firm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete firm
app.delete('/api/firms/:id', async (req, res) => {
  try {
    await db.deleteFirm(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== INVOICE ENDPOINTS ===============

// Get all invoices
app.get('/api/invoices', (req, res) => {
  try {
    const invoices = db.getAllInvoices();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get next invoice number
app.get('/api/invoices/next-number', (req, res) => {
  try {
    const number = db.getNextInvoiceNumber();
    res.json({ invoiceNumber: number });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Preview invoice (calculate amounts)
app.post('/api/invoices/preview', (req, res) => {
  try {
    const preview = getInvoicePreview(req.body);
    res.json(preview);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate invoice (download only)
app.post('/api/invoices/generate', async (req, res) => {
  try {
    const invoiceNumber = db.getNextInvoiceNumber();
    const result = await generateInvoice({
      ...req.body,
      invoiceNumber
    });
    
    // Store for later download
    generatedInvoices.set(result.invoice.id.toString(), {
      buffer: result.buffer,
      filename: result.filename,
      createdAt: Date.now()
    });
    
    res.json({
      invoice: result.invoice,
      downloadUrl: `/api/invoices/${result.invoice.id}/download`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate and send invoice
app.post('/api/invoices/generate-and-send', async (req, res) => {
  try {
    const invoiceNumber = db.getNextInvoiceNumber();
    const result = await generateInvoice({
      ...req.body,
      invoiceNumber
    });
    
    // Send email
    await sendInvoiceEmail(
      result.invoice,
      result.firm,
      result.buffer,
      result.filename
    );
    
    res.json({
      invoice: result.invoice,
      sent: true,
      message: `Invoice sent to ${result.firm.email}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download invoice
app.get('/api/invoices/:id/download', (req, res) => {
  try {
    const stored = generatedInvoices.get(req.params.id);
    
    if (!stored) {
      // Try to regenerate from database
      const invoice = db.getInvoiceById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }
      return res.status(404).json({ 
        error: 'Invoice file not available. Please regenerate the invoice.',
        invoice 
      });
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${stored.filename}"`);
    res.send(stored.buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send existing invoice
app.post('/api/invoices/:id/send', async (req, res) => {
  try {
    const stored = generatedInvoices.get(req.params.id);
    const invoice = db.getInvoiceById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    if (!stored) {
      return res.status(400).json({ 
        error: 'Invoice file not available. Please regenerate the invoice first.' 
      });
    }
    
    const firm = db.getFirmById(invoice.firm_id);
    
    await sendInvoiceEmail(
      invoice,
      firm,
      stored.buffer,
      stored.filename
    );
    
    res.json({
      sent: true,
      message: `Invoice sent to ${firm.email}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== SCHEDULED INVOICES ENDPOINTS ===============

// Get all scheduled invoices
app.get('/api/scheduled', (req, res) => {
  try {
    const scheduled = db.getAllScheduledInvoices();
    res.json(scheduled);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create scheduled invoice
app.post('/api/scheduled', async (req, res) => {
  try {
    const scheduled = await db.createScheduledInvoice(req.body);
    res.status(201).json(scheduled);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete scheduled invoice
app.delete('/api/scheduled/:id', async (req, res) => {
  try {
    await db.deleteScheduledInvoice(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process scheduled invoices manually
app.post('/api/scheduled/process', async (req, res) => {
  try {
    const results = await processScheduledInvoices();
    res.json({ processed: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== EMAIL CONFIG ENDPOINTS ===============

// Get email config (hide password)
app.get('/api/email-config', (req, res) => {
  try {
    const config = db.getEmailConfig();
    res.json({
      ...config,
      smtp_pass: config.smtp_pass ? '********' : ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update email config
app.put('/api/email-config', async (req, res) => {
  try {
    const currentConfig = db.getEmailConfig();
    const newConfig = {
      ...req.body,
      // Keep existing password if not provided or if placeholder
      smtp_pass: (req.body.smtp_pass && req.body.smtp_pass !== '********') 
        ? req.body.smtp_pass 
        : currentConfig.smtp_pass
    };
    
    await db.updateEmailConfig(newConfig);
    initTransporter();
    
    res.json({ success: true, message: 'Email configuration updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify email config
app.get('/api/email-config/verify', async (req, res) => {
  try {
    const result = await verifyEmailConfig();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== SCHEDULER ENDPOINTS ===============

// Get scheduler status
app.get('/api/scheduler/status', (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start scheduler
app.post('/api/scheduler/start', (req, res) => {
  try {
    const result = startScheduler();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stop scheduler
app.post('/api/scheduler/stop', (req, res) => {
  try {
    const result = stopScheduler();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =============== STATS ENDPOINT ===============

app.get('/api/stats', (req, res) => {
  try {
    const firms = db.getAllFirms();
    const invoices = db.getAllInvoices();
    const scheduled = db.getAllScheduledInvoices();
    
    res.json({
      totalFirms: firms.length,
      totalInvoices: invoices.length,
      pendingScheduled: scheduled.filter(s => s.status === 'pending').length,
      sentInvoices: invoices.filter(i => i.status === 'sent').length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app for all other routes in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Clean up old generated invoices (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [id, data] of generatedInvoices.entries()) {
    if (data.createdAt < oneHourAgo) {
      generatedInvoices.delete(id);
    }
  }
}, 15 * 60 * 1000); // Run every 15 minutes

// Start server
app.listen(PORT, () => {
  console.log(`JUDY Invoice Generator API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize email transporter
  initTransporter();
});

export default app;
