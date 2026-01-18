import createReport from 'docx-templates';
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
    const { blobs } = await list({ prefix: templatePrefix });
    if (!blobs || blobs.length === 0) {
      throw new Error(`Template not found: ${templatePrefix}`);
    }
    const blobUrl = blobs[0].url;
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${templatePrefix}`);
    }
    template = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw new Error(`Failed to load template: ${error.message}`);
  }

  // Prepare data for template
  const nameAddress = `${firm.firm_name}\n${firm.street_address}\n${firm.city}`;

  const templateData = {
    INVOICE_NUMBER: invoiceNumber,
    DUE_DATE: formatDate(dueDate),
    NAME_ADDRESS: nameAddress,
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
  const buffer = await createReport({
    template,
    data: templateData,
    cmdDelimiter: ['{{', '}}'],
    processLineBreaks: true
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
