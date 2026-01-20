import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';

// API base URL - empty for same-origin requests on Vercel
const API_BASE = '';

// Confirmation Dialog Context
const ConfirmContext = createContext();

function ConfirmProvider({ children }) {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'warning', // 'warning', 'danger', 'info'
    requireInput: null, // If set, user must type this exact text to confirm
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [inputValue, setInputValue] = useState('');

  const confirm = useCallback(({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning', requireInput = null }) => {
    return new Promise((resolve) => {
      setInputValue('');
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        requireInput,
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          setInputValue('');
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          setInputValue('');
          resolve(false);
        }
      });
    });
  }, []);

  const isConfirmDisabled = confirmState.requireInput && inputValue.trim() !== confirmState.requireInput.trim();

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState.isOpen && (
        <div className="modal-overlay" onClick={confirmState.onCancel}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className={`confirm-icon confirm-icon-${confirmState.type}`}>
              {confirmState.type === 'danger' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
              {confirmState.type === 'warning' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              )}
              {confirmState.type === 'info' && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              )}
            </div>
            <h3 className="confirm-title">{confirmState.title}</h3>
            <p className="confirm-message">{confirmState.message}</p>
            {confirmState.requireInput && (
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                  Type <strong style={{ color: '#dc2626' }}>{confirmState.requireInput}</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={confirmState.requireInput}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box'
                  }}
                  autoFocus
                />
              </div>
            )}
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={confirmState.onCancel}>
                {confirmState.cancelText}
              </button>
              <button
                className={`btn ${confirmState.type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
                onClick={confirmState.onConfirm}
                disabled={isConfirmDisabled}
                style={isConfirmDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}

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
              {toast.type === 'warning' && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
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

// Authentication Context
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('judy_token'));
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check localStorage first (remember me), then sessionStorage
      const storedToken = localStorage.getItem('judy_token') || sessionStorage.getItem('judy_token');
      if (storedToken) {
        try {
          const response = await fetch(`${API_BASE}/api/auth?action=me`, {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token invalid, clear it
            localStorage.removeItem('judy_token');
            sessionStorage.removeItem('judy_token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('judy_token');
          sessionStorage.removeItem('judy_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const response = await fetch(`${API_BASE}/api/auth?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok) {
      if (rememberMe) {
        localStorage.setItem('judy_token', data.token);
        localStorage.setItem('judy_remember', 'true');
      } else {
        sessionStorage.setItem('judy_token', data.token);
        localStorage.removeItem('judy_token');
        localStorage.removeItem('judy_remember');
      }
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data.error };
  };

  const logout = () => {
    localStorage.removeItem('judy_token');
    localStorage.removeItem('judy_remember');
    sessionStorage.removeItem('judy_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
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

  .nav-btn {
    position: relative;
  }

  .nav-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    font-size: 0.7rem;
    font-weight: 600;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: badgePulse 2s ease-in-out infinite;
  }

  .nav-badge-danger {
    background: #dc2626;
    color: white;
    box-shadow: 0 0 8px rgba(220, 38, 38, 0.5);
  }

  .nav-badge-warning {
    background: #f59e0b;
    color: white;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
  }

  @keyframes badgePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .nav-divider {
    height: 1px;
    background: rgba(255,255,255,0.2);
    margin: 0.5rem 0;
  }

  .nav-user {
    padding-top: 0.5rem;
  }

  .nav-user-email {
    display: block;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.7);
    padding: 0 0.75rem;
    margin-bottom: 0.5rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nav-logout {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: rgba(255,255,255,0.9);
  }

  .nav-logout:hover {
    background: rgba(220, 38, 38, 0.3) !important;
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

  /* Highlight animation for table rows */
  .highlight-row {
    animation: highlightPulse 2s ease-in-out;
  }

  @keyframes highlightPulse {
    0% { background-color: #fef3c7; }
    25% { background-color: #fde68a; }
    50% { background-color: #fef3c7; }
    75% { background-color: #fde68a; }
    100% { background-color: transparent; }
  }

  .badge {
    display: inline-block;
    padding: 0.25rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    width: fit-content;
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
    animation: statusPulse 2s ease-in-out infinite;
  }

  .badge-gray {
    background: #f1f5f9;
    color: #64748b;
  }

  .badge-red {
    background: #fee2e2;
    color: #dc2626;
    animation: statusPulse 1.5s ease-in-out infinite;
  }

  .badge-active {
    background: #d1fae5;
    color: #047857;
    border: 1px solid #10b981;
  }

  @keyframes statusPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.02); }
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

  .alert-danger {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .alert-warning {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
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

  /* Dashboard Styles */
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .dashboard-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1rem;
  }

  .dashboard-stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: flex-start;
    gap: 1rem;
  }

  .dashboard-stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dashboard-stat-content {
    flex: 1;
    min-width: 0;
  }

  .dashboard-stat-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    margin-bottom: 0.25rem;
  }

  .dashboard-stat-value {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.2;
  }

  .dashboard-stat-sub {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.25rem;
  }

  .dashboard-revenue-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }

  .dashboard-revenue-card {
    text-align: center;
    padding: 1.5rem !important;
  }

  .dashboard-revenue-title {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.75rem;
    font-weight: 500;
  }

  .dashboard-revenue-amount {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1e40af;
    margin-bottom: 0.25rem;
  }

  .dashboard-revenue-usd {
    font-size: 0.875rem;
    color: #64748b;
  }

  .dashboard-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    padding: 0.5rem 0;
  }

  .dashboard-action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 1.25rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
    transition: all 0.2s;
  }

  .dashboard-action-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e40af;
  }

  .dashboard-action-btn svg {
    color: #64748b;
  }

  .dashboard-action-btn:hover svg {
    color: #1e40af;
  }

  .dashboard-alerts {
    padding-bottom: 0 !important;
  }

  .dashboard-alert {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }

  .dashboard-alert:last-child {
    margin-bottom: 1rem;
  }

  .dashboard-alert-danger {
    background: #fef2f2;
    border: 1px solid #fecaca;
  }

  .dashboard-alert-warning {
    background: #fffbeb;
    border: 1px solid #fde68a;
  }

  .dashboard-alert-icon {
    flex-shrink: 0;
  }

  .dashboard-alert-danger .dashboard-alert-icon {
    color: #dc2626;
  }

  .dashboard-alert-warning .dashboard-alert-icon {
    color: #d97706;
  }

  .dashboard-alert-content {
    flex: 1;
    min-width: 0;
  }

  .dashboard-alert-content strong {
    display: block;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .dashboard-alert-content p {
    font-size: 0.75rem;
    color: #64748b;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    bottom: 1rem;
    right: 1rem;
    z-index: 2000;
    display: flex;
    flex-direction: column-reverse;
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
      transform: translateY(100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
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

  .toast-warning {
    background: #fef3c7;
    color: #92400e;
    border-left: 4px solid #f59e0b;
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

  .action-btn-paid { background: #ddd6fe; color: #7c3aed; }
  .action-btn-paid:hover:not(:disabled) { background: #c4b5fd; }

  .action-btn-unpaid { background: #fef3c7; color: #b45309; }
  .action-btn-unpaid:hover:not(:disabled) { background: #fde68a; }

  /* Selected Row */
  .selected-row {
    background-color: #eff6ff !important;
  }
  .selected-row:hover {
    background-color: #dbeafe !important;
  }

  /* Delete Button */
  .btn-danger {
    padding: 0.5rem 1rem;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .btn-danger:hover:not(:disabled) {
    background: #b91c1c;
  }
  .btn-danger:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Improved Empty State */
  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #64748b;
    animation: emptyStateIn 0.5s ease-out;
  }

  @keyframes emptyStateIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .empty-state-icon {
    font-size: 4rem;
    margin-bottom: 1.5rem;
    opacity: 0.9;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100px;
    height: 100px;
    background: linear-gradient(135deg, #f3e8ff 0%, #dbeafe 100%);
    border-radius: 50%;
    animation: iconFloat 3s ease-in-out infinite;
  }

  @keyframes iconFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .empty-state-icon.search-icon {
    background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
  }

  .empty-state-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.75rem;
  }

  .empty-state-description {
    font-size: 0.9rem;
    color: #64748b;
    margin-bottom: 1.75rem;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.6;
  }

  .empty-state-action {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
  }

  .empty-state-action:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(156, 39, 176, 0.4);
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

  /* Export dropdown */
  .export-dropdown {
    position: relative;
  }

  .export-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    min-width: 240px;
    z-index: 50;
    overflow: hidden;
  }

  .export-menu-item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
  }

  .export-menu-item:hover {
    background: #f3f4f6;
  }

  .export-menu-item:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
  }

  .export-menu-item svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: #6b7280;
  }

  .export-menu-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .export-menu-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
  }

  .export-menu-desc {
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Confirmation Dialog */
  .confirm-dialog {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    max-width: 400px;
    width: 90%;
    text-align: center;
    animation: scaleIn 0.2s ease-out;
  }

  .confirm-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1rem;
  }

  .confirm-icon-danger {
    background: #fee2e2;
    color: #dc2626;
  }

  .confirm-icon-warning {
    background: #fef3c7;
    color: #d97706;
  }

  .confirm-icon-info {
    background: #dbeafe;
    color: #2563eb;
  }

  .confirm-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.5rem;
  }

  .confirm-message {
    color: #64748b;
    font-size: 0.875rem;
    margin-bottom: 1.5rem;
    line-height: 1.5;
  }

  .confirm-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .confirm-actions .btn {
    min-width: 100px;
  }

  /* Success Animation */
  .success-animation-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.3s ease-out;
  }

  .success-animation-content {
    background: white;
    border-radius: 20px;
    padding: 3rem;
    text-align: center;
    animation: successBounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .success-checkmark {
    margin-bottom: 1.5rem;
  }

  .success-checkmark svg {
    filter: drop-shadow(0 4px 6px rgba(16, 185, 129, 0.3));
  }

  .success-circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    animation: successCircle 0.6s ease-in-out forwards;
  }

  .success-check {
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    animation: successCheck 0.3s ease-in-out 0.6s forwards;
  }

  @keyframes successCircle {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes successCheck {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes successBounceIn {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }
    50% {
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .success-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #10b981;
    margin-bottom: 0.5rem;
  }

  .success-subtitle {
    color: #6b7280;
    font-size: 1rem;
  }

  /* Tooltip */
  .tooltip-wrapper {
    position: relative;
    display: inline-flex;
  }

  .tooltip-wrapper .tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
    z-index: 1000;
    margin-bottom: 0.5rem;
    pointer-events: none;
  }

  .tooltip-wrapper .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #1e293b;
  }

  .tooltip-wrapper:hover .tooltip {
    opacity: 1;
    visibility: visible;
  }

  /* Due Date Badges */
  .badge-overdue {
    background: #fee2e2;
    color: #dc2626;
    animation: pulse 2s infinite;
  }

  .badge-due-soon {
    background: #fef3c7;
    color: #d97706;
  }

  .badge-due-later {
    background: #d1fae5;
    color: #059669;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* Button with spinner */
  .btn-loading {
    position: relative;
    color: transparent !important;
  }

  .btn-loading .btn-spinner {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .btn-loading.btn-secondary .btn-spinner {
    border-color: rgba(0,0,0,0.2);
    border-top-color: #475569;
  }

  /* Form Validation */
  .form-group.has-error input,
  .form-group.has-error select {
    border-color: #dc2626;
    background: #fef2f2;
  }

  .form-group.has-error input:focus,
  .form-group.has-error select:focus {
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  .form-error {
    color: #dc2626;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .form-group.has-success input,
  .form-group.has-success select {
    border-color: #059669;
  }

  /* Inline Editing */
  .inline-edit-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .inline-edit-input {
    padding: 0.25rem 0.5rem;
    border: 1px solid #3b82f6;
    border-radius: 4px;
    font-size: 0.875rem;
    width: 100%;
    min-width: 80px;
  }

  .inline-edit-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }

  .inline-edit-actions {
    display: flex;
    gap: 0.25rem;
  }

  .inline-edit-btn {
    padding: 0.25rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .inline-edit-btn-save {
    background: #d1fae5;
    color: #059669;
  }

  .inline-edit-btn-cancel {
    background: #fee2e2;
    color: #dc2626;
  }

  /* Responsive Design */
  .mobile-menu-btn {
    display: none;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .mobile-menu-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 768px) {
    .header-content {
      flex-wrap: wrap;
      gap: 1rem;
    }

    .mobile-menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav {
      display: none;
      width: 100%;
      flex-direction: column;
      gap: 0.25rem;
    }

    .nav.nav-open {
      display: flex;
    }

    .nav-btn {
      width: 100%;
      text-align: left;
      padding: 0.75rem 1rem;
    }

    .main {
      padding: 1rem;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .dashboard-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .dashboard-stat-card {
      padding: 1rem;
    }

    .dashboard-stat-icon {
      width: 40px;
      height: 40px;
    }

    .dashboard-stat-value {
      font-size: 1.5rem;
    }

    .dashboard-revenue-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-actions {
      grid-template-columns: repeat(2, 1fr);
    }

    .dashboard-alert {
      flex-wrap: wrap;
    }

    .dashboard-alert-content {
      flex: 1 1 100%;
      order: 2;
      margin-top: 0.5rem;
    }

    .dashboard-alert .btn {
      order: 3;
      margin-left: auto;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .card {
      padding: 1rem;
    }

    .card-header {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }

    .search-filter-bar {
      flex-direction: column;
    }

    .search-input-wrapper {
      max-width: 100%;
    }

    .filter-select {
      width: 100%;
    }

    .table-container {
      font-size: 0.8rem;
    }

    th, td {
      padding: 0.5rem;
    }

    .action-buttons {
      flex-direction: column;
    }

    .modal {
      max-width: 95%;
      margin: 0.5rem;
    }

    .modal-body {
      padding: 1rem;
    }

    .pagination {
      flex-wrap: wrap;
    }

    .pagination-btn {
      padding: 0.375rem 0.5rem;
      font-size: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-stats-grid {
      grid-template-columns: 1fr;
    }

    .dashboard-actions {
      grid-template-columns: 1fr;
    }

    .dashboard-action-btn {
      flex-direction: row;
      justify-content: flex-start;
      padding: 1rem;
    }

    .logo h1 {
      font-size: 1.25rem;
    }

    .logo span {
      font-size: 0.75rem;
    }

    .confirm-actions {
      flex-direction: column;
    }

    .confirm-actions .btn {
      width: 100%;
    }
  }

  /* Keyboard shortcut hints */
  .shortcut-hint {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.625rem;
    color: rgba(255,255,255,0.7);
    margin-left: 0.5rem;
  }

  .shortcut-key {
    background: rgba(255,255,255,0.2);
    padding: 0.125rem 0.375rem;
    border-radius: 3px;
    font-family: monospace;
  }

  @media (max-width: 768px) {
    .shortcut-hint {
      display: none;
    }
  }

  /* Login Page Styles */
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%);
    padding: 1rem;
    position: relative;
    overflow: hidden;
  }

  .login-container::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
    animation: pulse 15s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.1); opacity: 0.3; }
  }

  .login-card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
    width: 100%;
    max-width: 420px;
    padding: 2.5rem;
    position: relative;
    z-index: 1;
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 90px;
    height: 90px;
    background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
    border-radius: 50%;
    margin-bottom: 1.25rem;
    box-shadow: 0 8px 20px rgba(156, 39, 176, 0.2);
  }

  .login-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 0.5rem;
  }

  .login-subtitle {
    color: #718096;
    font-size: 0.95rem;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .login-form .form-group label {
    color: #4a5568;
    font-weight: 600;
    font-size: 0.875rem;
  }

  .login-form .form-group input {
    border: 2px solid #e2e8f0;
    padding: 0.875rem 1rem;
    font-size: 1rem;
    transition: all 0.2s;
  }

  .login-form .form-group input:focus {
    border-color: #9C27B0;
    box-shadow: 0 0 0 3px rgba(156, 39, 176, 0.1);
  }

  .login-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 10px;
    font-size: 0.875rem;
  }

  .login-success {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    background: #dcfce7;
    color: #16a34a;
    border-radius: 10px;
    font-size: 0.875rem;
  }

  .login-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.5rem;
  }

  .login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(156, 39, 176, 0.4);
  }

  .login-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .login-btn-secondary {
    background: transparent;
    color: #9C27B0;
    border: 2px solid #9C27B0;
    margin-top: 0.75rem;
  }

  .login-btn-secondary:hover:not(:disabled) {
    background: rgba(156, 39, 176, 0.05);
    box-shadow: none;
    transform: none;
  }

  .remember-me {
    display: flex;
    align-items: center;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.875rem;
    color: #4a5568;
    user-select: none;
  }

  .checkbox-label input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkbox-custom {
    position: relative;
    width: 18px;
    height: 18px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .checkbox-label:hover .checkbox-custom {
    border-color: #9C27B0;
  }

  .checkbox-label input:checked ~ .checkbox-custom {
    background: #9C27B0;
    border-color: #9C27B0;
  }

  .checkbox-label input:checked ~ .checkbox-custom::after {
    content: '';
    position: absolute;
    left: 5px;
    top: 1px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .login-link {
    text-align: center;
    margin-top: 1rem;
  }

  .login-link button {
    background: none;
    border: none;
    color: #9C27B0;
    font-size: 0.875rem;
    cursor: pointer;
    text-decoration: underline;
    font-weight: 500;
  }

  .login-link button:hover {
    color: #7B1FA2;
  }

  .login-footer {
    margin-top: 2rem;
    text-align: center;
    color: #a0aec0;
    font-size: 0.875rem;
  }

  .login-footer p {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  /* User menu in sidebar */
  .user-menu {
    padding: 1rem;
    border-top: 1px solid rgba(255,255,255,0.1);
    margin-top: auto;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .user-details {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 0.875rem;
    font-weight: 500;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-email {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.7);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem;
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.9);
    border: none;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .logout-btn:hover {
    background: rgba(255,255,255,0.2);
  }
`;

// API Functions - Using query parameters for Vercel Hobby plan compatibility
// Helper to get auth headers
const getAuthHeaders = () => {
  // Check both localStorage (remember me) and sessionStorage (session only)
  const token = localStorage.getItem('judy_token') || sessionStorage.getItem('judy_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const authFetch = (url, options = {}) => {
  const headers = {
    ...options.headers,
    ...getAuthHeaders()
  };
  return fetch(url, { ...options, headers });
};

const api = {
  // Firms
  getFirms: () => authFetch(`${API_BASE}/api/firms`).then(r => r.json()),
  getFirm: (id) => authFetch(`${API_BASE}/api/firms?id=${id}`).then(r => r.json()),
  createFirm: (data) => authFetch(`${API_BASE}/api/firms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  updateFirm: (id, data) => authFetch(`${API_BASE}/api/firms?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteFirm: (id) => authFetch(`${API_BASE}/api/firms?id=${id}`, { method: 'DELETE' }).then(r => r.json()),

  // Invoices
  getInvoices: () => authFetch(`${API_BASE}/api/invoices`).then(r => r.json()),
  getNextInvoiceNumber: () => authFetch(`${API_BASE}/api/invoices?action=next-number`).then(r => r.json()),
  previewInvoice: (data) => authFetch(`${API_BASE}/api/invoices?action=preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  generateInvoice: async (data, format = 'docx') => {
    const response = await authFetch(`${API_BASE}/api/invoices?action=generate&format=${format}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to generate invoice');
    const blob = await response.blob();
    const invoiceNumber = response.headers.get('X-Invoice-Number');
    return { blob, invoiceNumber, format };
  },
  generateAndSendInvoice: (data) => authFetch(`${API_BASE}/api/invoices?action=generate-and-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  sendInvoice: (id) => authFetch(`${API_BASE}/api/invoices?action=send&id=${id}`, { method: 'POST' }).then(r => r.json()),
  markInvoicePaid: (id) => authFetch(`${API_BASE}/api/invoices?action=mark-paid&id=${id}`, { method: 'POST' }).then(r => r.json()),
  markInvoiceUnpaid: (id) => authFetch(`${API_BASE}/api/invoices?action=mark-unpaid&id=${id}`, { method: 'POST' }).then(r => r.json()),
  deleteInvoice: (id) => authFetch(`${API_BASE}/api/invoices?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
  updateDraftInvoice: (id, data) => authFetch(`${API_BASE}/api/invoices?action=update-draft&id=${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteInvoices: (ids) => authFetch(`${API_BASE}/api/invoices?action=delete-bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  }).then(r => r.json()),
  downloadInvoice: async (id, format = 'pdf') => {
    const response = await authFetch(`${API_BASE}/api/invoices?action=download&id=${id}&format=${format}`);
    if (!response.ok) throw new Error('Failed to download invoice');
    return response.blob();
  },
  emailAccountant: () => authFetch(`${API_BASE}/api/invoices?action=email-accountant`, { method: 'POST' }).then(r => r.json()),

  // Scheduled
  getScheduled: () => authFetch(`${API_BASE}/api/scheduled`).then(r => r.json()),
  createScheduled: (data) => authFetch(`${API_BASE}/api/scheduled`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteScheduled: (id) => authFetch(`${API_BASE}/api/scheduled?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
  clearCompletedScheduled: () => authFetch(`${API_BASE}/api/scheduled?action=clear-completed`, { method: 'DELETE' }).then(r => r.json()),
  processScheduled: () => authFetch(`${API_BASE}/api/scheduled?action=process`, { method: 'POST' }).then(r => r.json()),
  processScheduledSingle: (id) => authFetch(`${API_BASE}/api/scheduled?action=process&id=${id}`, { method: 'POST' }).then(r => r.json()),

  // Email Config
  getEmailConfig: () => authFetch(`${API_BASE}/api/email-config`).then(r => r.json()),
  updateEmailConfig: (data) => authFetch(`${API_BASE}/api/email-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(r => r.json()),
  verifyEmailConfig: () => authFetch(`${API_BASE}/api/email-config?action=verify`).then(r => r.json()),

  // Scheduler
  getSchedulerStatus: () => authFetch(`${API_BASE}/api/scheduler`).then(r => r.json()),
  startScheduler: () => authFetch(`${API_BASE}/api/scheduler?action=start`, { method: 'POST' }).then(r => r.json()),
  stopScheduler: () => authFetch(`${API_BASE}/api/scheduler?action=stop`, { method: 'POST' }).then(r => r.json()),
};

// Format currency
const formatCurrency = (amount) => {
  return `GHS ${Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  // Parse date parts to avoid timezone issues with YYYY-MM-DD format
  const [year, month, day] = dateStr.split('T')[0].split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get due date status and class
const getDueDateStatus = (dueDate) => {
  if (!dueDate) return { class: '', label: '' };
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { class: 'badge-overdue', label: `${Math.abs(diffDays)} days overdue` };
  } else if (diffDays === 0) {
    return { class: 'badge-overdue', label: 'Due today' };
  } else if (diffDays <= 7) {
    return { class: 'badge-due-soon', label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}` };
  } else {
    return { class: 'badge-due-later', label: `Due in ${diffDays} days` };
  }
};

// Get subscription status (expiring, expired, or OK)
const getSubscriptionStatus = (subscriptionEnd) => {
  if (!subscriptionEnd) return { class: 'badge-gray', label: 'No subscription', status: 'none' };
  const end = new Date(subscriptionEnd);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { class: 'badge-red', label: `Expired ${Math.abs(diffDays)}d ago`, status: 'expired', days: Math.abs(diffDays) };
  } else if (diffDays <= 7) {
    return { class: 'badge-red', label: `${diffDays}d left!`, status: 'critical', days: diffDays };
  } else if (diffDays <= 30) {
    return { class: 'badge-yellow', label: `${diffDays}d left`, status: 'expiring', days: diffDays };
  } else {
    return { class: 'badge-active', label: 'Active', status: 'ok', days: diffDays };
  }
};

// Tooltip Component
function Tooltip({ children, text }) {
  return (
    <span className="tooltip-wrapper">
      {children}
      <span className="tooltip">{text}</span>
    </span>
  );
}

// Button with Loading State Component
function LoadingButton({ children, loading, className = '', ...props }) {
  return (
    <button
      className={`${className} ${loading ? 'btn-loading' : ''}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {children}
      {loading && <span className="btn-spinner" />}
    </button>
  );
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
function FirmsSection({ firms, onRefresh, isLoading, highlightFirmIds = [] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingFirm, setEditingFirm] = useState(null);
  const [formData, setFormData] = useState({
    firm_name: '',
    street_address: '',
    city: '',
    email: '',
    cc_emails: '',
    bcc_emails: '',
    include_default_bcc: true,
    plan_type: 'standard',
    plan_duration: '12 months',
    num_users: 1,
    subscription_start: '',
    subscription_end: '',
    base_price: 0
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [errors, setErrors] = useState({});
  const [inlineEdit, setInlineEdit] = useState({ id: null, field: null, value: '' });
  const { addToast } = useToast();
  const confirm = useConfirm();
  const firmRowRefs = useRef({});

  // Scroll to highlighted firms when they change
  useEffect(() => {
    if (highlightFirmIds.length > 0) {
      // Scroll to the first highlighted firm
      const firstFirmId = highlightFirmIds[0];
      const rowElement = firmRowRefs.current[firstFirmId];
      if (rowElement) {
        setTimeout(() => {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [highlightFirmIds]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.firm_name.trim()) {
      newErrors.firm_name = 'Firm name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.street_address.trim()) {
      newErrors.street_address = 'Street address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (formData.base_price < 0) {
      newErrors.base_price = 'Price cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time field validation
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    switch (field) {
      case 'firm_name':
        if (!value.trim()) newErrors.firm_name = 'Firm name is required';
        else delete newErrors.firm_name;
        break;
      case 'email':
        if (!value.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = 'Invalid email format';
        else delete newErrors.email;
        break;
      case 'street_address':
        if (!value.trim()) newErrors.street_address = 'Street address is required';
        else delete newErrors.street_address;
        break;
      case 'city':
        if (!value.trim()) newErrors.city = 'City is required';
        else delete newErrors.city;
        break;
      default:
        break;
    }
    setErrors(newErrors);
  };

  // Filter firms based on search and plan filter
  const filteredFirms = firms.filter(firm => {
    const matchesSearch = firm.firm_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         firm.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         firm.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === 'all' || firm.plan_type === planFilter;
    return matchesSearch && matchesPlan;
  });

  const handleOpenModal = (firm = null) => {
    setErrors({});
    if (firm) {
      setEditingFirm(firm);
      setFormData({
        firm_name: firm.firm_name || '',
        street_address: firm.street_address || '',
        city: firm.city || '',
        email: firm.email || '',
        cc_emails: firm.cc_emails || '',
        bcc_emails: firm.bcc_emails || '',
        include_default_bcc: firm.include_default_bcc !== false,
        plan_type: firm.plan_type || 'standard',
        plan_duration: firm.plan_duration || '12 months',
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
        cc_emails: '',
        bcc_emails: '',
        include_default_bcc: true,
        plan_type: 'standard',
        plan_duration: '12 months',
        num_users: 1,
        subscription_start: '',
        subscription_end: '',
        base_price: 0
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      addToast('Please fix the errors in the form', 'error');
      return;
    }
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

  const handleDelete = async (id, firmName) => {
    const confirmed = await confirm({
      title: 'Delete Law Firm',
      message: `Are you sure you want to delete "${firmName}"? This will permanently remove the firm and cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      requireInput: firmName
    });
    if (!confirmed) return;
    try {
      await api.deleteFirm(id);
      addToast('Firm deleted successfully!', 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
  };

  // Inline editing handlers
  const startInlineEdit = (id, field, value) => {
    setInlineEdit({ id, field, value });
  };

  const cancelInlineEdit = () => {
    setInlineEdit({ id: null, field: null, value: '' });
  };

  const saveInlineEdit = async (firm) => {
    if (!inlineEdit.value.trim()) {
      addToast('Field cannot be empty', 'error');
      return;
    }
    try {
      await api.updateFirm(firm.id, { ...firm, [inlineEdit.field]: inlineEdit.value });
      addToast('Updated successfully!', 'success');
      cancelInlineEdit();
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
            <div className="empty-state-icon search-icon">🔍</div>
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
                  <th>Plan</th>
                  <th>Users</th>
                  <th style={{ minWidth: '140px' }}>Subscription End</th>
                  <th>Address</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFirms.map(firm => (
                  <tr
                    key={firm.id}
                    ref={el => firmRowRefs.current[firm.id] = el}
                    className={highlightFirmIds.includes(firm.id) ? 'highlight-row' : ''}
                  >
                    {/* Firm Name */}
                    <td>
                      {inlineEdit.id === firm.id && inlineEdit.field === 'firm_name' ? (
                        <div className="inline-edit-cell">
                          <input
                            className="inline-edit-input"
                            value={inlineEdit.value}
                            onChange={e => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveInlineEdit(firm);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            autoFocus
                          />
                          <div className="inline-edit-actions">
                            <button className="inline-edit-btn inline-edit-btn-save" onClick={() => saveInlineEdit(firm)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </button>
                            <button className="inline-edit-btn inline-edit-btn-cancel" onClick={cancelInlineEdit}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <strong
                          onClick={() => startInlineEdit(firm.id, 'firm_name', firm.firm_name)}
                          style={{ cursor: 'pointer' }}
                          title="Click to edit"
                        >
                          {firm.firm_name}
                        </strong>
                      )}
                    </td>
                    {/* Plan */}
                    <td>
                      <span className={`badge ${firm.plan_type === 'plus' ? 'badge-blue' : 'badge-gray'}`}>
                        {firm.plan_type === 'plus' ? 'Plus' : 'Standard'}
                      </span>
                    </td>
                    {/* Users */}
                    <td>{firm.num_users}</td>
                    {/* Subscription End */}
                    <td>
                      {(() => {
                        const subStatus = getSubscriptionStatus(firm.subscription_end);
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span>{formatDate(firm.subscription_end)}</span>
                            <span className={`badge ${subStatus.class}`} style={{ fontSize: '0.65rem' }}>
                              {subStatus.label}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    {/* Address */}
                    <td>{firm.street_address}, {firm.city}</td>
                    {/* Email */}
                    <td>
                      {inlineEdit.id === firm.id && inlineEdit.field === 'email' ? (
                        <div className="inline-edit-cell">
                          <input
                            className="inline-edit-input"
                            type="email"
                            value={inlineEdit.value}
                            onChange={e => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveInlineEdit(firm);
                              if (e.key === 'Escape') cancelInlineEdit();
                            }}
                            autoFocus
                          />
                          <div className="inline-edit-actions">
                            <button className="inline-edit-btn inline-edit-btn-save" onClick={() => saveInlineEdit(firm)}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </button>
                            <button className="inline-edit-btn inline-edit-btn-cancel" onClick={cancelInlineEdit}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span
                          onClick={() => startInlineEdit(firm.id, 'email', firm.email)}
                          style={{ cursor: 'pointer' }}
                          title="Click to edit"
                        >
                          {firm.email}
                        </span>
                      )}
                    </td>
                    {/* Actions */}
                    <td>
                      <div className="action-buttons">
                        <Tooltip text="Edit all firm details">
                          <button className="action-btn action-btn-edit" onClick={() => handleOpenModal(firm)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                        </Tooltip>
                        <Tooltip text="Delete this firm">
                          <button className="action-btn action-btn-delete" onClick={() => handleDelete(firm.id, firm.firm_name)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </Tooltip>
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
            <div className={`form-group ${errors.firm_name ? 'has-error' : formData.firm_name ? 'has-success' : ''}`}>
              <label>Firm Name *</label>
              <input
                type="text"
                value={formData.firm_name}
                onChange={e => {
                  setFormData({ ...formData, firm_name: e.target.value });
                  validateField('firm_name', e.target.value);
                }}
                placeholder="e.g., ENS Africa"
              />
              {errors.firm_name && <div className="form-error">{errors.firm_name}</div>}
            </div>
            <div className={`form-group ${errors.email ? 'has-error' : formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? 'has-success' : ''}`}>
              <label>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => {
                  setFormData({ ...formData, email: e.target.value });
                  validateField('email', e.target.value);
                }}
                placeholder="e.g., billing@ensafrica.com"
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>CC Emails</label>
              <input
                type="text"
                value={formData.cc_emails}
                onChange={e => setFormData({ ...formData, cc_emails: e.target.value })}
                placeholder="e.g., accounts@firm.com, finance@firm.com (comma-separated)"
              />
              <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                Additional email addresses to CC on invoices (comma-separated)
              </small>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>BCC Emails</label>
              <input
                type="text"
                value={formData.bcc_emails}
                onChange={e => setFormData({ ...formData, bcc_emails: e.target.value })}
                placeholder="e.g., records@firm.com (comma-separated)"
              />
              <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                Additional email addresses to BCC on invoices (comma-separated)
              </small>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.include_default_bcc}
                  onChange={e => setFormData({ ...formData, include_default_bcc: e.target.checked })}
                  style={{ width: 'auto', margin: 0 }}
                />
                Include hello@judy.legal in BCC
              </label>
              <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                JUDY will receive a copy of all invoices sent to this firm
              </small>
            </div>
            <div className={`form-group ${errors.street_address ? 'has-error' : formData.street_address ? 'has-success' : ''}`}>
              <label>Street Address *</label>
              <input
                type="text"
                value={formData.street_address}
                onChange={e => {
                  setFormData({ ...formData, street_address: e.target.value });
                  validateField('street_address', e.target.value);
                }}
                placeholder="e.g., 4th Floor, Heritage Tower"
              />
              {errors.street_address && <div className="form-error">{errors.street_address}</div>}
            </div>
            <div className={`form-group ${errors.city ? 'has-error' : formData.city ? 'has-success' : ''}`}>
              <label>City *</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => {
                  setFormData({ ...formData, city: e.target.value });
                  validateField('city', e.target.value);
                }}
                placeholder="e.g., Accra, Ghana"
              />
              {errors.city && <div className="form-error">{errors.city}</div>}
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
              <label>Plan Duration</label>
              <select
                value={formData.plan_duration}
                onChange={e => setFormData({ ...formData, plan_duration: e.target.value })}
              >
                <option value="1 month">1 Month</option>
                <option value="3 months">3 Months</option>
                <option value="6 months">6 Months</option>
                <option value="12 months">12 Months</option>
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
            <div className={`form-group ${errors.base_price ? 'has-error' : ''}`}>
              <label>Base Price (GHS)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.base_price}
                onChange={e => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
              />
              {errors.base_price && <div className="form-error">{errors.base_price}</div>}
            </div>
            <div className="form-group">
              <label>Subscription Start</label>
              <input
                type="date"
                value={formData.subscription_start}
                onChange={e => setFormData({ ...formData, subscription_start: e.target.value })}
              />
              {formData.subscription_start && <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>{formatDate(formData.subscription_start)}</small>}
            </div>
            <div className="form-group">
              <label>Subscription End</label>
              <input
                type="date"
                value={formData.subscription_end}
                onChange={e => setFormData({ ...formData, subscription_end: e.target.value })}
              />
              {formData.subscription_end && <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>{formatDate(formData.subscription_end)}</small>}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
          <LoadingButton className="btn btn-primary" onClick={handleSave} loading={loading}>
            {editingFirm ? 'Update' : 'Add Firm'}
          </LoadingButton>
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
  const [loadingAction, setLoadingAction] = useState(null); // 'preview', 'pdf', 'docx', 'send'
  const [additionalEmails, setAdditionalEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const { addToast } = useToast();
  const confirm = useConfirm();

  // Get selected firm's email
  const selectedFirm = formData.firmId ? firms.find(f => f.id === parseInt(formData.firmId)) : null;

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email) return;

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (selectedFirm && email === selectedFirm.email.toLowerCase()) {
      setEmailError('This is already the primary recipient');
      return;
    }

    if (additionalEmails.includes(email)) {
      setEmailError('This email is already added');
      return;
    }

    setAdditionalEmails([...additionalEmails, email]);
    setNewEmail('');
    setEmailError('');
  };

  const handleRemoveEmail = (emailToRemove) => {
    setAdditionalEmails(additionalEmails.filter(e => e !== emailToRemove));
  };

  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  useEffect(() => {
    // Set default due date to today (manual invoices are due same day)
    const date = new Date();
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
    setLoadingAction('preview');
    try {
      const data = await api.previewInvoice(formData);
      setPreview(data);
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoadingAction(null);
  };

  const handleDownload = async (format = 'docx') => {
    if (!formData.firmId) {
      addToast('Please select a law firm', 'error');
      return;
    }
    setLoadingAction(format);
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
    setLoadingAction(null);
  };

  const handleSend = async () => {
    if (!formData.firmId) {
      addToast('Please select a law firm', 'error');
      return;
    }
    // Include firm's stored CC emails in the recipient list
    const firmCcEmails = selectedFirm?.cc_emails
      ? selectedFirm.cc_emails.split(',').map(e => e.trim()).filter(e => e)
      : [];
    const allRecipients = [...new Set([selectedFirm?.email, ...firmCcEmails, ...additionalEmails])].filter(Boolean);
    const confirmed = await confirm({
      title: 'Send Invoice',
      message: `Generate and send invoice to ${selectedFirm?.firm_name}?\n\nRecipients: ${allRecipients.join(', ')}`,
      confirmText: 'Send',
      cancelText: 'Cancel',
      type: 'info'
    });
    if (!confirmed) return;
    setLoadingAction('send');
    try {
      const result = await api.generateAndSendInvoice({
        ...formData,
        additionalEmails: additionalEmails
      });
      if (result.error) throw new Error(result.error);
      addToast(result.message, 'success');
      setAdditionalEmails([]); // Clear additional emails after successful send
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoadingAction(null);
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
          {formData.dueDate && <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>{formatDate(formData.dueDate)}</small>}
        </div>
      </div>

      {/* Email Recipients Section */}
      {selectedFirm && (
        <div className="email-recipients-section" style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <label style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'block', color: '#334155' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Email Recipients
          </label>

          {/* Primary recipient */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="email-tag email-tag-primary" style={{ background: '#dbeafe', color: '#1e40af', padding: '0.375rem 0.75rem', borderRadius: '20px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              {selectedFirm.email}
              <span style={{ marginLeft: '0.25rem', background: '#1e40af', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '10px', fontSize: '0.7rem' }}>To</span>
            </span>
          </div>

          {/* Firm's stored CC emails */}
          {selectedFirm.cc_emails && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {selectedFirm.cc_emails.split(',').map(e => e.trim()).filter(e => e).map((email, index) => (
                <span
                  key={`cc-${index}`}
                  className="email-tag"
                  style={{ background: '#fef3c7', color: '#92400e', padding: '0.375rem 0.75rem', borderRadius: '20px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  {email}
                  <span style={{ marginLeft: '0.25rem', background: '#92400e', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '10px', fontSize: '0.7rem' }}>CC</span>
                </span>
              ))}
            </div>
          )}

          {/* Firm's stored BCC emails + default */}
          {(selectedFirm.bcc_emails || selectedFirm.include_default_bcc !== false) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {selectedFirm.bcc_emails && selectedFirm.bcc_emails.split(',').map(e => e.trim()).filter(e => e).map((email, index) => (
                <span
                  key={`bcc-${index}`}
                  className="email-tag"
                  style={{ background: '#f3e8ff', color: '#6b21a8', padding: '0.375rem 0.75rem', borderRadius: '20px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  {email}
                  <span style={{ marginLeft: '0.25rem', background: '#6b21a8', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '10px', fontSize: '0.7rem' }}>BCC</span>
                </span>
              ))}
              {selectedFirm.include_default_bcc !== false && (
                <span
                  className="email-tag"
                  style={{ background: '#f3e8ff', color: '#6b21a8', padding: '0.375rem 0.75rem', borderRadius: '20px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  hello@judy.legal
                  <span style={{ marginLeft: '0.25rem', background: '#6b21a8', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '10px', fontSize: '0.7rem' }}>BCC</span>
                </span>
              )}
            </div>
          )}

          {/* Additional recipients */}
          {additionalEmails.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {additionalEmails.map((email, index) => (
                <span
                  key={index}
                  className="email-tag"
                  style={{ background: '#f1f5f9', color: '#475569', padding: '0.375rem 0.75rem', borderRadius: '20px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                >
                  {email}
                  <span style={{ marginLeft: '0.25rem', background: '#475569', color: 'white', padding: '0.125rem 0.375rem', borderRadius: '10px', fontSize: '0.7rem' }}>CC</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(email)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex', color: '#94a3b8' }}
                    title="Remove"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Add email input */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="email"
                placeholder="Add CC recipient email..."
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setEmailError(''); }}
                onKeyDown={handleEmailKeyDown}
                style={{ width: '100%', padding: '0.5rem 0.75rem', border: emailError ? '1px solid #ef4444' : '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' }}
              />
              {emailError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>{emailError}</p>}
            </div>
            <button
              type="button"
              onClick={handleAddEmail}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
            >
              + Add
            </button>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem', marginBottom: 0 }}>
            Additional recipients will receive a copy of the invoice email
          </p>
        </div>
      )}

      <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <Tooltip text="Preview invoice amounts before generating">
          <LoadingButton
            className="btn btn-secondary"
            onClick={handlePreview}
            loading={loadingAction === 'preview'}
            disabled={loadingAction !== null}
          >
            Preview
          </LoadingButton>
        </Tooltip>
        <Tooltip text="Generate and download invoice as PDF">
          <LoadingButton
            className="btn"
            onClick={() => handleDownload('pdf')}
            loading={loadingAction === 'pdf'}
            disabled={loadingAction !== null}
            style={{ background: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/>
            </svg>
            Download PDF
          </LoadingButton>
        </Tooltip>
        <Tooltip text="Generate and download invoice as Word document">
          <LoadingButton
            className="btn"
            onClick={() => handleDownload('docx')}
            loading={loadingAction === 'docx'}
            disabled={loadingAction !== null}
            style={{ background: '#2b579a', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13zm-4 5.5l1.1 4.5h.8l.9-3 .9 3h.8l1.1-4.5h-1l-.6 2.8-.9-2.8h-.6l-.9 2.8-.6-2.8H9z"/>
            </svg>
            Download Word
          </LoadingButton>
        </Tooltip>
        <Tooltip text="Generate PDF and send via email">
          <LoadingButton
            className="btn"
            onClick={handleSend}
            loading={loadingAction === 'send'}
            disabled={loadingAction !== null}
            style={{ background: '#059669', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Generate & Send
          </LoadingButton>
        </Tooltip>
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
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [formData, setFormData] = useState({
    firm_id: '',
    schedule_date: '',
    plan_type: 'standard',
    duration: '12 months',
    num_users: 1,
    base_amount: 0
  });
  const [bulkFormData, setBulkFormData] = useState({
    selectedFirms: []
  });
  const [bulkSearchTerm, setBulkSearchTerm] = useState('');
  const [loading, setLoading] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [clearingCompleted, setClearingCompleted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { addToast } = useToast();
  const confirm = useConfirm();

  // Filter scheduled invoices
  const filteredScheduled = scheduled.filter(item => {
    const matchesSearch = item.firm_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredScheduled.length / itemsPerPage);
  const paginatedScheduled = filteredScheduled.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Count completed (executed + failed)
  const completedCount = scheduled.filter(s => s.status === 'executed' || s.status === 'failed').length;

  // Auto-populate from selected firm (but don't overwrite schedule_date if already set)
  useEffect(() => {
    if (formData.firm_id) {
      const firm = firms.find(f => f.id === parseInt(formData.firm_id));
      if (firm) {
        setFormData(prev => ({
          ...prev,
          plan_type: firm.plan_type || 'standard',
          num_users: firm.num_users || 1,
          base_amount: firm.base_price || 0,
          schedule_date: prev.schedule_date || (firm.subscription_end ? firm.subscription_end.split('T')[0] : '')
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

  const handleDelete = async (id, firmName) => {
    const confirmed = await confirm({
      title: 'Cancel Scheduled Invoice',
      message: `Are you sure you want to cancel this scheduled invoice for "${firmName}"?`,
      confirmText: 'Cancel Invoice',
      cancelText: 'Keep',
      type: 'danger'
    });
    if (!confirmed) return;
    setLoading(prev => ({ ...prev, [id]: 'delete' }));
    try {
      await api.deleteScheduled(id);
      addToast('Scheduled invoice cancelled!', 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(prev => ({ ...prev, [id]: null }));
  };

  const handleProcessNow = async (id, email, firmName) => {
    const confirmed = await confirm({
      title: 'Process Invoice Now',
      message: `Generate and send invoice to ${firmName} (${email}) immediately?`,
      confirmText: 'Send Now',
      cancelText: 'Cancel',
      type: 'info'
    });
    if (!confirmed) return;
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

  const handleClearCompleted = async () => {
    const confirmed = await confirm({
      title: 'Clear Completed Invoices',
      message: `Remove ${completedCount} executed and failed scheduled invoices from the list? This cannot be undone.`,
      confirmText: 'Clear All',
      cancelText: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    setClearingCompleted(true);
    try {
      const result = await api.clearCompletedScheduled();
      if (result.error) throw new Error(result.error);
      addToast(`Cleared ${result.count} completed invoice${result.count !== 1 ? 's' : ''}`, 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setClearingCompleted(false);
  };

  // Calculate schedule date: ~3 weeks before subscription end, ensuring it's a weekday
  const calculateScheduleDate = (subscriptionEnd) => {
    if (!subscriptionEnd) return null;
    const endDate = new Date(subscriptionEnd);
    // Subtract 21 days (3 weeks)
    const scheduleDate = new Date(endDate);
    scheduleDate.setDate(scheduleDate.getDate() - 21);

    // Adjust to nearest weekday if it falls on weekend
    const dayOfWeek = scheduleDate.getDay();
    if (dayOfWeek === 0) { // Sunday -> move to Monday
      scheduleDate.setDate(scheduleDate.getDate() + 1);
    } else if (dayOfWeek === 6) { // Saturday -> move to Friday
      scheduleDate.setDate(scheduleDate.getDate() - 1);
    }

    return scheduleDate.toISOString().split('T')[0];
  };

  // Check if schedule date is today or in the past (would trigger immediate send)
  const isImmediateDate = (dateStr) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(dateStr);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate <= today;
  };

  // Get firms that have valid subscription end dates
  const firmsWithSubscriptionEnd = firms.filter(f => f.subscription_end);

  // Initialize bulk modal with firms that have subscription end dates
  const openBulkModal = () => {
    setBulkFormData({
      selectedFirms: firmsWithSubscriptionEnd.map(f => f.id)
    });
    setBulkSearchTerm('');
    setShowBulkModal(true);
  };

  // Toggle firm selection in bulk modal
  const toggleFirmSelection = (firmId) => {
    setBulkFormData(prev => ({
      ...prev,
      selectedFirms: prev.selectedFirms.includes(firmId)
        ? prev.selectedFirms.filter(id => id !== firmId)
        : [...prev.selectedFirms, firmId]
    }));
  };

  // Toggle all firms
  const toggleAllFirms = () => {
    setBulkFormData(prev => ({
      ...prev,
      selectedFirms: prev.selectedFirms.length === firmsWithSubscriptionEnd.length ? [] : firmsWithSubscriptionEnd.map(f => f.id)
    }));
  };

  // Handle bulk schedule creation
  const handleBulkSchedule = async () => {
    if (bulkFormData.selectedFirms.length === 0) {
      addToast('Please select at least one firm', 'error');
      return;
    }

    // Check which firms would have immediate dates
    const immediateFirms = bulkFormData.selectedFirms
      .map(firmId => firmsWithSubscriptionEnd.find(f => f.id === firmId))
      .filter(firm => {
        if (!firm) return false;
        const scheduleDate = calculateScheduleDate(firm.subscription_end);
        return isImmediateDate(scheduleDate);
      });

    // Warn if any dates would trigger immediate sending
    if (immediateFirms.length > 0) {
      const firmDetails = immediateFirms.map(firm => {
        const scheduleDate = calculateScheduleDate(firm.subscription_end);
        return `• ${firm.firm_name} (${firm.plan_type === 'plus' ? 'Plus' : 'Standard'}, ${firm.plan_duration || '12 months'}, ${formatCurrency(firm.base_price || 0)}) - Schedule: ${formatDate(scheduleDate)}`;
      }).join('\n');

      const confirmed = await confirm({
        title: '⚠️ Immediate Invoice Warning',
        message: `${immediateFirms.length} firm(s) have schedule dates that are today or in the past. These invoices will be sent IMMEDIATELY when the scheduler runs:\n\n${firmDetails}\n\nAre you sure you want to proceed?`,
        confirmText: 'Yes, Proceed',
        cancelText: 'Cancel',
        type: 'danger'
      });
      if (!confirmed) return;
    }

    setBulkLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const firmId of bulkFormData.selectedFirms) {
      const firm = firmsWithSubscriptionEnd.find(f => f.id === firmId);
      if (!firm) continue;

      const scheduleDate = calculateScheduleDate(firm.subscription_end);
      if (!scheduleDate) continue;

      try {
        await api.createScheduled({
          firm_id: firmId,
          schedule_date: scheduleDate,
          plan_type: firm.plan_type || 'standard',
          duration: firm.plan_duration || '12 months',
          num_users: firm.num_users || 1,
          base_amount: firm.base_price || 0
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to schedule for ${firm.firm_name}:`, error);
        errorCount++;
      }
    }

    setBulkLoading(false);
    setShowBulkModal(false);

    if (errorCount === 0) {
      addToast(`Successfully scheduled ${successCount} invoice(s)`, 'success');
    } else {
      addToast(`Scheduled ${successCount} invoice(s), ${errorCount} failed`, 'warning');
    }
    onRefresh();
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Scheduled Invoices</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {completedCount > 0 && (
              <button
                className="btn btn-secondary"
                onClick={handleClearCompleted}
                disabled={clearingCompleted}
                style={{ fontSize: '0.875rem' }}
              >
                {clearingCompleted ? 'Clearing...' : `Clear Completed (${completedCount})`}
              </button>
            )}
            {firms.length > 0 && (
              <button className="btn btn-secondary" onClick={openBulkModal} style={{ fontSize: '0.875rem' }}>
                Bulk Schedule
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              + Schedule Invoice
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        {scheduled.length > 0 && (
          <div className="search-filter-bar">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by firm name..."
            />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="executed">Executed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        )}

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
        ) : filteredScheduled.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon search-icon">🔍</div>
            <div className="empty-state-title">No matching scheduled invoices</div>
            <p className="empty-state-description">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Firm</th>
                  <th>Scheduled For</th>
                  <th style={{ minWidth: '140px' }}>Subscription End</th>
                  <th>Plan</th>
                  <th>Duration</th>
                  <th>Users</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedScheduled.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.firm_name}</strong></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                        <span>{formatDate(item.schedule_date)}</span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>at 8:00 AM GMT</span>
                      </div>
                    </td>
                    <td>{formatDate(item.subscription_end)}</td>
                    <td>
                      <span className={`badge ${item.plan_type === 'plus' ? 'badge-blue' : 'badge-gray'}`}>
                        {item.plan_type === 'plus' ? 'Plus' : 'Standard'}
                      </span>
                    </td>
                    <td>{item.duration}</td>
                    <td>{item.num_users}</td>
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
                          <Tooltip text="Process and send invoice now">
                            <button
                              className="action-btn action-btn-send"
                              onClick={() => handleProcessNow(item.id, item.email, item.firm_name)}
                              disabled={loading[item.id]}
                            >
                              {loading[item.id] === 'process' ? '...' : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="22" y1="2" x2="11" y2="13"/>
                                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                              )}
                            </button>
                          </Tooltip>
                          <Tooltip text="Cancel scheduled invoice">
                            <button
                              className="action-btn action-btn-delete"
                              onClick={() => handleDelete(item.id, item.firm_name)}
                              disabled={loading[item.id]}
                            >
                              {loading[item.id] === 'delete' ? '...' : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"/>
                                  <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                              )}
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredScheduled.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredScheduled.length}
            itemsPerPage={itemsPerPage}
          />
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
                min={new Date().toISOString().split('T')[0]}
                value={formData.schedule_date}
                onChange={e => setFormData({ ...formData, schedule_date: e.target.value })}
              />
              {formData.schedule_date && <small style={{ color: '#64748b', marginTop: '0.25rem', display: 'block' }}>{formatDate(formData.schedule_date)}</small>}
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

      {/* Bulk Schedule Modal */}
      <Modal isOpen={showBulkModal} onClose={() => { setShowBulkModal(false); setBulkSearchTerm(''); }} title="Bulk Schedule Invoices">
        <div className="modal-body">
          <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Invoices will be scheduled 3 weeks before each firm's subscription end date (on a weekday). Each firm's plan type and duration will be used.
          </div>

          {/* Search input */}
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search firms..."
              value={bulkSearchTerm}
              onChange={(e) => setBulkSearchTerm(e.target.value)}
              style={{ fontSize: '0.875rem' }}
            />
          </div>

          {/* Firm Selection */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Select Firms ({bulkFormData.selectedFirms.length} selected)</label>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                onClick={toggleAllFirms}
              >
                {bulkFormData.selectedFirms.length === firmsWithSubscriptionEnd.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.375rem', padding: '0.5rem' }}>
              {firmsWithSubscriptionEnd.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', margin: '1rem 0' }}>No firms with subscription end dates. Update firm details first.</p>
              ) : firmsWithSubscriptionEnd.filter(firm => firm.firm_name.toLowerCase().includes(bulkSearchTerm.toLowerCase())).length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', margin: '1rem 0' }}>No firms match "{bulkSearchTerm}"</p>
              ) : (
                firmsWithSubscriptionEnd
                  .filter(firm => firm.firm_name.toLowerCase().includes(bulkSearchTerm.toLowerCase()))
                  .map(firm => {
                  const scheduleDate = calculateScheduleDate(firm.subscription_end);
                  const isImmediate = isImmediateDate(scheduleDate);
                  return (
                    <label
                      key={firm.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        borderRadius: '0.25rem',
                        backgroundColor: bulkFormData.selectedFirms.includes(firm.id)
                          ? (isImmediate ? '#fef2f2' : '#f0fdf4')
                          : 'transparent',
                        marginBottom: '0.25rem',
                        border: isImmediate && bulkFormData.selectedFirms.includes(firm.id) ? '1px solid #fecaca' : '1px solid transparent'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={bulkFormData.selectedFirms.includes(firm.id)}
                        onChange={() => toggleFirmSelection(firm.id)}
                        style={{ marginRight: '0.75rem', marginTop: '0.25rem' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {firm.firm_name}
                          <span className={`badge ${firm.plan_type === 'plus' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                            {firm.plan_type === 'plus' ? 'Plus' : 'Standard'}
                          </span>
                          {isImmediate && (
                            <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>Immediate</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.125rem' }}>
                          {firm.plan_duration || '12 months'} • {firm.num_users || 1} user(s) • {formatCurrency(firm.base_price || 0)}
                        </div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
                          <span style={{ color: '#64748b' }}>
                            Ends: <strong>{formatDate(firm.subscription_end)}</strong>
                          </span>
                          <span style={{ color: isImmediate ? '#dc2626' : '#059669' }}>
                            Schedule: <strong>{formatDate(scheduleDate)}</strong>
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowBulkModal(false)}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleBulkSchedule}
            disabled={bulkLoading || bulkFormData.selectedFirms.length === 0}
          >
            {bulkLoading ? 'Scheduling...' : `Schedule ${bulkFormData.selectedFirms.length} Invoice(s)`}
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
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const itemsPerPage = 10;
  const { addToast } = useToast();
  const confirm = useConfirm();

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

  // Clear selection when filters change
  useEffect(() => {
    setSelectedInvoices(new Set());
  }, [searchTerm, statusFilter, planFilter]);

  // Selection handlers
  const toggleSelectInvoice = (id) => {
    setSelectedInvoices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(inv => inv.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedInvoices.size === 0) return;

    const confirmed = await confirm({
      title: 'Delete Invoices',
      message: `Are you sure you want to delete ${selectedInvoices.size} invoice(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await api.deleteInvoices(Array.from(selectedInvoices));
      if (result.error) throw new Error(result.error);
      addToast(result.message, 'success');
      setSelectedInvoices(new Set());
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setIsDeleting(false);
  };

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

  const handleSend = async (id, email, invoiceNumber) => {
    const confirmed = await confirm({
      title: 'Send Invoice',
      message: `Send invoice ${invoiceNumber} to ${email}?`,
      confirmText: 'Send',
      cancelText: 'Cancel',
      type: 'info'
    });
    if (!confirmed) return;
    setLoading(prev => ({ ...prev, [id]: 'send' }));
    try {
      const result = await api.sendInvoice(id);
      if (result.error) throw new Error(result.error);
      // Show success animation
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);
      addToast(result.message, 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(prev => ({ ...prev, [id]: null }));
  };

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadCSV = () => {
    exportToCSV(filteredInvoices, 'invoices');
    addToast('Invoice history exported to CSV', 'success');
    setShowExportMenu(false);
  };

  const [sendingToAccountant, setSendingToAccountant] = useState(false);

  const handleExportForAccountant = async () => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    if (paidInvoices.length === 0) {
      addToast('No paid invoices to export', 'warning');
      setShowExportMenu(false);
      return;
    }

    setSendingToAccountant(true);
    setShowExportMenu(false);

    try {
      const result = await api.emailAccountant();
      if (result.error) {
        addToast(result.error, 'error');
      } else {
        addToast(result.message || `Sent ${paidInvoices.length} paid invoice(s) to accountant`, 'success');
      }
    } catch (error) {
      addToast(error.message || 'Failed to send report', 'error');
    }

    setSendingToAccountant(false);
  };

  const handleMarkPaid = async (id, invoiceNumber) => {
    const confirmed = await confirm({
      title: 'Mark Invoice as Paid',
      message: `Mark invoice ${invoiceNumber} as paid?`,
      confirmText: 'Mark Paid',
      cancelText: 'Cancel',
      type: 'info'
    });
    if (!confirmed) return;
    setLoading(prev => ({ ...prev, [`${id}-paid`]: true }));
    try {
      const result = await api.markInvoicePaid(id);
      if (result.error) throw new Error(result.error);
      addToast(`Invoice ${invoiceNumber} marked as paid`, 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(prev => ({ ...prev, [`${id}-paid`]: false }));
  };

  const handleMarkUnpaid = async (id, invoiceNumber) => {
    const confirmed = await confirm({
      title: 'Mark Invoice as Unpaid',
      message: `Revert invoice ${invoiceNumber} to unpaid status?`,
      confirmText: 'Mark Unpaid',
      cancelText: 'Cancel',
      type: 'warning'
    });
    if (!confirmed) return;
    setLoading(prev => ({ ...prev, [`${id}-unpaid`]: true }));
    try {
      const result = await api.markInvoiceUnpaid(id);
      if (result.error) throw new Error(result.error);
      addToast(`Invoice ${invoiceNumber} marked as unpaid`, 'success');
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setLoading(prev => ({ ...prev, [`${id}-unpaid`]: false }));
  };

  // Edit draft invoice state
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState({
    planType: 'standard',
    duration: '1 Year',
    numUsers: 1,
    baseAmount: '',
    dueDate: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditDraft = (invoice) => {
    setEditForm({
      planType: invoice.plan_type,
      duration: invoice.duration,
      numUsers: invoice.num_users,
      baseAmount: invoice.base_amount,
      dueDate: invoice.due_date ? invoice.due_date.split('T')[0] : ''
    });
    setEditingInvoice(invoice);
  };

  const handleUpdateDraft = async () => {
    if (!editingInvoice) return;
    setIsUpdating(true);
    try {
      const result = await api.updateDraftInvoice(editingInvoice.id, editForm);
      if (result.error) throw new Error(result.error);
      addToast(`Invoice ${editingInvoice.invoice_number} updated`, 'success');
      setEditingInvoice(null);
      onRefresh();
    } catch (error) {
      addToast(error.message, 'error');
    }
    setIsUpdating(false);
  };

  // Calculate preview amounts for edit form
  const editPreviewAmounts = (() => {
    const base = Number(editForm.baseAmount) || 0;
    const gtfl = base * 0.025;
    const nihl = base * 0.025;
    const vat = base * 0.15;
    const total = base + gtfl + nihl + vat;
    return { base, gtfl, nihl, vat, total };
  })();

  return (
    <>
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="success-animation-overlay">
          <div className="success-animation-content">
            <div className="success-checkmark">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                <circle cx="12" cy="12" r="10" className="success-circle" />
                <polyline points="8 12 11 15 16 9" className="success-check" />
              </svg>
            </div>
            <h3 className="success-title">Invoice Sent!</h3>
            <p className="success-subtitle">The invoice has been emailed successfully</p>
          </div>
        </div>
      )}

      {/* Edit Draft Invoice Modal */}
      {editingInvoice && (
        <div className="modal-overlay" onClick={() => setEditingInvoice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Edit Draft Invoice</h3>
              <button className="modal-close" onClick={() => setEditingInvoice(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Invoice</div>
                <div style={{ fontWeight: '600' }}>{editingInvoice.invoice_number}</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>{editingInvoice.firm_name}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Plan Type</label>
                <select
                  className="form-select"
                  value={editForm.planType}
                  onChange={(e) => setEditForm({ ...editForm, planType: e.target.value })}
                >
                  <option value="standard">Standard</option>
                  <option value="plus">Plus</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Duration</label>
                <select
                  className="form-select"
                  value={editForm.duration}
                  onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                >
                  <option value="1 Month">1 Month</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="1 Year">1 Year</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Number of Users</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={editForm.numUsers}
                  onChange={(e) => setEditForm({ ...editForm, numUsers: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Base Amount (GHS)</label>
                <input
                  type="number"
                  className="form-input"
                  step="0.01"
                  value={editForm.baseAmount}
                  onChange={(e) => setEditForm({ ...editForm, baseAmount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                />
              </div>

              {/* Price Preview */}
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0369a1', marginBottom: '0.5rem' }}>PRICE BREAKDOWN</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span>Base Amount:</span>
                  <span>GHS {editPreviewAmounts.base.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#6b7280' }}>
                  <span>GTFL (2.5%):</span>
                  <span>GHS {editPreviewAmounts.gtfl.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#6b7280' }}>
                  <span>NIHL (2.5%):</span>
                  <span>GHS {editPreviewAmounts.nihl.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#6b7280' }}>
                  <span>VAT (15%):</span>
                  <span>GHS {editPreviewAmounts.vat.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: '600', borderTop: '1px solid #bae6fd', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                  <span>Total:</span>
                  <span>GHS {editPreviewAmounts.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditingInvoice(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateDraft} disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
      <div className="card-header">
        <h2 className="card-title">Invoice History</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {selectedInvoices.size > 0 && (
            <button
              className="btn-danger"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              {isDeleting ? 'Deleting...' : `Delete (${selectedInvoices.size})`}
            </button>
          )}
          {sendingToAccountant && (
            <span style={{ fontSize: '0.875rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Sending to accountant...
            </span>
          )}
          {showFilters && invoices.length > 0 && (
            <div className="export-dropdown" ref={exportMenuRef}>
              <button
                className="export-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={sendingToAccountant}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '4px' }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {showExportMenu && (
                <div className="export-menu">
                  <button className="export-menu-item" onClick={handleDownloadCSV}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                    <div className="export-menu-text">
                      <span className="export-menu-title">Download CSV</span>
                      <span className="export-menu-desc">Export {filteredInvoices.length} filtered invoice(s)</span>
                    </div>
                  </button>
                  <button className="export-menu-item" onClick={handleExportForAccountant} disabled={sendingToAccountant}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <div className="export-menu-text">
                      <span className="export-menu-title">Email to Accountant</span>
                      <span className="export-menu-desc">Send paid invoices CSV ({invoices.filter(i => i.status === 'paid').length})</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
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
            <option value="paid">Paid</option>
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
          <div className="empty-state-icon search-icon">🔍</div>
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
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={filteredInvoices.length > 0 && selectedInvoices.size === filteredInvoices.length}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th>Invoice #</th>
                  <th>Firm</th>
                  <th>Plan</th>
                  <th>Users</th>
                  <th>Total</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map(inv => {
                  const dueDateStatus = getDueDateStatus(inv.due_date);
                  return (
                    <tr key={inv.id} className={selectedInvoices.has(inv.id) ? 'selected-row' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedInvoices.has(inv.id)}
                          onChange={() => toggleSelectInvoice(inv.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td><strong>{inv.invoice_number}</strong></td>
                      <td>{inv.firm_name}</td>
                      <td>
                        <span className={`badge ${inv.plan_type === 'plus' ? 'badge-blue' : 'badge-gray'}`}>
                          {inv.plan_type === 'plus' ? 'Plus' : 'Standard'}
                        </span>
                      </td>
                      <td>{inv.num_users}</td>
                      <td>{formatCurrency(inv.total)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span>{formatDate(inv.due_date)}</span>
                          {inv.status !== 'paid' && dueDateStatus.label && (
                            <span className={`badge ${dueDateStatus.class}`} style={{ fontSize: '0.65rem' }}>
                              {dueDateStatus.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          inv.status === 'paid' ? 'badge-green' :
                          inv.status === 'sent' ? 'badge-blue' :
                          'badge-yellow'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {inv.status === 'draft' && (
                            <Tooltip text="Edit draft invoice">
                              <button
                                className="action-btn action-btn-edit"
                                onClick={() => handleEditDraft(inv)}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                            </Tooltip>
                          )}
                          <Tooltip text="Download as PDF">
                            <button
                              className="action-btn action-btn-pdf"
                              onClick={() => handleDownload(inv.id, inv.invoice_number, 'pdf')}
                              disabled={loading[`${inv.id}-pdf`]}
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
                          </Tooltip>
                          <Tooltip text="Download as Word document">
                            <button
                              className="action-btn action-btn-docx"
                              onClick={() => handleDownload(inv.id, inv.invoice_number, 'docx')}
                              disabled={loading[`${inv.id}-docx`]}
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
                          </Tooltip>
                          <Tooltip text="Send invoice via email">
                            <button
                              className="action-btn action-btn-send"
                              onClick={() => handleSend(inv.id, inv.email, inv.invoice_number)}
                              disabled={loading[inv.id]}
                            >
                              {loading[inv.id] === 'send' ? '...' : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="22" y1="2" x2="11" y2="13"/>
                                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                </svg>
                              )}
                            </button>
                          </Tooltip>
                          {inv.status === 'sent' && (
                            <Tooltip text="Mark as paid">
                              <button
                                className="action-btn action-btn-paid"
                                onClick={() => handleMarkPaid(inv.id, inv.invoice_number)}
                                disabled={loading[`${inv.id}-paid`]}
                              >
                                {loading[`${inv.id}-paid`] ? '...' : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                    <polyline points="22 4 12 14.01 9 11.01"/>
                                  </svg>
                                )}
                              </button>
                            </Tooltip>
                          )}
                          {inv.status === 'paid' && (
                            <Tooltip text="Mark as unpaid">
                              <button
                                className="action-btn action-btn-unpaid"
                                onClick={() => handleMarkUnpaid(inv.id, inv.invoice_number)}
                                disabled={loading[`${inv.id}-unpaid`]}
                              >
                                {loading[`${inv.id}-unpaid`] ? '...' : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="15" y1="9" x2="9" y2="15"/>
                                    <line x1="9" y1="9" x2="15" y2="15"/>
                                  </svg>
                                )}
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
    </>
  );
}

// Login Page
function LoginPage() {
  const [view, setView] = useState('login'); // 'login', 'forgot', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('judy_remember') === 'true');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Check for reset token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setView('reset');
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password, rememberMe);

    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth?action=forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, appUrl: window.location.origin })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setEmail('');
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      const response = await fetch(`${API_URL}/api/auth?action=reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setPassword('');
        setConfirmPassword('');
        // Clear the token from URL and redirect to login after delay
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setView('login');
          setSuccess('');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    }
    setLoading(false);
  };

  const renderLoginForm = () => (
    <>
      <div className="login-header">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <h1 className="login-title">JUDY Invoice</h1>
        <p className="login-subtitle">Sign in to manage invoices</p>
      </div>

      <form onSubmit={handleLogin} className="login-form">
        {error && (
          <div className="login-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <div className="remember-me">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="checkbox-custom"></span>
            Remember me
          </label>
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>

        <div className="login-link">
          <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}>
            Forgot your password?
          </button>
        </div>
      </form>
    </>
  );

  const renderForgotForm = () => (
    <>
      <div className="login-header">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 className="login-title">Reset Password</h1>
        <p className="login-subtitle">Enter your email to receive a reset link</p>
      </div>

      <form onSubmit={handleForgotPassword} className="login-form">
        {error && (
          <div className="login-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="login-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="9 12 12 15 16 10"/>
            </svg>
            {success}
          </div>
        )}

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            autoFocus
          />
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>

        <button
          type="button"
          className="login-btn login-btn-secondary"
          onClick={() => { setView('login'); setError(''); setSuccess(''); }}
        >
          Back to Login
        </button>
      </form>
    </>
  );

  const renderResetForm = () => (
    <>
      <div className="login-header">
        <div className="login-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9C27B0" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1 className="login-title">New Password</h1>
        <p className="login-subtitle">Enter your new password</p>
      </div>

      <form onSubmit={handleResetPassword} className="login-form">
        {error && (
          <div className="login-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="login-success">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="9 12 12 15 16 10"/>
            </svg>
            {success}
          </div>
        )}

        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
            autoFocus
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            required
            minLength={6}
          />
        </div>

        <button type="submit" className="login-btn" disabled={loading || success}>
          {loading ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Resetting...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </>
  );

  return (
    <div className="login-container">
      <div className="login-card">
        {view === 'login' && renderLoginForm()}
        {view === 'forgot' && renderForgotForm()}
        {view === 'reset' && renderResetForm()}

        <div className="login-footer">
          <p>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            JUDY Invoice Generator
          </p>
        </div>
      </div>
    </div>
  );
}

// Dashboard Section
function DashboardSection({ firms, invoices, scheduled, onNavigate, onNavigateToFirmsWithHighlight }) {
  // Exchange rate (approximate - in production this would be fetched from an API)
  const GHS_TO_USD = 0.063; // 1 GHS ≈ 0.063 USD

  const formatUSD = (ghsAmount) => {
    const usd = Number(ghsAmount) * GHS_TO_USD;
    return `$${usd.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Calculate metrics
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.created_at);
    return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
  });

  const sentInvoices = invoices.filter(i => i.status === 'sent');
  const paidInvoices = invoices.filter(i => i.status === 'paid');
  const pendingScheduled = scheduled.filter(s => s.status === 'pending');

  // Overdue invoices (sent but past due date and not paid)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueInvoices = sentInvoices.filter(inv => {
    if (!inv.due_date) return false;
    const dueDate = new Date(inv.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  // Firms with expiring subscriptions (within 30 days or expired)
  const expiringFirms = firms.filter(firm => {
    const status = getSubscriptionStatus(firm.subscription_end);
    return status.status === 'expiring' || status.status === 'critical' || status.status === 'expired';
  });

  // Revenue calculations
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const thisMonthRevenue = thisMonthInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const outstandingRevenue = sentInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  return (
    <div className="dashboard">
      {/* Quick Stats */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-label">Law Firms</div>
            <div className="dashboard-stat-value">{firms.length}</div>
            {expiringFirms.length > 0 && (
              <div className="dashboard-stat-sub" style={{ color: '#dc2626' }}>
                {expiringFirms.length} expiring soon
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon" style={{ background: '#d1fae5', color: '#059669' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-label">Paid Invoices</div>
            <div className="dashboard-stat-value">{paidInvoices.length}</div>
            <div className="dashboard-stat-sub">of {invoices.length} total</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon" style={{ background: '#fef3c7', color: '#b45309' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-label">Pending Scheduled</div>
            <div className="dashboard-stat-value">{pendingScheduled.length}</div>
            <div className="dashboard-stat-sub">invoices queued</div>
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div className="dashboard-stat-content">
            <div className="dashboard-stat-label">Overdue</div>
            <div className="dashboard-stat-value">{overdueInvoices.length}</div>
            <div className="dashboard-stat-sub">need attention</div>
          </div>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="dashboard-revenue-grid">
        <div className="card dashboard-revenue-card">
          <h3 className="dashboard-revenue-title">Total Revenue (Paid)</h3>
          <div className="dashboard-revenue-amount">{formatCurrency(totalRevenue)}</div>
          <div className="dashboard-revenue-usd">{formatUSD(totalRevenue)} USD</div>
        </div>

        <div className="card dashboard-revenue-card">
          <h3 className="dashboard-revenue-title">This Month (Paid)</h3>
          <div className="dashboard-revenue-amount">{formatCurrency(thisMonthRevenue)}</div>
          <div className="dashboard-revenue-usd">{formatUSD(thisMonthRevenue)} USD</div>
        </div>

        <div className="card dashboard-revenue-card">
          <h3 className="dashboard-revenue-title">Outstanding (Sent)</h3>
          <div className="dashboard-revenue-amount">{formatCurrency(outstandingRevenue)}</div>
          <div className="dashboard-revenue-usd">{formatUSD(outstandingRevenue)} USD</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="dashboard-actions">
          <button className="dashboard-action-btn" onClick={() => onNavigate('generate')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
            Generate Invoice
          </button>
          <button className="dashboard-action-btn" onClick={() => onNavigate('firms')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Law Firm
          </button>
          <button className="dashboard-action-btn" onClick={() => onNavigate('scheduled')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            View Scheduled
          </button>
          <button className="dashboard-action-btn" onClick={() => onNavigate('history')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export History
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {(overdueInvoices.length > 0 || expiringFirms.length > 0) && (
        <div className="card dashboard-alerts">
          <div className="card-header">
            <h2 className="card-title">Attention Required</h2>
          </div>

          {overdueInvoices.length > 0 && (
            <div className="dashboard-alert dashboard-alert-danger">
              <div className="dashboard-alert-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="dashboard-alert-content">
                <strong>{overdueInvoices.length} Overdue Invoice{overdueInvoices.length > 1 ? 's' : ''}</strong>
                <p>
                  {overdueInvoices.slice(0, 3).map(inv => inv.firm_name).join(', ')}
                  {overdueInvoices.length > 3 && ` and ${overdueInvoices.length - 3} more`}
                </p>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => onNavigate('history')}>
                View
              </button>
            </div>
          )}

          {expiringFirms.length > 0 && (
            <div className="dashboard-alert dashboard-alert-warning">
              <div className="dashboard-alert-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="dashboard-alert-content">
                <strong>{expiringFirms.length} Subscription{expiringFirms.length > 1 ? 's' : ''} Expiring Soon</strong>
                <p>
                  {expiringFirms.slice(0, 5).map(f => {
                    const status = getSubscriptionStatus(f.subscription_end);
                    return `${f.firm_name} (${status.days <= 0 ? 'expired' : status.days + 'd'})`;
                  }).join(', ')}
                  {expiringFirms.length > 5 && ` and ${expiringFirms.length - 5} more`}
                </p>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => onNavigateToFirmsWithHighlight(expiringFirms.map(f => f.id))}>
                View
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Invoices</h2>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('history')}>
            View All
          </button>
        </div>
        {invoices.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p>No invoices yet. Generate your first invoice to see activity here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Firm</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id}>
                    <td><strong>{inv.invoice_number}</strong></td>
                    <td>{inv.firm_name}</td>
                    <td>{formatCurrency(inv.total)}</td>
                    <td>
                      <span className={`badge ${
                        inv.status === 'paid' ? 'badge-green' :
                        inv.status === 'sent' ? 'badge-blue' :
                        'badge-yellow'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>{formatDate(inv.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
    from_name: 'JUDY Legal Research',
    accountant_email: ''
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
          <h2 className="card-title">Accountant Settings</h2>
        </div>
        <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Set the email address where paid invoice reports will be sent.
        </p>
        <div className="form-group" style={{ maxWidth: '400px' }}>
          <label>Accountant Email</label>
          <input
            type="email"
            value={config.accountant_email}
            onChange={e => setConfig({ ...config, accountant_email: e.target.value })}
            placeholder="e.g., accountant@company.com"
          />
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
          Save Accountant Email
        </button>
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [firms, setFirms] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [highlightFirmIds, setHighlightFirmIds] = useState([]);
  const { addToast } = useToast();
  const { user, logout } = useAuth();

  // Navigate to firms tab and highlight specific firms
  const navigateToFirmsWithHighlight = (firmIds) => {
    setHighlightFirmIds(firmIds);
    setActiveTab('firms');
    // Clear highlight after 3 seconds
    setTimeout(() => setHighlightFirmIds([]), 3000);
  };

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+N or Cmd+N: Go to Generate tab (new invoice)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setActiveTab('generate');
        addToast('Navigated to Generate Invoice', 'info', 2000);
      }
      // Ctrl+F or Cmd+F: Go to Firms tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !e.shiftKey) {
        // Only intercept if not in an input/textarea
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setActiveTab('firms');
          addToast('Navigated to Law Firms', 'info', 2000);
        }
      }
      // Ctrl+H or Cmd+H: Go to History tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setActiveTab('history');
        addToast('Navigated to Invoice History', 'info', 2000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [addToast]);

  // Close mobile menu when tab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Calculate notification counts
  const overdueCount = invoices.filter(inv => {
    if (inv.status === 'paid') return false;
    const dueDate = new Date(inv.due_date);
    return dueDate < new Date();
  }).length;

  const expiringCount = firms.filter(firm => {
    if (!firm.subscription_end) return false;
    const endDate = new Date(firm.subscription_end);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  }).length;

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
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
          <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <button
              className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
              {(overdueCount + expiringCount) > 0 && <span className={`nav-badge ${overdueCount > 0 ? 'nav-badge-danger' : 'nav-badge-warning'}`}>{overdueCount + expiringCount}</span>}
            </button>
            <button
              className={`nav-btn ${activeTab === 'generate' ? 'active' : ''}`}
              onClick={() => setActiveTab('generate')}
            >
              Generate
              <span className="shortcut-hint"><span className="shortcut-key">Ctrl</span>+<span className="shortcut-key">N</span></span>
            </button>
            <button
              className={`nav-btn ${activeTab === 'firms' ? 'active' : ''}`}
              onClick={() => setActiveTab('firms')}
            >
              Law Firms
              {expiringCount > 0 && <span className="nav-badge nav-badge-warning">{expiringCount}</span>}
              <span className="shortcut-hint"><span className="shortcut-key">Ctrl</span>+<span className="shortcut-key">F</span></span>
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
              {overdueCount > 0 && <span className="nav-badge nav-badge-danger">{overdueCount}</span>}
              <span className="shortcut-hint"><span className="shortcut-key">Ctrl</span>+<span className="shortcut-key">H</span></span>
            </button>
            <button
              className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
            <div className="nav-divider"></div>
            <div className="nav-user">
              <span className="nav-user-email">{user?.email}</span>
              <button className="nav-btn nav-logout" onClick={logout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Sign Out
              </button>
            </div>
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
            {/* Content based on active tab */}
            {activeTab === 'dashboard' && (
              <DashboardSection
                firms={firms}
                invoices={invoices}
                scheduled={scheduled}
                onNavigate={setActiveTab}
                onNavigateToFirmsWithHighlight={navigateToFirmsWithHighlight}
              />
            )}
            {activeTab === 'generate' && (
              <>
                <GenerateInvoiceSection firms={firms} onRefresh={loadData} />
                <InvoiceHistorySection invoices={invoices} onRefresh={loadData} />
              </>
            )}
            {activeTab === 'firms' && (
              <FirmsSection firms={firms} onRefresh={loadData} isLoading={loading} highlightFirmIds={highlightFirmIds} />
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

// Auth-aware App Content
function AuthenticatedApp() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="login-container">
          <div className="loading">
            <div className="spinner"></div>
            Loading...
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <style>{styles}</style>
        <LoginPage />
      </>
    );
  }

  return <AppContent />;
}

// Main App with providers
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthenticatedApp />
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
