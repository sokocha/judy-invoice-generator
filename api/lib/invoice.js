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
export const calculateAmounts = (baseAmount, numUsers) => {
  const subtotal = baseAmount * numUsers;
  const gtfl = subtotal * 0.025;  // 2.5%
  const nihl = subtotal * 0.025;  // 2.5%
  const vat = subtotal * 0.15;    // 15%
  const total = subtotal + gtfl + nihl + vat;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
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
    invoiceNumber
  } = invoiceData;

  // Get firm details
  const firm = await db.getFirmById(firmId);
  if (!firm) {
    throw new Error('Law firm not found');
  }

  // Calculate amounts
  const amounts = calculateAmounts(baseAmount, numUsers);

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
    status: 'draft'
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

  const amounts = calculateAmounts(baseAmount, numUsers);
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

// Generate PDF invoice using ConvertAPI (preserves template styling)
export const generateInvoicePDF = async (invoiceData) => {
  // First generate the DOCX
  const docxResult = await generateInvoice(invoiceData);

  // Convert DOCX to PDF using ConvertAPI
  const convertApiSecret = process.env.CONVERTAPI_SECRET;
  if (!convertApiSecret) {
    throw new Error('CONVERTAPI_SECRET environment variable not set. Please add your ConvertAPI secret key.');
  }

  try {
    // Upload DOCX and convert to PDF
    const formData = new FormData();
    const docxBlob = new Blob([docxResult.buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    formData.append('File', docxBlob, 'invoice.docx');

    const response = await fetch(`https://v2.convertapi.com/convert/docx/to/pdf?Secret=${convertApiSecret}`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ConvertAPI error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.Files || result.Files.length === 0) {
      throw new Error('ConvertAPI returned no files');
    }

    // Get the PDF file data (base64 encoded)
    const pdfBase64 = result.Files[0].FileData;
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

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
