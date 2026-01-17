import cron from 'node-cron';
import * as db from './database.js';
import { generateInvoice } from './invoiceGenerator.js';
import { sendInvoiceEmail } from './emailService.js';

let schedulerTask = null;
let isRunning = false;

// Process pending scheduled invoices
export const processScheduledInvoices = async () => {
  console.log(`[${new Date().toISOString()}] Processing scheduled invoices...`);
  
  const pendingInvoices = db.getPendingScheduledInvoices();
  console.log(`Found ${pendingInvoices.length} pending invoices to process`);
  
  const results = [];
  
  for (const scheduled of pendingInvoices) {
    try {
      console.log(`Processing scheduled invoice for: ${scheduled.firm_name}`);
      
      // Get next invoice number
      const invoiceNumber = db.getNextInvoiceNumber();
      
      // Calculate due date (30 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      // Generate invoice
      const result = await generateInvoice({
        firmId: scheduled.firm_id,
        planType: scheduled.plan_type,
        duration: scheduled.duration,
        numUsers: scheduled.num_users,
        baseAmount: scheduled.base_amount,
        dueDate: dueDate.toISOString().split('T')[0],
        invoiceNumber
      });
      
      // Send email
      await sendInvoiceEmail(
        result.invoice,
        result.firm,
        result.buffer,
        result.filename
      );
      
      // Mark scheduled invoice as executed
      await db.updateScheduledInvoiceStatus(scheduled.id, 'executed');
      
      results.push({
        scheduledId: scheduled.id,
        firmName: scheduled.firm_name,
        invoiceNumber,
        status: 'success'
      });
      
      console.log(`Successfully processed invoice ${invoiceNumber} for ${scheduled.firm_name}`);
      
    } catch (error) {
      console.error(`Error processing scheduled invoice ${scheduled.id}:`, error.message);
      
      results.push({
        scheduledId: scheduled.id,
        firmName: scheduled.firm_name,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  return results;
};

// Start the scheduler (runs daily at 8:00 AM)
export const startScheduler = () => {
  if (schedulerTask) {
    console.log('Scheduler is already running');
    return { running: true, message: 'Scheduler already running' };
  }
  
  // Run every day at 8:00 AM
  schedulerTask = cron.schedule('0 8 * * *', async () => {
    console.log('Running scheduled invoice processing...');
    await processScheduledInvoices();
  });
  
  isRunning = true;
  console.log('Scheduler started - will run daily at 8:00 AM');
  
  return { running: true, message: 'Scheduler started' };
};

// Stop the scheduler
export const stopScheduler = () => {
  if (schedulerTask) {
    schedulerTask.stop();
    schedulerTask = null;
    isRunning = false;
    console.log('Scheduler stopped');
    return { running: false, message: 'Scheduler stopped' };
  }
  
  return { running: false, message: 'Scheduler was not running' };
};

// Get scheduler status
export const getSchedulerStatus = () => {
  return {
    running: isRunning,
    nextRun: isRunning ? 'Daily at 8:00 AM' : 'Not scheduled'
  };
};
