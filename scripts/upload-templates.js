/**
 * Script to upload invoice templates to Vercel Blob Storage
 *
 * Before running this script, make sure you have:
 * 1. Created a Vercel Blob store in your Vercel dashboard
 * 2. Set the BLOB_READ_WRITE_TOKEN environment variable
 *
 * Run with: node scripts/upload-templates.js
 */

import { put } from '@vercel/blob';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '../backend/templates');

async function uploadTemplates() {
  const templates = [
    'Plus_Template_Polished.docx',
    'Standard_Template_Polished.docx'
  ];

  console.log('Uploading templates to Vercel Blob...\n');

  for (const templateName of templates) {
    const templatePath = path.join(TEMPLATES_DIR, templateName);

    if (!fs.existsSync(templatePath)) {
      console.error(`Template not found: ${templatePath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(templatePath);

    try {
      const blob = await put(templateName, fileBuffer, {
        access: 'public',
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      console.log(`Uploaded: ${templateName}`);
      console.log(`  URL: ${blob.url}\n`);
    } catch (error) {
      console.error(`Error uploading ${templateName}:`, error.message);
    }
  }

  console.log('\nDone! Make sure to set BLOB_BASE_URL in your Vercel environment variables.');
  console.log('BLOB_BASE_URL should be the base URL without the filename, e.g.:');
  console.log('https://xxxxx.public.blob.vercel-storage.com');
}

uploadTemplates().catch(console.error);
