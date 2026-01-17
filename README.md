# JUDY Invoice Generator

A complete invoice generation and management system for JUDY Legal Research. Generate, send, and schedule invoices for law firm subscriptions.

## Features

- **Law Firm Management**: Store and manage law firm details (name, address, city, email, subscription info)
- **Invoice Generation**: Generate professional DOCX invoices from templates
- **Email Sending**: Send invoices directly to law firms via email
- **Scheduling**: Schedule invoices to be automatically generated and sent on specific dates
- **Invoice History**: Track all generated invoices with status (draft/sent)
- **Ghana Tax Calculation**: Automatic calculation of GTFL (2.5%), NIHL (2.5%), and VAT (15%)

## Project Structure

```
judy-invoice-generator/
├── backend/
│   ├── server.js           # Express API server
│   ├── database.js         # SQLite database operations
│   ├── invoiceGenerator.js # Invoice document generation
│   ├── emailService.js     # Email sending service
│   ├── scheduler.js        # Cron job for scheduled invoices
│   ├── templates/          # Invoice templates
│   │   ├── Plus_Template_Polished.docx
│   │   └── Standard_Template_Polished.docx
│   └── judy_invoices.db    # SQLite database (auto-created)
└── frontend/
    └── src/
        └── App.js          # React application
```

## Prerequisites

- Node.js 18 or higher
- npm

## Installation

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

## Running the Application

### Development Mode

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
```
The backend will run on http://localhost:3001

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm start
```
The frontend will run on http://localhost:3000

### Production Mode

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Start the backend (it will serve the frontend build):
```bash
cd backend
npm start
```

Access the application at http://localhost:3001

## Configuration

### Email Setup

1. Go to **Settings** tab in the application
2. Configure your SMTP settings:
   - **SMTP Host**: e.g., `smtp.gmail.com` for Gmail
   - **SMTP Port**: `587` for TLS, `465` for SSL
   - **SMTP Username**: Your email address
   - **SMTP Password**: Your email password or app-specific password
   - **From Email**: The email address to send from
   - **From Name**: e.g., "JUDY Legal Research"

For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an "App Password" at https://myaccount.google.com/apppasswords
3. Use the app password as the SMTP password

### Scheduler

The scheduler automatically processes pending scheduled invoices daily at 8:00 AM. You can:
- Start/stop the scheduler from the Settings page
- Manually process pending invoices using the "Process Now" button

## Usage

### Adding Law Firms

1. Go to **Law Firms** tab
2. Click **+ Add Firm**
3. Fill in the firm details:
   - Firm Name
   - Email (for receiving invoices)
   - Street Address
   - City
   - Plan Type (Standard/Plus)
   - Number of Users
   - Base Price (per user)
   - Subscription dates

### Generating Invoices

1. Go to **Generate** tab
2. Select a law firm
3. Adjust invoice details:
   - Plan Type
   - Duration
   - Number of Users
   - Base Amount
   - Due Date
4. Click **Preview** to see the invoice breakdown
5. Click **Generate & Download** to download the invoice
6. Click **Generate & Send Email** to send directly to the firm

### Scheduling Invoices

1. Go to **Scheduled** tab
2. Click **+ Schedule Invoice**
3. Select the law firm and schedule date
4. Set invoice details
5. The invoice will be automatically generated and emailed on the scheduled date

### Invoice History

- View all generated invoices in the **History** tab
- Download any invoice again
- Resend invoices via email

## Template Placeholders

The templates use these placeholders (wrapped in `{{}}`):`

| Placeholder | Description |
|-------------|-------------|
| `{{INVOICE_NUMBER}}` | Auto-generated invoice number (JUDY-YYYY-XXXX) |
| `{{DUE_DATE}}` | Invoice due date |
| `{{NAME_ADDRESS}}` | Firm name and address |
| `{{DURATION}}` | Subscription duration |
| `{{USERS}}` | Number of users |
| `{{BASE}}` | Base amount per user |
| `{{SUBTOTAL}}` | Subtotal (base × users) |
| `{{GTFL}}` | GTFL tax (2.5%) |
| `{{NIHL}}` | NIHL levy (2.5%) |
| `{{VAT}}` | VAT (15%) |
| `{{TOTAL}}` | Total amount |

## API Endpoints

### Law Firms
- `GET /api/firms` - Get all firms
- `GET /api/firms/:id` - Get single firm
- `POST /api/firms` - Create firm
- `PUT /api/firms/:id` - Update firm
- `DELETE /api/firms/:id` - Delete firm

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/next-number` - Get next invoice number
- `POST /api/invoices/preview` - Preview invoice calculation
- `POST /api/invoices/generate` - Generate and download invoice
- `POST /api/invoices/generate-and-send` - Generate and send via email
- `GET /api/invoices/:id/download` - Download existing invoice
- `POST /api/invoices/:id/send` - Send existing invoice

### Scheduled Invoices
- `GET /api/scheduled` - Get all scheduled invoices
- `POST /api/scheduled` - Create scheduled invoice
- `DELETE /api/scheduled/:id` - Delete scheduled invoice
- `POST /api/scheduled/process` - Process pending scheduled invoices

### Settings
- `GET /api/email-config` - Get email configuration
- `PUT /api/email-config` - Update email configuration
- `GET /api/email-config/verify` - Verify email settings
- `GET /api/scheduler/status` - Get scheduler status
- `POST /api/scheduler/start` - Start scheduler
- `POST /api/scheduler/stop` - Stop scheduler

## Database

The application uses SQLite with the following tables:
- `law_firms` - Law firm information
- `invoices` - Generated invoice records
- `scheduled_invoices` - Scheduled invoice records
- `email_config` - Email configuration

Data is stored in `backend/judy_invoices.db`.

## License

Proprietary - JUDY INNOVATIVE TECH LTD
