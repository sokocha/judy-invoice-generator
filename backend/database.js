import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default data structure
const defaultData = {
  law_firms: [],
  invoices: [],
  scheduled_invoices: [],
  email_config: {
    id: 1,
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: 'JUDY Legal Research'
  },
  counters: {
    firm_id: 0,
    invoice_id: 0,
    scheduled_id: 0
  }
};

// Initialize database
const adapter = new JSONFile(path.join(__dirname, 'judy_invoices.json'));
const db = new Low(adapter, defaultData);

// Read database
await db.read();

// Write if empty
if (!db.data) {
  db.data = defaultData;
  await db.write();
}

// Helper to get next ID
const getNextId = async (type) => {
  db.data.counters[type]++;
  await db.write();
  return db.data.counters[type];
};

// Helper to get current timestamp
const now = () => new Date().toISOString();

// Law Firms
export const getAllFirms = () => {
  return db.data.law_firms.sort((a, b) => a.firm_name.localeCompare(b.firm_name));
};

export const getFirmById = (id) => {
  return db.data.law_firms.find(f => f.id === parseInt(id));
};

export const createFirm = async (firm) => {
  const id = await getNextId('firm_id');
  const newFirm = {
    id,
    firm_name: firm.firm_name,
    street_address: firm.street_address,
    city: firm.city,
    email: firm.email,
    plan_type: firm.plan_type || 'standard',
    num_users: firm.num_users || 1,
    subscription_start: firm.subscription_start || null,
    subscription_end: firm.subscription_end || null,
    base_price: firm.base_price || 0,
    created_at: now(),
    updated_at: now()
  };
  db.data.law_firms.push(newFirm);
  await db.write();
  return newFirm;
};

export const updateFirm = async (id, firm) => {
  const index = db.data.law_firms.findIndex(f => f.id === parseInt(id));
  if (index === -1) return null;
  
  db.data.law_firms[index] = {
    ...db.data.law_firms[index],
    firm_name: firm.firm_name,
    street_address: firm.street_address,
    city: firm.city,
    email: firm.email,
    plan_type: firm.plan_type,
    num_users: firm.num_users,
    subscription_start: firm.subscription_start,
    subscription_end: firm.subscription_end,
    base_price: firm.base_price,
    updated_at: now()
  };
  await db.write();
  return db.data.law_firms[index];
};

export const deleteFirm = async (id) => {
  const index = db.data.law_firms.findIndex(f => f.id === parseInt(id));
  if (index !== -1) {
    db.data.law_firms.splice(index, 1);
    await db.write();
  }
  return { success: true };
};

// Invoices
export const getAllInvoices = () => {
  return db.data.invoices
    .map(inv => {
      const firm = db.data.law_firms.find(f => f.id === inv.firm_id);
      return {
        ...inv,
        firm_name: firm?.firm_name || 'Unknown',
        email: firm?.email || ''
      };
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

export const getInvoiceById = (id) => {
  const invoice = db.data.invoices.find(i => i.id === parseInt(id));
  if (!invoice) return null;
  
  const firm = db.data.law_firms.find(f => f.id === invoice.firm_id);
  return {
    ...invoice,
    firm_name: firm?.firm_name || 'Unknown',
    street_address: firm?.street_address || '',
    city: firm?.city || '',
    email: firm?.email || ''
  };
};

export const getInvoiceByNumber = (invoiceNumber) => {
  const invoice = db.data.invoices.find(i => i.invoice_number === invoiceNumber);
  if (!invoice) return null;
  
  const firm = db.data.law_firms.find(f => f.id === invoice.firm_id);
  return {
    ...invoice,
    firm_name: firm?.firm_name || 'Unknown',
    street_address: firm?.street_address || '',
    city: firm?.city || '',
    email: firm?.email || ''
  };
};

export const createInvoice = async (invoice) => {
  const id = await getNextId('invoice_id');
  const newInvoice = {
    id,
    invoice_number: invoice.invoice_number,
    firm_id: invoice.firm_id,
    plan_type: invoice.plan_type,
    duration: invoice.duration,
    num_users: invoice.num_users,
    base_amount: invoice.base_amount,
    subtotal: invoice.subtotal,
    gtfl: invoice.gtfl,
    nihl: invoice.nihl,
    vat: invoice.vat,
    total: invoice.total,
    due_date: invoice.due_date,
    status: invoice.status || 'draft',
    sent_at: null,
    created_at: now()
  };
  db.data.invoices.push(newInvoice);
  await db.write();
  return newInvoice;
};

export const updateInvoiceStatus = async (id, status, sentAt = null) => {
  const index = db.data.invoices.findIndex(i => i.id === parseInt(id));
  if (index !== -1) {
    db.data.invoices[index].status = status;
    if (sentAt) {
      db.data.invoices[index].sent_at = sentAt;
    }
    await db.write();
  }
};

export const getNextInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const prefix = `JUDY-${year}-`;
  
  const existingNumbers = db.data.invoices
    .filter(i => i.invoice_number.startsWith(prefix))
    .map(i => parseInt(i.invoice_number.split('-')[2]))
    .filter(n => !isNaN(n));
  
  const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  return `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
};

// Scheduled Invoices
export const getAllScheduledInvoices = () => {
  return db.data.scheduled_invoices
    .map(s => {
      const firm = db.data.law_firms.find(f => f.id === s.firm_id);
      return {
        ...s,
        firm_name: firm?.firm_name || 'Unknown',
        email: firm?.email || ''
      };
    })
    .sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date));
};

export const getPendingScheduledInvoices = () => {
  const today = new Date().toISOString().split('T')[0];
  
  return db.data.scheduled_invoices
    .filter(s => s.status === 'pending' && s.schedule_date <= today)
    .map(s => {
      const firm = db.data.law_firms.find(f => f.id === s.firm_id);
      return {
        ...s,
        firm_name: firm?.firm_name || 'Unknown',
        street_address: firm?.street_address || '',
        city: firm?.city || '',
        email: firm?.email || ''
      };
    })
    .sort((a, b) => new Date(a.schedule_date) - new Date(b.schedule_date));
};

export const createScheduledInvoice = async (scheduled) => {
  const id = await getNextId('scheduled_id');
  const newScheduled = {
    id,
    firm_id: parseInt(scheduled.firm_id),
    schedule_date: scheduled.schedule_date,
    plan_type: scheduled.plan_type,
    duration: scheduled.duration,
    num_users: scheduled.num_users || 1,
    base_amount: scheduled.base_amount,
    status: 'pending',
    created_at: now(),
    executed_at: null
  };
  db.data.scheduled_invoices.push(newScheduled);
  await db.write();
  return newScheduled;
};

export const updateScheduledInvoiceStatus = async (id, status) => {
  const index = db.data.scheduled_invoices.findIndex(s => s.id === parseInt(id));
  if (index !== -1) {
    db.data.scheduled_invoices[index].status = status;
    if (status === 'executed') {
      db.data.scheduled_invoices[index].executed_at = now();
    }
    await db.write();
  }
};

export const deleteScheduledInvoice = async (id) => {
  const index = db.data.scheduled_invoices.findIndex(s => s.id === parseInt(id));
  if (index !== -1) {
    db.data.scheduled_invoices.splice(index, 1);
    await db.write();
  }
  return { success: true };
};

// Email Config
export const getEmailConfig = () => {
  return db.data.email_config;
};

export const updateEmailConfig = async (config) => {
  db.data.email_config = {
    ...db.data.email_config,
    smtp_host: config.smtp_host,
    smtp_port: config.smtp_port,
    smtp_user: config.smtp_user,
    smtp_pass: config.smtp_pass,
    from_email: config.from_email,
    from_name: config.from_name
  };
  await db.write();
};

export default {
  getAllFirms,
  getFirmById,
  createFirm,
  updateFirm,
  deleteFirm,
  getAllInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  createInvoice,
  updateInvoiceStatus,
  getNextInvoiceNumber,
  getAllScheduledInvoices,
  getPendingScheduledInvoices,
  createScheduledInvoice,
  updateScheduledInvoiceStatus,
  deleteScheduledInvoice,
  getEmailConfig,
  updateEmailConfig
};
