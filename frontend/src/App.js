import React, { useState, useEffect, useCallback, useRef } from 'react';

// API base URL - empty for same-origin requests on Vercel
const API_BASE = '';

// Toast notification context
const ToastContext = React.createContext();

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = toastIdRef.current++;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              )}
              {toast.type === 'error' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
              {toast.type === 'info' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              )}
            </span>
            <span className="toast-message">{toast.message}</span>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Styles
const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #f0f4f8;
    color: #1a202c;
    line-height: 1.5;
  }
  
  .app {
    min-height: 100vh;
  }
  
  .header {
    background: linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%);
    color: white;
    padding: 1rem 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .logo-icon {
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #1e40af;
    font-size: 1.25rem;
  }
  
  .logo h1 {
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .logo span {
    font-size: 0.875rem;
    opacity: 0.9;
    font-weight: 400;
  }
  
  .nav {
    display: flex;
    gap: 0.5rem;
  }
  
  .nav-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
  }
  
  .nav-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .nav-btn.active {
    background: white;
    color: #1e40af;
  }
  
  .main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .card-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e40af;
  }
  
  .btn {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn-primary {
    background: #1e40af;
    color: white;
  }
  
  .btn-primary:hover {
    background: #1e3a8a;
  }
  
  .btn-success {
    background: #059669;
    color: white;
  }
  
  .btn-success:hover {
    background: #047857;
  }
  
  .btn-danger {
    background: #dc2626;
    color: white;
  }
  
  .btn-danger:hover {
    background: #b91c1c;
  }
  
  .btn-secondary {
    background: #e2e8f0;
    color: #475569;
  }
  
  .btn-secondary:hover {
    background: #cbd5e1;
  }
  
  .btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
  }
  
  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
    margin-bottom: 0.375rem;
  }
  
  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .table-container {
    overflow-x: auto;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  
  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  
  th {
    background: #f8fafc;
    font-weight: 600;
    color: #475569;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  
  tr:hover {
    background: #f8fafc;
  }
  
  .badge {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
  }
  
  .badge-blue {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .badge-green {
    background: #d1fae5;
    color: #047857;
  }
  
  .badge-yellow {
    background: #fef3c7;
    color: #b45309;
  }
  
  .badge-gray {
    background: #f1f5f9;
    color: #64748b;
  }
  
  .badge-red {
    background: #fee2e2;
    color: #dc2626;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }
  
  .modal {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-header {
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-header h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e40af;
  }
  
  .modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #64748b;
    cursor: pointer;
    line-height: 1;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .modal-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }
  
  .alert {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .alert-success {
    background: #d1fae5;
    color: #047857;
  }
  
  .alert-error {
    background: #fee2e2;
    color: #dc2626;
  }
  
  .alert-info {
    background: #dbeafe;
    color: #1e40af;
  }
  
  .preview-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1.25rem;
    margin-top: 1rem;
  }
  
  .preview-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .preview-row:last-child {
    border-bottom: none;
    font-weight: 600;
  }
  
  .preview-label {
    color: #64748b;
  }
  
  .preview-value {
    font-weight: 500;
  }
  
  .action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #64748b;
  }
  
  .empty-state-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .stat-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    margin-bottom: 0.5rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e40af;
  }
  
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    color: #64748b;
  }
  
  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #e2e8f0;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.75rem;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Toast Notifications */
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 2000;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 400px;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-success {
    background: #d1fae5;
    color: #047857;
    border-left: 4px solid #059669;
  }

  .toast-error {
    background: #fee2e2;
    color: #dc2626;
    border-left: 4px solid #dc2626;
  }

  .toast-info {
    background: #dbeafe;
    color: #1e40af;
    border-left: 4px solid #3b82f6;
  }

  .toast-icon {
    display: flex;
    align-items: center;
  }

  .toast-message {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .toast-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: inherit;
    cursor: pointer;
    opacity: 0.7;
    padding: 0;
    line-height: 1;
  }

  .toast-close:hover {
    opacity: 1;
  }

  /* Loading Skeleton */
  .skeleton {
    background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .skeleton-row {
    display: flex;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .skeleton-cell {
    height: 1rem;
    flex: 1;
  }

  .skeleton-cell.small { flex: 0.5; }
  .skeleton-cell.medium { flex: 1; }
  .skeleton-cell.large { flex: 2; }

  /* Success Animation */
  .success-checkmark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    animation: scaleIn 0.3s ease-out;
  }

  @keyframes scaleIn {
    0% { transform: scale(0); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  .success-checkmark svg {
    color: #059669;
  }

  /* Search/Filter Input */
  .search-filter-bar {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .search-input-wrapper {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 400px;
  }

  .search-input-wrapper input {
    width: 100%;
    padding: 0.625rem 0.875rem 0.625rem 2.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }

  .search-input-wrapper input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .search-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
  }

  .filter-select {
    padding: 0.625rem 0.875rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
    min-width: 140px;
  }

  /* Pagination */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid #e2e8f0;
  }

  .pagination-btn {
    padding: 0.5rem 0.875rem;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    color: #475569;
  }

  .pagination-btn:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-btn.active {
    background: #1e40af;
    color: white;
    border-color: #1e40af;
  }

  .pagination-info {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0 0.5rem;
  }

  /* Action buttons consistent sizing */
  .action-btn {
    padding: 0.375rem 0.625rem;
    min-width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.75rem;
    transition: all 0.2s;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn-pdf { background: #fee2e2; color: #dc2626; }
  .action-btn-pdf:hover:not(:disabled) { background: #fecaca; }

  .action-btn-docx { background: #dbeafe; color: #2563eb; }
  .action-btn-docx:hover:not(:disabled) { background: #bfdbfe; }

  .action-btn-send { background: #d1fae5; color: #059669; }
  .action-btn-send:hover:not(:disabled) { background: #a7f3d0; }

  .action-btn-edit { background: #e2e8f0; color: #475569; }
  .action-btn-edit:hover:not(:disabled) { background: #cbd5e1; }

  .action-btn-delete { background: #fee2e2; color: #dc2626; }
  .action-btn-delete:hover:not(:disabled) { background: #fecaca; }

  /* Improved Empty State */
  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
  }

  .empty-state-icon {
    font-size: 3.5rem;
    margin-bottom: 1rem;
    opacity: 0.8;
  }

  .empty-state-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  .empty-state-description {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 1.5rem;
    max-width: 300px;
    margin-left: auto;
    margin-right: auto;
  }

  .empty-state-action {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: #1e40af;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .empty-state-action:hover {
    background: #1e3a8a;
  }

  /* Export button */
  .export-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #059669;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .export-btn:hover {
    background: #047857;
  }
`;

// API Functions - Using query parameters for Vercel Hobby plan compatibility
const api = {
  // Firms
  getFirms: () => fetch(`${API_BASE}/api/firms`).then(r => r.json()),
  getFirm: (id) => fetch(`${API_BASE}/api/firms?id=${id}`).then(r => r.json()),
  createFirm: (data) => fetch(`${API_BASE}/api/firms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateFirm: (id, data) => fetch(`${API_BASE}/api/firms?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteFirm: (id) => fetch(`${API_BASE}/api/firms?id=${id}`, { method: 'DELETE' }).then(r => r.json()),

  // Invoices
  getInvoices: () => fetch(`${API_BASE}/api/invoices`).then(r => r.json()),
  getNextInvoiceNumber: () => fetch(`${API_BASE}/api/invoices?action=next-number`).then(r => r.json()),
  previewInvoice: (data) => fetch(`${API_BASE}/api/invoices?action=preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  generateInvoice: async (data, format = 'docx') => {
    const response = await fetch(`${API_BASE}/api/invoices?action=generate&format=${format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to generate invoice');
    const blob = await response.blob();
    const invoiceNumber = response.headers.get('X-Invoice-Number');
    return { blob, invoiceNumber, format };
  },
  generateAndSendInvoice: (data) => fetch(`${API_BASE}/api/invoices?action=generate-and-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  sendInvoice: (id) => fetch(`${API_BASE}/api/invoices?action=send&id=${id}`, { method: 'POST' }).then(r => r.json()),
  downloadInvoice: async (id, format = 'pdf') => {
    const response = await fetch(`${API_BASE}/api/invoices?action=download&id=${id}&format=${format}`);
    if (!response.ok) throw new Error('Failed to download invoice');
    return response.blob();
  },

  // Scheduled
  getScheduled: () => fetch(`${API_BASE}/api/scheduled`).then(r => r.json()),
  createScheduled: (data) => fetch(`${API_BASE}/api/scheduled`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteScheduled: (id) => fetch(`${API_BASE}/api/scheduled?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
  processScheduled: () => fetch(`${API_BASE}/api/scheduled?action=process`, { method: 'POST' }).then(r => r.json()),
  processScheduledSingle: (id) => fetch(`${API_BASE}/api/scheduled?action=process&id=${id}`, { method: 'POST' }).then(r => r.json()),

  // Email Config
  getEmailConfig: () => fetch(`${API_BASE}/api/email-config`).then(r => r.json()),
  updateEmailConfig: (data) => fetch(`${API_BASE}/api/email-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  verifyEmailConfig: () => fetch(`${API_BASE}/api/email-config?action=verify`).then(r => r.json()),

  // Scheduler
  getSchedulerStatus: () => fetch(`${API_BASE}/api/scheduler`).then(r => r.json()),
  startScheduler: () => fetch(`${API_BASE}/api/scheduler?action=start`, { method: 'POST' }).then(r => r.json()),
  stopScheduler: () => fetch(`${API_BASE}/api/scheduler?action=stop`, { method: 'POST' }).then(r => r.json()),
};

// Format currency
const formatCurrency = (amount) => {
  return `GHS ${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Skeleton Loader Component
function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="table-container">
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-row">
          {[...Array(columns)].map((_, colIndex) => (
            <div
              key={colIndex}
              className={`skeleton skeleton-cell ${colIndex === 0 ? 'large' : colIndex === columns - 1 ? 'small' : 'medium'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Success Checkmark Component
function SuccessCheckmark() {
  return (
    <span className="success-checkmark">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </span>
  );
}

// Search Input Component
function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="search-input-wrapper">
      <span className="search-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

// Pagination Component
function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination">
      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </button>

      {getPageNumbers().map(page => (
        <button
          key={page}
          className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className="pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </button>

      <span className="pagination-info">
        {startItem}-{endItem} of {totalItems}
      </span>
    </div>
  );
}

// Export to CSV function
const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;

  const headers = ['Invoice #', 'Firm', 'Plan', 'Duration', 'Users', 'Base Amount', 'GTFL', 'NIHL', 'VAT', 'Total', 'Due Date', 'Status', 'Created'];
  const rows = data.map(inv => [
    inv.invoice_number,
    inv.firm_name,
    inv.plan_type === 'plus' ? 'Plus' : 'Standard',
    inv.duration,
    inv.num_users,
    inv.base_amount,
    inv.gtfl,
    inv.nihl,
    inv.vat,
    inv.total,
    inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '',
    inv.status,
    inv.created_at ? new Date(inv.created_at).toLocaleDateString() : ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Alert Component (kept for modal alerts)
function Alert({ type, message, onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      {onClose && <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>}
    </div>
  );
}

// Law Firms Management
function FirmsSection({ firms, onRefresh, isLoading }) {
  const [showModal, setShowModal] = useState(false);
  const [editingFirm, setEditingFirm] = useState(null);
  const [formData, setFormData] = useState({
    firm_name: '',
    street_address: '',
    city: '',
    email: '',
    plan_type: 'standard',
    num_users: 1,
    subscription_start: '',
    subscription_end: '',
    base_price: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const { addToast } = useToast();

  // Filter firms based on search and plan filter
  const filteredFirms = firms.filter(firm => {
    const matchesSearch = firm.firm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         firm.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         firm.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === 'all' || firm.plan_type === planFilter;
    return matchesSearch && matchesPlan;
  });

  const handleOpenModal = (firm = null) => {
    if (firm) {
      setEditingFirm(firm);
      setFormData({
        firm_name: firm.firm_name || '',
        street_address: firm.street_address || '',
        city: firm.city || '',
        email: firm.email || '',
        plan_type: firm.plan_type || 'standard',
        num_users: firm.num_users || 1,
        subscription_start: firm.subscription_start ? firm.subscription_start.split('T')[0] : '',
        subscription_end: firm.subscription_end ? firm.subscription_end.split('T')[0] : '',
        base_price: firm.base_price || 0
      });
    } else {
      setEditingFirm(null);
      setFormData({
        firm_name: '',
        street_address: '',
        city: '',
        email: '',
        plan_type: 'standard',
        num_users: 1,
        subscription_start: '',
        subscription_end: '',
        base_price: 0
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editingFirm) {
        await api.updateFirm(editingFirm.id, formData);
        addToast('Firm updated successfully!', 'success');
      } else {
        await api.createFirm(formData);
        addToast('Firm added successfully!', 'success');
      }
      setShowModal(false);
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this firm?')) return;
    try {
      await api.deleteFirm(id);
      addToast('Firm deleted successfully!', 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Law Firms</h2>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Add Firm</button>
        </div>

        {/* Search and Filter */}
        <div className="search-filter-bar">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search firms by name, email, or city..."
          />
          <select
            className="filter-select"
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
          >
            <option value="all">All Plans</option>
            <option value="standard">Standard</option>
            <option value="plus">Plus</option>
          </select>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : firms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-title">No law firms yet</div>
            <p className="empty-state-description">
              Add your first law firm to start generating invoices for them.
            </p>
            <button className="empty-state-action" onClick={() => handleOpenModal()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add First Firm
            </button>
          </div>
        ) : filteredFirms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-title">No matches found</div>
            <p className="empty-state-description">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Firm Name</th>
                  <th>Address</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Users</th>
                  <th>Subscription End</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFirms.map(firm => (
                  <tr key={firm.id}>
                    <td><strong>{firm.firm_name}</strong></td>
                    <td>{firm.street_address}, {firm.city}</td>
                    <td>{firm.email}</td>
                    <td>
                      <span className={`badge ${firm.plan_type === 'plus' ? 'badge-blue' : 'badge-gray'}`}>
                        {firm.plan_type === 'plus' ? 'Plus' : 'Standard'}
                      </span>
                    </td>
                    <td>{firm.num_users}</td>
                    <td>{formatDate(firm.subscription_end)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn action-btn-edit" onClick={() => handleOpenModal(firm)} title="Edit">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="action-btn action-btn-delete" onClick={() => handleDelete(firm.id)} title="Delete">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingFirm ? 'Edit Law Firm' : 'Add Law Firm'}>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label>Firm Name *</label>
              <input
                type="text"
                value={formData.firm_name}
                onChange={e => setFormData({ ...formData, firm_name: e.target.value })}
                placeholder="e.g., ENS Africa"
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g., billing@ensafrica.com"
              />
            </div>
            <div className="form-group">
              <label>Street Address *</label>
              <input
                type="text"
                value={formData.street_address}
                onChange={e => setFormData({ ...formData, street_address: e.target.value })}
                placeholder="e.g., 4th Floor, Heritage Tower"
              />
            </div>
            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g., Accra, Ghana"
              />
            </div>
            <div className="form-group">
              <label>Plan Type</label>
              <select
                value={formData.plan_type}
                onChange={e => setFormData({ ...formData, plan_type: e.target.value })}
              >
                <option value="standard">Standard</option>
                <option value="plus">Plus</option>
              </select>
            </div>
            <div className="form-group">
              <label>Number of Users</label>
              <input
                type="number"
                min="1"
                value={formData.num_users}
                onChange={e => setFormData({ ...formData, num_users: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="form-group">
              <label>Base Price (GHS)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.base_price}
                onChange={e => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Subscription Start</label>
              <input
                type="date"
                value={formData.subscription_start}
                onChange={e => setFormData({ ...formData, subscription_start: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Subscription End</label>
              <input
                type="date"
                value={formData.subscription_end}
                onChange={e => setFormData({ ...formData, subscription_end: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : (editingFirm ? 'Update' : 'Add Firm')}
          </button>
        </div>
      </Modal>
    </>
  );
}

// Generate Invoice Section
function GenerateInvoiceSection({ firms, onRefresh }) {
  const [formData, setFormData] = useState({
    firmId: '',
    planType: 'standard',
    duration: '12 months',
    numUsers: 1,
    baseAmount: 0,
    dueDate: ''
  });
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    // Set default due date to 30 days from now
    const date = new Date();
    date.setDate(date.getDate() + 30);
    setFormData(prev => ({ ...prev, dueDate: date.toISOString().split('T')[0] }));
  }, []);

  // Auto-populate from selected firm
  useEffect(() => {
    if (formData.firmId) {
      const firm = firms.find(f => f.id === parseInt(formData.firmId));
      if (firm) {
        setFormData(prev => ({
          ...prev,
          planType: firm.plan_type || 'standard',
          numUsers: firm.num_users || 1,
          baseAmount: firm.base_price || 0
        }));
      }
    }
  }, [formData.firmId, firms]);

  const handlePreview = async () => {
    if (!formData.firmId) {
      addToast('Please select a law firm', 'error');
      return;
    }
    setLoading(true);
    try {
      const data = await api.previewInvoice(formData);
      setPreview(data);
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(false);
  };

  const handleDownload = async (format = 'docx') => {
    if (!formData.firmId) {
      addToast('Please select a law firm', 'error');
      return;
    }
    setLoading(true);
    try {
      const { blob, invoiceNumber } = await api.generateInvoice(formData, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${invoiceNumber}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast(`Invoice ${invoiceNumber} downloaded as ${format.toUpperCase()}!`, 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!formData.firmId) {
      addToast('Please select a law firm', 'error');
      return;
    }
    if (!window.confirm('Send invoice via email to the selected firm?')) return;
    setLoading(true);
    try {
      const result = await api.generateAndSendInvoice(formData);
      if (result.error) throw new Error(result.error);
      addToast(result.message, 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Generate Invoice</h2>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label>Select Law Firm *</label>
          <select
            value={formData.firmId}
            onChange={e => setFormData({ ...formData, firmId: e.target.value })}
          >
            <option value="">-- Select Firm --</option>
            {firms.map(firm => (
              <option key={firm.id} value={firm.id}>{firm.firm_name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Plan Type</label>
          <select
            value={formData.planType}
            onChange={e => setFormData({ ...formData, planType: e.target.value })}
          >
            <option value="standard">Standard Plan</option>
            <option value="plus">Plus Plan</option>
          </select>
        </div>
        <div className="form-group">
          <label>Duration</label>
          <select
            value={formData.duration}
            onChange={e => setFormData({ ...formData, duration: e.target.value })}
          >
            <option value="1 month">1 Month</option>
            <option value="3 months">3 Months</option>
            <option value="6 months">6 Months</option>
            <option value="12 months">12 Months</option>
            <option value="24 months">24 Months</option>
          </select>
        </div>
        <div className="form-group">
          <label>Number of Users</label>
          <input
            type="number"
            min="1"
            value={formData.numUsers}
            onChange={e => setFormData({ ...formData, numUsers: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="form-group">
          <label>Base Amount (GHS)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.baseAmount}
            onChange={e => setFormData({ ...formData, baseAmount: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="form-group">
          <label>Due Date</label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
          />
        </div>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={handlePreview} disabled={loading}>
          Preview
        </button>
        <button
          className="btn"
          onClick={() => handleDownload('pdf')}
          disabled={loading}
          style={{ background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
          </svg>
          {loading ? 'Processing...' : 'Download PDF'}
        </button>
        <button
          className="btn"
          onClick={() => handleDownload('docx')}
          disabled={loading}
          style={{ background: '#2b579a', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13zm-4 5.5l1.1 4.5h.8l.9-3 .9 3h.8l1.1-4.5h-1l-.6 2.8-.9-2.8h-.6l-.9 2.8-.6-2.8H9z"/>
          </svg>
          {loading ? 'Processing...' : 'Download Word'}
        </button>
        <button
          className="btn"
          onClick={handleSend}
          disabled={loading}
          style={{ background: '#059669', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          {loading ? 'Processing...' : 'Generate & Send'}
        </button>
      </div>

      {preview && (
        <div className="preview-box">
          <h4 style={{ marginBottom: '1rem', color: '#1e40af' }}>Invoice Preview</h4>
          <div className="preview-row">
            <span className="preview-label">Invoice Number</span>
            <span className="preview-value">{preview.invoiceNumber}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Firm</span>
            <span className="preview-value">{preview.firm?.firm_name}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Plan</span>
            <span className="preview-value">{preview.planType === 'plus' ? 'Plus' : 'Standard'}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Duration</span>
            <span className="preview-value">{preview.duration}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Users</span>
            <span className="preview-value">{preview.numUsers}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Subtotal</span>
            <span className="preview-value">{formatCurrency(preview.subtotal)}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">GTFL (2.5%)</span>
            <span className="preview-value">{formatCurrency(preview.gtfl)}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">NIHL (2.5%)</span>
            <span className="preview-value">{formatCurrency(preview.nihl)}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">VAT (15%)</span>
            <span className="preview-value">{formatCurrency(preview.vat)}</span>
          </div>
          <div className="preview-row">
            <span className="preview-label">Total</span>
            <span className="preview-value" style={{ color: '#1e40af', fontSize: '1.125rem' }}>{formatCurrency(preview.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Scheduled Invoices Section
function ScheduledSection({ firms, scheduled, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firm_id: '',
    schedule_date: '',
    plan_type: 'standard',
    duration: '12 months',
    num_users: 1,
    base_amount: 0
  });
  const [loading, setLoading] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const { addToast } = useToast();

  // Auto-populate from selected firm
  useEffect(() => {
    if (formData.firm_id) {
      const firm = firms.find(f => f.id === parseInt(formData.firm_id));
      if (firm) {
        setFormData(prev => ({
          ...prev,
          plan_type: firm.plan_type || 'standard',
          num_users: firm.num_users || 1,
          base_amount: firm.base_price || 0,
          schedule_date: firm.subscription_end ? firm.subscription_end.split('T')[0] : prev.schedule_date
        }));
      }
    }
  }, [formData.firm_id, firms]);

  const handleCreate = async () => {
    if (!formData.firm_id || !formData.schedule_date) {
      addToast('Please fill in all required fields', 'error');
      return;
    }
    setFormLoading(true);
    try {
      await api.createScheduled(formData);
      addToast('Scheduled invoice created!', 'success');
      setShowModal(false);
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setFormLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scheduled invoice?')) return;
    setLoading(prev => ({ ...prev, [id]: 'delete' }));
    try {
      await api.deleteScheduled(id);
      addToast('Scheduled invoice deleted!', 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(prev => ({ ...prev, [id]: null }));
  };

  const handleProcessNow = async (id, email) => {
    if (!window.confirm(`Process and send invoice to ${email} now?`)) return;
    setLoading(prev => ({ ...prev, [id]: 'process' }));
    try {
      const result = await api.processScheduledSingle(id);
      if (result.error) throw new Error(result.error);
      addToast(result.message, 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(prev => ({ ...prev, [id]: null }));
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Scheduled Invoices</h2>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Schedule Invoice
          </button>
        </div>

        {scheduled.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <div className="empty-state-title">No scheduled invoices</div>
            <p className="empty-state-description">
              Schedule invoices to be automatically generated and sent on specific dates.
            </p>
            <button className="empty-state-action" onClick={() => setShowModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Schedule First Invoice
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Firm</th>
                  <th>Schedule Date</th>
                  <th>Plan</th>
                  <th>Duration</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scheduled.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.firm_name}</strong></td>
                    <td>{formatDate(item.schedule_date)}</td>
                    <td>
                      <span className={`badge ${item.plan_type === 'plus' ? 'badge-blue' : 'badge-gray'}`}>
                        {item.plan_type === 'plus' ? 'Plus' : 'Standard'}
                      </span>
                    </td>
                    <td>{item.duration}</td>
                    <td>{formatCurrency(item.base_amount)}</td>
                    <td>
                      <span className={`badge ${
                        item.status === 'pending' ? 'badge-yellow' :
                        item.status === 'executed' ? 'badge-green' : 'badge-red'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {item.status === 'pending' && (
                        <div className="action-buttons">
                          <button
                            className="action-btn action-btn-send"
                            onClick={() => handleProcessNow(item.id, item.email)}
                            disabled={loading[item.id]}
                            title="Process & Send Now"
                          >
                            {loading[item.id] === 'process' ? '...' : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                              </svg>
                            )}
                          </button>
                          <button
                            className="action-btn action-btn-delete"
                            onClick={() => handleDelete(item.id)}
                            disabled={loading[item.id]}
                            title="Cancel"
                          >
                            {loading[item.id] === 'delete' ? '...' : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Schedule Invoice">
        <div className="modal-body">
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Invoice will be generated and emailed on the scheduled date.
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Law Firm *</label>
              <select
                value={formData.firm_id}
                onChange={e => setFormData({ ...formData, firm_id: e.target.value })}
              >
                <option value="">-- Select Firm --</option>
                {firms.map(firm => (
                  <option key={firm.id} value={firm.id}>{firm.firm_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Schedule Date *</label>
              <input
                type="date"
                value={formData.schedule_date}
                onChange={e => setFormData({ ...formData, schedule_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Plan Type</label>
              <select
                value={formData.plan_type}
                onChange={e => setFormData({ ...formData, plan_type: e.target.value })}
              >
                <option value="standard">Standard Plan</option>
                <option value="plus">Plus Plan</option>
              </select>
            </div>
            <div className="form-group">
              <label>Duration</label>
              <select
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
              >
                <option value="1 month">1 Month</option>
                <option value="3 months">3 Months</option>
                <option value="6 months">6 Months</option>
                <option value="12 months">12 Months</option>
                <option value="24 months">24 Months</option>
              </select>
            </div>
            <div className="form-group">
              <label>Number of Users</label>
              <input
                type="number"
                min="1"
                value={formData.num_users}
                onChange={e => setFormData({ ...formData, num_users: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="form-group">
              <label>Base Amount (GHS)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.base_amount}
                onChange={e => setFormData({ ...formData, base_amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={formLoading}>
            {formLoading ? 'Creating...' : 'Schedule'}
          </button>
        </div>
      </Modal>
    </>
  );
}

// Invoice History Section
function InvoiceHistorySection({ invoices, onRefresh, showFilters = true, onNavigateToGenerate }) {
  const [loading, setLoading] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { addToast } = useToast();

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.firm_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesPlan = planFilter === 'all' || inv.plan_type === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, planFilter]);

  const handleDownload = async (id, invoiceNumber, format) => {
    setLoading(prev => ({ ...prev, [`${id}-${format}`]: true }));
    try {
      const blob = await api.downloadInvoice(id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${invoiceNumber}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast(`Downloaded ${invoiceNumber}.${format}`, 'success');
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(prev => ({ ...prev, [`${id}-${format}`]: false }));
  };

  const handleSend = async (id, email) => {
    if (!window.confirm(`Send invoice to ${email}?`)) return;
    setLoading(prev => ({ ...prev, [id]: 'send' }));
    try {
      const result = await api.sendInvoice(id);
      if (result.error) throw new Error(result.error);
      addToast(result.message, 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(prev => ({ ...prev, [id]: null }));
  };

  const handleExportCSV = () => {
    exportToCSV(filteredInvoices, 'invoices');
    addToast('Invoice history exported to CSV', 'success');
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Invoice History</h2>
        {showFilters && invoices.length > 0 && (
          <button className="export-btn" onClick={handleExportCSV}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Search and Filters */}
      {showFilters && invoices.length > 0 && (
        <div className="search-filter-bar">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by invoice # or firm name..."
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
          </select>
          <select
            className="filter-select"
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
          >
            <option value="all">All Plans</option>
            <option value="standard">Standard</option>
            <option value="plus">Plus</option>
          </select>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">No invoices yet</div>
          <p className="empty-state-description">
            Generate your first invoice to see it appear here.
          </p>
          {onNavigateToGenerate && (
            <button className="empty-state-action" onClick={onNavigateToGenerate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              Create First Invoice
            </button>
          )}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No matches found</div>
          <p className="empty-state-description">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Firm</th>
                  <th>Plan</th>
                  <th>Total</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map(inv => (
                  <tr key={inv.id}>
                    <td><strong>{inv.invoice_number}</strong></td>
                    <td>{inv.firm_name}</td>
                    <td>
                      <span className={`badge ${inv.plan_type === 'plus' ? 'badge-blue' : 'badge-gray'}`}>
                        {inv.plan_type === 'plus' ? 'Plus' : 'Standard'}
                      </span>
                    </td>
                    <td>{formatCurrency(inv.total)}</td>
                    <td>{formatDate(inv.due_date)}</td>
                    <td>
                      <span className={`badge ${inv.status === 'sent' ? 'badge-green' : 'badge-yellow'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn action-btn-pdf"
                          onClick={() => handleDownload(inv.id, inv.invoice_number, 'pdf')}
                          disabled={loading[`${inv.id}-pdf`]}
                          title="Download PDF"
                        >
                          {loading[`${inv.id}-pdf`] ? '...' : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <path d="M9 15h6"/>
                              <path d="M12 18v-6"/>
                            </svg>
                          )}
                        </button>
                        <button
                          className="action-btn action-btn-docx"
                          onClick={() => handleDownload(inv.id, inv.invoice_number, 'docx')}
                          disabled={loading[`${inv.id}-docx`]}
                          title="Download DOCX"
                        >
                          {loading[`${inv.id}-docx`] ? '...' : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <line x1="10" y1="9" x2="8" y2="9"/>
                            </svg>
                          )}
                        </button>
                        <button
                          className="action-btn action-btn-send"
                          onClick={() => handleSend(inv.id, inv.email)}
                          disabled={loading[inv.id]}
                          title="Send via Email"
                        >
                          {loading[inv.id] === 'send' ? '...' : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="22" y1="2" x2="11" y2="13"/>
                              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {showFilters && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredInvoices.length}
              itemsPerPage={itemsPerPage}
            />
          )}
        </>
      )}
    </div>
  );
}

// Settings Section
function SettingsSection() {
  const [config, setConfig] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_pass: '',
    from_email: '',
    from_name: 'JUDY Legal Research'
  });
  const [loading, setLoading] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    loadConfig();
    checkSchedulerStatus();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await api.getEmailConfig();
      if (data) setConfig(data);
    } catch (error) {
      console.error('Failed to load email config:', error);
    }
  };

  const checkSchedulerStatus = async () => {
    try {
      const data = await api.getSchedulerStatus();
      setSchedulerRunning(data.running);
    } catch (error) {
      console.error('Failed to check scheduler status:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.updateEmailConfig(config);
      addToast('Email settings saved!', 'success');
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const result = await api.verifyEmailConfig();
      addToast(result.message, result.configured ? 'success' : 'error');
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(false);
  };

  const toggleScheduler = async () => {
    setLoading(true);
    try {
      if (schedulerRunning) {
        await api.stopScheduler();
        setSchedulerRunning(false);
        addToast('Scheduler stopped', 'info');
      } else {
        await api.startScheduler();
        setSchedulerRunning(true);
        addToast('Scheduler started', 'success');
      }
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(false);
  };

  return (
    <>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Email Configuration</h2>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>SMTP Host</label>
            <input
              type="text"
              value={config.smtp_host}
              onChange={e => setConfig({ ...config, smtp_host: e.target.value })}
              placeholder="e.g., smtp.gmail.com"
            />
          </div>
          <div className="form-group">
            <label>SMTP Port</label>
            <input
              type="number"
              value={config.smtp_port}
              onChange={e => setConfig({ ...config, smtp_port: parseInt(e.target.value) || 587 })}
            />
          </div>
          <div className="form-group">
            <label>SMTP Username</label>
            <input
              type="text"
              value={config.smtp_user}
              onChange={e => setConfig({ ...config, smtp_user: e.target.value })}
              placeholder="e.g., your@email.com"
            />
          </div>
          <div className="form-group">
            <label>SMTP Password</label>
            <input
              type="password"
              value={config.smtp_pass}
              onChange={e => setConfig({ ...config, smtp_pass: e.target.value })}
              placeholder="Enter password"
            />
          </div>
          <div className="form-group">
            <label>From Email</label>
            <input
              type="email"
              value={config.from_email}
              onChange={e => setConfig({ ...config, from_email: e.target.value })}
              placeholder="e.g., invoices@judy.legal"
            />
          </div>
          <div className="form-group">
            <label>From Name</label>
            <input
              type="text"
              value={config.from_name}
              onChange={e => setConfig({ ...config, from_name: e.target.value })}
            />
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ marginRight: '0.5rem' }}>
            Save Settings
          </button>
          <button className="btn btn-secondary" onClick={handleVerify} disabled={loading}>
            Verify Connection
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Scheduler</h2>
        </div>
        
        <p style={{ marginBottom: '1rem', color: '#64748b' }}>
          The scheduler automatically processes pending scheduled invoices daily at 8:00 AM Ghana Time (GMT).
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={`badge ${schedulerRunning ? 'badge-green' : 'badge-red'}`}>
            {schedulerRunning ? 'Running' : 'Stopped'}
          </span>
          <button 
            className={`btn ${schedulerRunning ? 'btn-danger' : 'btn-success'}`} 
            onClick={toggleScheduler}
            disabled={loading}
          >
            {schedulerRunning ? 'Stop Scheduler' : 'Start Scheduler'}
          </button>
        </div>
      </div>
    </>
  );
}

// Main App Component (inner)
function AppContent() {
  const [activeTab, setActiveTab] = useState('generate');
  const [firms, setFirms] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [firmsData, invoicesData, scheduledData] = await Promise.all([
        api.getFirms(),
        api.getInvoices(),
        api.getScheduled()
      ]);
      setFirms(firmsData || []);
      setInvoices(invoicesData || []);
      setScheduled(scheduledData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="app">
      <style>{styles}</style>

      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => setActiveTab('generate')} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">J</div>
            <div>
              <h1>JUDY</h1>
              <span>Invoice Generator</span>
            </div>
          </div>
          <nav className="nav">
            <button
              className={`nav-btn ${activeTab === 'generate' ? 'active' : ''}`}
              onClick={() => setActiveTab('generate')}
            >
              Generate
            </button>
            <button
              className={`nav-btn ${activeTab === 'firms' ? 'active' : ''}`}
              onClick={() => setActiveTab('firms')}
            >
              Law Firms
            </button>
            <button
              className={`nav-btn ${activeTab === 'scheduled' ? 'active' : ''}`}
              onClick={() => setActiveTab('scheduled')}
            >
              Scheduled
            </button>
            <button
              className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
            <button
              className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            Loading...
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-label">Law Firms</div>
                <div className="stat-value">{firms.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Invoices</div>
                <div className="stat-value">{invoices.length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Pending Scheduled</div>
                <div className="stat-value">{scheduled.filter(s => s.status === 'pending').length}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Invoices Sent</div>
                <div className="stat-value">{invoices.filter(i => i.status === 'sent').length}</div>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'generate' && (
              <>
                <GenerateInvoiceSection firms={firms} onRefresh={loadData} />
                <InvoiceHistorySection invoices={invoices.slice(0, 5)} onRefresh={loadData} showFilters={false} />
              </>
            )}
            {activeTab === 'firms' && (
              <FirmsSection firms={firms} onRefresh={loadData} isLoading={loading} />
            )}
            {activeTab === 'scheduled' && (
              <ScheduledSection firms={firms} scheduled={scheduled} onRefresh={loadData} />
            )}
            {activeTab === 'history' && (
              <InvoiceHistorySection
                invoices={invoices}
                onRefresh={loadData}
                onNavigateToGenerate={() => setActiveTab('generate')}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsSection />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// Main App with ToastProvider wrapper
function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
