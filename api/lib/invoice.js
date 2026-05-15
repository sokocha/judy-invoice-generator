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

const COUNTRY_LABELS = {
  ghana: 'Ghana',
  nigeria: 'Nigeria'
};

const round2 = (n) => Math.round(Number(n) * 100) / 100;

// Parse the leading integer from a duration string like "12 months" or "1 month".
export const parseDurationMonths = (duration) => {
  const n = parseInt(duration, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
};

// Calculate invoice amounts. baseAmount is the per-user-per-month price;
// subtotal = baseAmount * numUsers * months.
// Ghana applies GTFL+NIHL+VAT15; Nigeria applies VAT7.5 only.
export const calculateAmounts = (baseAmount, numUsers = 1, duration = '1 month', country = 'ghana') => {
  const perUser = Number(baseAmount) || 0;
  const users = Math.max(1, parseInt(numUsers) || 1);
  const months = parseDurationMonths(duration);
  const base = perUser * users * months;
  if (country === 'nigeria') {
    const vat = base * 0.075;
    return {
      subtotal: round2(base),
      gtfl: 0,
      nihl: 0,
      vat: round2(vat),
      total: round2(base + vat)
    };
  }
  const gtfl = base * 0.025;
  const nihl = base * 0.025;
  const vat = base * 0.15;
  return {
    subtotal: round2(base),
    gtfl: round2(gtfl),
    nihl: round2(nihl),
    vat: round2(vat),
    total: round2(base + gtfl + nihl + vat)
  };
};

// Canonical addon ordering: African countries first, then others.
const ADDON_ORDER = [
  'The Federal Republic of Nigeria',
  'The Republic of Ghana',
  'The Republic of Kenya',
  'USA (Select cases and legislation)',
  'UK (Select cases and legislation)',
];

const parseAddons = (raw) => {
  let list;
  if (!raw) list = [];
  else if (Array.isArray(raw)) list = raw.filter(Boolean);
  else list = String(raw).split(',').map(s => s.trim()).filter(Boolean);
  return list.slice().sort((a, b) => {
    const ai = ADDON_ORDER.indexOf(a);
    const bi = ADDON_ORDER.indexOf(b);
    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi);
  });
};

const templateFilenameFor = (country, planType) => {
  const base = planType === 'plus' ? 'Plus_Template_Polished' : 'Standard_Template_Polished';
  const suffix = country === 'nigeria' ? '_Nigeria' : '';
  return `${base}${suffix}.docx`;
};

const loadTemplateBuffer = async (filename) => {
  console.log(`Looking for template: ${filename}`);
  const listResult = await list({ prefix: filename });
  // list() does prefix matching; filter down to exact pathname so e.g.
  // "Standard_Template_Polished.docx" doesn't pick up the Nigeria file.
  const exact = (listResult.blobs || []).filter(b => b.pathname === filename);
  if (exact.length === 0) {
    throw new Error(`No blob found for template: ${filename}`);
  }
  // Prefer the most recently uploaded in case stale duplicates exist.
  const blob = exact
    .slice()
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
  const response = await fetch(blob.url);
  if (!response.ok) {
    throw new Error(`Failed to fetch template from ${blob.url}: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
};

// Build per-user unit cost details. Returns null if not applicable.
// baseAmount is already the per-user price.
const buildUnitCost = async (country, planType, baseAmount, numUsers, includeUnitCost) => {
  if (!includeUnitCost || !numUsers || numUsers < 1) return null;
  const ref = await db.getReferencePrice(country, planType);
  const refPrice = ref ? Number(ref.price_per_user_per_month) : null;
  const currency = ref ? ref.currency : (country === 'nigeria' ? 'NGN' : 'GHS');
  const unit = round2(Number(baseAmount) || 0);
  let line;
  let discountPct = null;
  if (refPrice && refPrice > 0) {
    discountPct = round2(((refPrice - unit) / refPrice) * 100);
    line = `${currency} ${formatAmount(unit)}/user (${discountPct}% off ${currency} ${formatAmount(refPrice)})`;
  } else {
    line = `${currency} ${formatAmount(unit)}/user`;
  }
  return { line, unit, discountPct, referencePrice: refPrice };
};

const buildTemplateData = ({ firm, country, planType, duration, numUsers, amounts, invoiceNumber, dueDate, addons, unitCostLine }) => {
  const countryLabel = COUNTRY_LABELS[country] || COUNTRY_LABELS.ghana;
  const cityWithCountry = `${firm.city}, ${countryLabel}`;
  return {
    INVOICE_NUMBER: invoiceNumber,
    DUE_DATE: formatDate(dueDate),
    NAME_ADDRESS: `${firm.firm_name}\n${firm.street_address}\n${cityWithCountry}`,
    FIRM_NAME: firm.firm_name,
    STREET_ADDRESS: firm.street_address,
    CITY: cityWithCountry,
    DURATION: duration,
    USERS: String(numUsers),
    BASE: formatAmount(amounts.subtotal),
    SUBTOTAL: formatAmount(amounts.subtotal),
    GTFL: formatAmount(amounts.gtfl),
    NIHL: formatAmount(amounts.nihl),
    VAT: formatAmount(amounts.vat),
    TOTAL: formatAmount(amounts.total),
    ADDONS: addons,
    UNIT_COST_LINE: unitCostLine || ''
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
    additionalEmails,
    homeCountry,
    addonCountries,
    includeUnitCost
  } = invoiceData;

  const firm = await db.getFirmById(firmId);
  if (!firm) throw new Error('Law firm not found');

  const country = (homeCountry || firm.home_country || 'ghana').toLowerCase();
  const addons = parseAddons(addonCountries ?? firm.addon_countries);
  const amounts = calculateAmounts(baseAmount, numUsers, duration, country);
  const unitCost = await buildUnitCost(country, planType, baseAmount, numUsers, includeUnitCost);

  const template = await loadTemplateBuffer(templateFilenameFor(country, planType));

  const templateData = buildTemplateData({
    firm, country, planType, duration, numUsers, amounts,
    invoiceNumber, dueDate, addons, unitCostLine: unitCost ? unitCost.line : ''
  });

  const result = await createReport({
    template,
    data: templateData,
    cmdDelimiter: ['{{', '}}'],
    processLineBreaks: true
  });
  const buffer = Buffer.from(result);

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
    additional_emails: Array.isArray(additionalEmails) && additionalEmails.length > 0 ? additionalEmails.join(',') : null,
    home_country: country,
    addon_countries: addons.length > 0 ? addons.join(',') : null,
    include_unit_cost: includeUnitCost === true,
    unit_cost: unitCost ? unitCost.unit : null,
    discount_pct: unitCost ? unitCost.discountPct : null,
    reference_price: unitCost ? unitCost.referencePrice : null
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
  const { firmId, planType, duration, numUsers, baseAmount, dueDate, homeCountry, addonCountries, includeUnitCost } = invoiceData;

  const firm = await db.getFirmById(firmId);
  if (!firm) throw new Error('Law firm not found');

  const country = (homeCountry || firm.home_country || 'ghana').toLowerCase();
  const addons = parseAddons(addonCountries ?? firm.addon_countries);
  const amounts = calculateAmounts(baseAmount, numUsers, duration, country);
  const unitCost = await buildUnitCost(country, planType, baseAmount, numUsers, includeUnitCost);
  const invoiceNumber = await db.getNextInvoiceNumber();

  return {
    invoiceNumber,
    dueDate: formatDate(dueDate),
    firm,
    planType,
    duration,
    numUsers,
    baseAmount,
    homeCountry: country,
    addonCountries: addons,
    currency: country === 'nigeria' ? 'NGN' : 'GHS',
    unitCostLine: unitCost ? unitCost.line : null,
    ...amounts
  };
};

// Regenerate invoice document from existing invoice record (for downloads)
export const regenerateInvoice = async (invoiceRecord, format = 'pdf') => {
  const firm = await db.getFirmById(invoiceRecord.firm_id);
  if (!firm) throw new Error('Law firm not found');

  const country = (invoiceRecord.home_country || firm.home_country || 'ghana').toLowerCase();
  const addons = parseAddons(invoiceRecord.addon_countries);

  const template = await loadTemplateBuffer(templateFilenameFor(country, invoiceRecord.plan_type));

  const unitCostLine = invoiceRecord.include_unit_cost && invoiceRecord.unit_cost != null
    ? (() => {
        const currency = country === 'nigeria' ? 'NGN' : 'GHS';
        const unit = Number(invoiceRecord.unit_cost);
        const ref = invoiceRecord.reference_price != null ? Number(invoiceRecord.reference_price) : null;
        const pct = invoiceRecord.discount_pct != null ? Number(invoiceRecord.discount_pct) : null;
        if (ref && pct != null) {
          return `${currency} ${formatAmount(unit)}/user (${pct}% off ${currency} ${formatAmount(ref)})`;
        }
        return `${currency} ${formatAmount(unit)}/user`;
      })()
    : '';

  const amounts = {
    subtotal: invoiceRecord.subtotal,
    gtfl: invoiceRecord.gtfl,
    nihl: invoiceRecord.nihl,
    vat: invoiceRecord.vat,
    total: invoiceRecord.total
  };

  const templateData = buildTemplateData({
    firm, country, planType: invoiceRecord.plan_type,
    duration: invoiceRecord.duration, numUsers: invoiceRecord.num_users,
    amounts,
    invoiceNumber: invoiceRecord.invoice_number, dueDate: invoiceRecord.due_date,
    addons, unitCostLine
  });

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

// Generate PDF invoice using Cloudmersive
export const generateInvoicePDF = async (invoiceData) => {
  const docxResult = await generateInvoice(invoiceData);
  const cloudmersiveApiKey = process.env.CLOUDMERSIVE_API_KEY;
  if (!cloudmersiveApiKey) {
    throw new Error('CLOUDMERSIVE_API_KEY environment variable not set. Please add your Cloudmersive API key.');
  }

  try {
    const formData = new FormData();
    const docxBlob = new Blob([docxResult.buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    formData.append('inputFile', docxBlob, 'invoice.docx');

    const response = await fetch('https://api.cloudmersive.com/convert/docx/to/pdf', {
      method: 'POST',
      headers: { 'Apikey': cloudmersiveApiKey },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudmersive error: ${response.status} - ${errorText}`);
    }

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
