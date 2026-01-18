import React, { useState, useEffect, useCallback } from 'react';

// API base URL - empty for same-origin requests on Vercel
const API_BASE = '';

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
    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
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

// Alert Component
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
function FirmsSection({ firms, onRefresh }) {
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
  const [alert, setAlert] = useState({ type: '', message: '' });

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
        setAlert({ type: 'success', message: 'Firm updated successfully!' });
      } else {
        await api.createFirm(formData);
        setAlert({ type: 'success', message: 'Firm added successfully!' });
      }
      setShowModal(false);
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this firm?')) return;
    try {
      await api.deleteFirm(id);
      setAlert({ type: 'success', message: 'Firm deleted successfully!' });
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
  };

  return (
    <>
      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Law Firms</h2>
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>+ Add Firm</button>
        </div>
        
        {firms.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p>No law firms added yet. Add your first firm to get started.</p>
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
                {firms.map(firm => (
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
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenModal(firm)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(firm.id)}>Delete</button>
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
  const [alert, setAlert] = useState({ type: '', message: '' });

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
      setAlert({ type: 'error', message: 'Please select a law firm' });
      return;
    }
    setLoading(true);
    try {
      const data = await api.previewInvoice(formData);
      setPreview(data);
      setAlert({ type: '', message: '' });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(false);
  };

  const handleDownload = async (format = 'docx') => {
    if (!formData.firmId) {
      setAlert({ type: 'error', message: 'Please select a law firm' });
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
      setAlert({ type: 'success', message: `Invoice ${invoiceNumber} downloaded as ${format.toUpperCase()}!` });
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!formData.firmId) {
      setAlert({ type: 'error', message: 'Please select a law firm' });
      return;
    }
    if (!window.confirm('Send invoice via email to the selected firm?')) return;
    setLoading(true);
    try {
      const result = await api.generateAndSendInvoice(formData);
      if (result.error) throw new Error(result.error);
      setAlert({ type: 'success', message: result.message });
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Generate Invoice</h2>
      </div>
      
      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

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
  const [alert, setAlert] = useState({ type: '', message: '' });

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
      setAlert({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }
    setFormLoading(true);
    try {
      await api.createScheduled(formData);
      setAlert({ type: 'success', message: 'Scheduled invoice created!' });
      setShowModal(false);
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setFormLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scheduled invoice?')) return;
    setLoading(prev => ({ ...prev, [id]: 'delete' }));
    try {
      await api.deleteScheduled(id);
      setAlert({ type: 'success', message: 'Scheduled invoice deleted!' });
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(prev => ({ ...prev, [id]: null }));
  };

  const handleProcessNow = async (id, email) => {
    if (!window.confirm(`Process and send invoice to ${email} now?`)) return;
    setLoading(prev => ({ ...prev, [id]: 'process' }));
    try {
      const result = await api.processScheduledSingle(id);
      if (result.error) throw new Error(result.error);
      setAlert({ type: 'success', message: result.message });
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(prev => ({ ...prev, [id]: null }));
  };

  return (
    <>
      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      
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
            <p>No scheduled invoices. Schedule invoices to be automatically generated and sent.</p>
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
                    <td>{formatCurrency(item.base_amount * item.num_users)}</td>
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
                            className="btn btn-sm"
                            onClick={() => handleProcessNow(item.id, item.email)}
                            disabled={loading[item.id]}
                            title="Process & Send Now"
                            style={{ padding: '0.375rem 0.5rem', background: '#d1fae5', color: '#059669' }}
                          >
                            {loading[item.id] === 'process' ? '...' : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13"/>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                              </svg>
                            )}
                          </button>
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDelete(item.id)}
                            disabled={loading[item.id]}
                            title="Cancel"
                            style={{ padding: '0.375rem 0.5rem', background: '#fee2e2', color: '#dc2626' }}
                          >
                            {loading[item.id] === 'delete' ? '...' : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
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
          <Alert type="info" message="Invoice will be generated and emailed on the scheduled date." />
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
function InvoiceHistorySection({ invoices, onRefresh }) {
  const [loading, setLoading] = useState({});
  const [alert, setAlert] = useState({ type: '', message: '' });

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
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(prev => ({ ...prev, [`${id}-${format}`]: false }));
  };

  const handleSend = async (id, email) => {
    if (!window.confirm(`Send invoice to ${email}?`)) return;
    setLoading(prev => ({ ...prev, [id]: 'send' }));
    try {
      const result = await api.sendInvoice(id);
      if (result.error) throw new Error(result.error);
      setAlert({ type: 'success', message: result.message });
      onRefresh();
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(prev => ({ ...prev, [id]: null }));
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Invoice History</h2>
      </div>

      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {invoices.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <p>No invoices generated yet. Create your first invoice above.</p>
        </div>
      ) : (
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
              {invoices.map(inv => (
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
                        className="btn btn-sm"
                        onClick={() => handleDownload(inv.id, inv.invoice_number, 'pdf')}
                        disabled={loading[`${inv.id}-pdf`]}
                        title="Download PDF"
                        style={{ padding: '0.375rem 0.5rem', background: '#fee2e2', color: '#dc2626' }}
                      >
                        {loading[`${inv.id}-pdf`] ? '...' : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <path d="M9 15h6"/>
                            <path d="M12 18v-6"/>
                          </svg>
                        )}
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleDownload(inv.id, inv.invoice_number, 'docx')}
                        disabled={loading[`${inv.id}-docx`]}
                        title="Download DOCX"
                        style={{ padding: '0.375rem 0.5rem', background: '#dbeafe', color: '#2563eb' }}
                      >
                        {loading[`${inv.id}-docx`] ? '...' : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <line x1="10" y1="9" x2="8" y2="9"/>
                          </svg>
                        )}
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleSend(inv.id, inv.email)}
                        disabled={loading[inv.id]}
                        title="Send via Email"
                        style={{ padding: '0.375rem 0.5rem', background: '#d1fae5', color: '#059669' }}
                      >
                        {loading[inv.id] === 'send' ? '...' : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
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
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [schedulerRunning, setSchedulerRunning] = useState(false);

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
      setAlert({ type: 'success', message: 'Email settings saved!' });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const result = await api.verifyEmailConfig();
      setAlert({ type: result.configured ? 'success' : 'error', message: result.message });
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(false);
  };

  const toggleScheduler = async () => {
    setLoading(true);
    try {
      if (schedulerRunning) {
        await api.stopScheduler();
        setSchedulerRunning(false);
        setAlert({ type: 'info', message: 'Scheduler stopped' });
      } else {
        await api.startScheduler();
        setSchedulerRunning(true);
        setAlert({ type: 'success', message: 'Scheduler started' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: error.message });
    }
    setLoading(false);
  };

  return (
    <>
      <Alert type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />
      
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
          The scheduler automatically processes pending scheduled invoices daily at 8:00 AM.
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

// Main App Component
function App() {
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
                <InvoiceHistorySection invoices={invoices.slice(0, 5)} onRefresh={loadData} />
              </>
            )}
            {activeTab === 'firms' && (
              <FirmsSection firms={firms} onRefresh={loadData} />
            )}
            {activeTab === 'scheduled' && (
              <ScheduledSection firms={firms} scheduled={scheduled} onRefresh={loadData} />
            )}
            {activeTab === 'history' && (
              <InvoiceHistorySection invoices={invoices} onRefresh={loadData} />
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

export default App;
