import pkg from 'docx-templates';
const { createReport } = pkg;
import { list } from '@vercel/blob';
import PDFDocument from 'pdfkit';
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

// Generate PDF invoice
export const generateInvoicePDF = async (invoiceData) => {
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

  // Create PDF document
  const doc = new PDFDocument({ margin: 50 });
  const chunks = [];

  doc.on('data', chunk => chunks.push(chunk));

  // Colors
  const primaryColor = planType === 'plus' ? '#8B2B8B' : '#2B5B8B';
  const textColor = '#333333';

  // Header
  doc.fontSize(24).fillColor(primaryColor).font('Helvetica-Bold')
    .text('JUDY', 50, 50);
  doc.fontSize(10).fillColor(textColor).font('Helvetica')
    .text('LEGAL RESEARCH', 50, 78);

  // Invoice title
  doc.fontSize(16).fillColor(primaryColor).font('Helvetica-BoldOblique')
    .text(`INVOICE #${invoiceNumber}`, 50, 120);

  // Due date
  doc.fontSize(10).fillColor(textColor).font('Helvetica-Bold')
    .text('Due Date: ', 50, 150, { continued: true })
    .font('Helvetica')
    .text(formatDate(dueDate));

  // Bill To section
  doc.fontSize(10).font('Helvetica-Bold')
    .text('Bill To:', 50, 180);
  doc.font('Helvetica')
    .text(firm.firm_name, 50, 195)
    .text(firm.street_address, 50, 210)
    .text(`${firm.city}, Ghana`, 50, 225);

  // Table header
  const tableTop = 270;
  const col1 = 50;
  const col2 = 280;
  const col3 = 360;
  const col4 = 440;

  // Header background
  doc.rect(col1, tableTop, 500, 25).fill(primaryColor);

  doc.fontSize(10).fillColor('#FFFFFF').font('Helvetica-Bold')
    .text('DESCRIPTION', col1 + 10, tableTop + 7)
    .text('DURATION', col2 + 10, tableTop + 7)
    .text('USER(S)', col3 + 10, tableTop + 7)
    .text('AMOUNT (GHS)', col4 + 10, tableTop + 7);

  // Table row
  const rowTop = tableTop + 25;
  doc.rect(col1, rowTop, 500, 30).stroke('#CCCCCC');

  const planName = planType === 'plus' ? 'JUDY Plus Plan' : 'JUDY Standard Plan';
  doc.fillColor(textColor).font('Helvetica')
    .text(planName, col1 + 10, rowTop + 10)
    .text(duration, col2 + 10, rowTop + 10)
    .text(numUsers.toString(), col3 + 10, rowTop + 10)
    .text(formatAmount(baseAmount), col4 + 10, rowTop + 10);

  // Summary section
  const summaryTop = rowTop + 60;
  const labelX = 350;
  const valueX = 480;

  doc.font('Helvetica')
    .text('Subtotal:', labelX, summaryTop)
    .text(`GHS ${formatAmount(amounts.subtotal)}`, valueX, summaryTop, { align: 'right', width: 70 });

  doc.text('GTFL (2.5%):', labelX, summaryTop + 20)
    .text(`GHS ${formatAmount(amounts.gtfl)}`, valueX, summaryTop + 20, { align: 'right', width: 70 });

  doc.text('NIHL (2.5%):', labelX, summaryTop + 40)
    .text(`GHS ${formatAmount(amounts.nihl)}`, valueX, summaryTop + 40, { align: 'right', width: 70 });

  doc.text('VAT (15%):', labelX, summaryTop + 60)
    .text(`GHS ${formatAmount(amounts.vat)}`, valueX, summaryTop + 60, { align: 'right', width: 70 });

  // Total
  doc.rect(labelX - 10, summaryTop + 80, 160, 25).fill(primaryColor);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold')
    .text('TOTAL:', labelX, summaryTop + 87)
    .text(`GHS ${formatAmount(amounts.total)}`, valueX, summaryTop + 87, { align: 'right', width: 70 });

  // Payment details
  const paymentTop = summaryTop + 140;
  doc.fillColor(textColor).font('Helvetica-Bold')
    .text('Payment Details:', 50, paymentTop);

  doc.font('Helvetica')
    .text('Account Name: JUDY INNOVATIVE TECH LTD', 50, paymentTop + 20)
    .text('Account Number: 216116279110', 50, paymentTop + 35)
    .text('Bank: Guaranty Trust Bank', 50, paymentTop + 50)
    .text('Bank Address: Lagos Avenue, East Legon, Accra', 50, paymentTop + 65);

  // Footer
  doc.fontSize(9).fillColor('#666666')
    .text('JUDY INNOVATIVE TECH LTD', 50, 700)
    .text('19 Banana Street, East Legon, Accra, Ghana', 50, 715);

  doc.end();

  // Wait for PDF to be generated
  const buffer = await new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });

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
    filename: `Invoice_${invoiceNumber}_${firm.firm_name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
  };
};
