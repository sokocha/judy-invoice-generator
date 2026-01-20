import pkg from 'docx-templates';
const { createReport } = pkg;
import { list } from '@vercel/blob';
import * as db from './db.js';

// Format number with commas and 2 decimal places
export const formatAmount = (num) => {
  return Number(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format date as "January 15, 2026"
export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Calculate invoice amounts
// GTFL, NIHL, VAT are calculated as percentages of BASE
// TOTAL = BASE + GTFL + NIHL + VAT
export const calculateAmounts = (baseAmount) => {
  const base = Number(baseAmount) || 0;
  const gtfl = base * 0.025;  // 2.5% of base
  const nihl = base * 0.025;  // 2.5% of base
  const vat = base * 0.15;    // 15% of base
  const total = base + gtfl + nihl + vat;

  return {
    subtotal: Math.round(base * 100) / 100,
    gtfl: Math.round(gtfl * 100) / 100,
    nihl: Math.round(nihl * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    total: Math.round(total * 100) / 100
  };
};

// Generate invoice document
export const generateInvoice = async (invoiceData) => {
  const {
    firmId,
    planType,
    duration,
    numUsers,
    baseAmount,
    dueDate,
    invoiceNumber,
    additionalEmails
  } = invoiceData;

  // Get firm details
  const firm = await db.getFirmById(firmId);
  if (!firm) {
    throw new Error('Law firm not found');
  }

  // Calculate amounts
  const amounts = calculateAmounts(baseAmount);

  // Determine template file prefix from Vercel Blob
  const templatePrefix = planType === 'plus'
    ? 'Plus_Template_Polished'
    : 'Standard_Template_Polished';

  // Find template in Vercel Blob by prefix
  let template;
  try {
    console.log(`Looking for template with prefix: ${templatePrefix}`);
    const listResult = await list({ prefix: templatePrefix });
    console.log(`Blob list result:`, JSON.stringify(listResult, null, 2));

    if (!listResult.blobs || listResult.blobs.length === 0) {
      throw new Error(`No blobs found with prefix: ${templatePrefix}`);
    }
    const blobUrl = listResult.blobs[0].url;
    console.log(`Fetching template from: ${blobUrl}`);
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch template from ${blobUrl}: ${response.status}`);
    }
    template = Buffer.from(await response.arrayBuffer());
    console.log(`Template loaded, size: ${template.length} bytes`);
  } catch (error) {
    throw new Error(`Template load failed: ${error.message}`);
  }

  // Prepare data for template - each line separate for proper formatting
  const nameAddress = `${firm.firm_name}\n${firm.street_address}\n${firm.city}, Ghana`;

  const templateData = {
    INVOICE_NUMBER: invoiceNumber,
    DUE_DATE: formatDate(dueDate),
    NAME_ADDRESS: nameAddress,
    FIRM_NAME: firm.firm_name,
    STREET_ADDRESS: firm.street_address,
    CITY: `${firm.city}, Ghana`,
    DURATION: duration,
    USERS: numUsers.toString(),
    BASE: formatAmount(baseAmount),
    SUBTOTAL: formatAmount(amounts.subtotal),
    GTFL: formatAmount(amounts.gtfl),
    NIHL: formatAmount(amounts.nihl),
    VAT: formatAmount(amounts.vat),
    TOTAL: formatAmount(amounts.total)
  };

  // Generate document
  const result = await createReport({
    template,
    data: templateData,
    cmdDelimiter: ['{{', '}}'],
    processLineBreaks: true
  });
  // Convert Uint8Array to Buffer for proper binary response
  const buffer = Buffer.from(result);

  // Create invoice record in database
  const invoiceRecord = await db.createInvoice({
    invoice_number: invoiceNumber,
    firm_id: parseInt(firmId),
    plan_type: planType,
    duration,
    num_users: numUsers,
    base_amount: baseAmount,
    subtotal: amounts.subtotal,
    gtfl: amounts.gtfl,
    nihl: amounts.nihl,
    vat: amounts.vat,
    total: amounts.total,
    due_date: dueDate,
    status: 'draft',
    additional_emails: additionalEmails ? additionalEmails.join(',') : null
  });

  return {
    buffer,
    invoice: invoiceRecord,
    firm,
    filename: `Invoice_${invoiceNumber}_${firm.firm_name.replace(/[^a-zA-Z0-9]/g, '_')}.docx`
  };
};

// Get preview data (without generating document)
export const getInvoicePreview = async (invoiceData) => {
  const { firmId, planType, duration, numUsers, baseAmount, dueDate } = invoiceData;

  const firm = await db.getFirmById(firmId);
  if (!firm) {
    throw new Error('Law firm not found');
  }

  const amounts = calculateAmounts(baseAmount);
  const invoiceNumber = await db.getNextInvoiceNumber();

  return {
    invoiceNumber,
    dueDate: formatDate(dueDate),
    firm,
    planType,
    duration,
    numUsers,
    baseAmount,
    ...amounts
  };
};

// Regenerate invoice document from existing invoice record (for downloads)
export const regenerateInvoice = async (invoiceRecord, format = 'pdf') => {
  // Get firm details
  const firm = await db.getFirmById(invoiceRecord.firm_id);
  if (!firm) {
    throw new Error('Law firm not found');
  }

  // Determine template file prefix from Vercel Blob
  const templatePrefix = invoiceRecord.plan_type === 'plus'
    ? 'Plus_Template_Polished'
    : 'Standard_Template_Polished';

  // Find template in Vercel Blob by prefix
  let template;
  try {
    const listResult = await list({ prefix: templatePrefix });
    if (!listResult.blobs || listResult.blobs.length === 0) {
      throw new Error(`No blobs found with prefix: ${templatePrefix}`);
    }
    const blobUrl = listResult.blobs[0].url;
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch template from ${blobUrl}: ${response.status}`);
    }
    template = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw new Error(`Template load failed: ${error.message}`);
  }

  // Prepare data for template
  const templateData = {
    INVOICE_NUMBER: invoiceRecord.invoice_number,
    DUE_DATE: formatDate(invoiceRecord.due_date),
    NAME_ADDRESS: `${firm.firm_name}\n${firm.street_address}\n${firm.city}, Ghana`,
    FIRM_NAME: firm.firm_name,
    STREET_ADDRESS: firm.street_address,
    CITY: `${firm.city}, Ghana`,
    DURATION: invoiceRecord.duration,
    USERS: invoiceRecord.num_users.toString(),
    BASE: formatAmount(invoiceRecord.base_amount),
    SUBTOTAL: formatAmount(invoiceRecord.subtotal),
    GTFL: formatAmount(invoiceRecord.gtfl),
    NIHL: formatAmount(invoiceRecord.nihl),
    VAT: formatAmount(invoiceRecord.vat),
    TOTAL: formatAmount(invoiceRecord.total)
  };

  // Generate document
  const result = await createReport({
    template,
    data: templateData,
    cmdDelimiter: ['{{', '}}'],
    processLineBreaks: true
  });
  const docxBuffer = Buffer.from(result);

  const baseFilename = `Invoice_${invoiceRecord.invoice_number}_${firm.firm_name.replace(/[^a-zA-Z0-9]/g, '_')}`;

  if (format === 'docx') {
    return {
      buffer: docxBuffer,
      filename: `${baseFilename}.docx`,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
  }

  // Convert to PDF
  const cloudmersiveApiKey = process.env.CLOUDMERSIVE_API_KEY;
  if (!cloudmersiveApiKey) {
    throw new Error('CLOUDMERSIVE_API_KEY not set');
  }

  const formData = new FormData();
  const docxBlob = new Blob([docxBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  formData.append('inputFile', docxBlob, 'invoice.docx');

  const pdfResponse = await fetch('https://api.cloudmersive.com/convert/docx/to/pdf', {
    method: 'POST',
    headers: { 'Apikey': cloudmersiveApiKey },
    body: formData
  });

  if (!pdfResponse.ok) {
    const errorText = await pdfResponse.text();
    throw new Error(`PDF conversion failed: ${pdfResponse.status} - ${errorText}`);
  }

  const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

  return {
    buffer: pdfBuffer,
    filename: `${baseFilename}.pdf`,
    contentType: 'application/pdf'
  };
};

// Generate PDF invoice using Cloudmersive (800 free calls/month, no expiration)
export const generateInvoicePDF = async (invoiceData) => {
  // First generate the DOCX
  const docxResult = await generateInvoice(invoiceData);

  // Convert DOCX to PDF using Cloudmersive API
  const cloudmersiveApiKey = process.env.CLOUDMERSIVE_API_KEY;
  if (!cloudmersiveApiKey) {
    throw new Error('CLOUDMERSIVE_API_KEY environment variable not set. Please add your Cloudmersive API key.');
  }

  try {
    // Upload DOCX and convert to PDF
    const formData = new FormData();
    const docxBlob = new Blob([docxResult.buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    formData.append('inputFile', docxBlob, 'invoice.docx');

    const response = await fetch('https://api.cloudmersive.com/convert/docx/to/pdf', {
      method: 'POST',
      headers: {
        'Apikey': cloudmersiveApiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudmersive error: ${response.status} - ${errorText}`);
    }

    // Cloudmersive returns the PDF directly as binary data
    const pdfBuffer = Buffer.from(await response.arrayBuffer());

    return {
      buffer: pdfBuffer,
      invoice: docxResult.invoice,
      firm: docxResult.firm,
      filename: docxResult.filename.replace('.docx', '.pdf')
    };
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error(`Failed to convert to PDF: ${error.message}`);
  }
};
