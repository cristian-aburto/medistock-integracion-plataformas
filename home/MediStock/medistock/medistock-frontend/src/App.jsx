import { useState, useEffect, useCallback } from "react";

// ─── API CLIENT ─────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8081/api";

const apiClient = {
  token: null,
  setToken(t) { this.token = t; },
  headers() {
    const h = { "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  },
  async request(method, path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error del servidor");
    return data;
  },
  get: (path) => apiClient.request("GET", path),
  post: (path, body) => apiClient.request("POST", path, body),
  put: (path, body) => apiClient.request("PUT", path, body),
  patch: (path, body) => apiClient.request("PATCH", path, body),
  delete: (path) => apiClient.request("DELETE", path),
};

// ─── MOCK DATA (for demo without backend) ───────────────────────────────────
const MOCK_PRODUCTS = [
  { id: 1, name: "Paracetamol 500mg", sku: "MED-001", category: "MEDICAMENTO", price: 2.50, stockQuantity: 8, minimumStock: 20, manufacturer: "Farma SA", status: "ACTIVE", lowStock: true, expiringSoon: false, expiryDate: "2025-12-01" },
  { id: 2, name: "Amoxicilina 250mg/5ml", sku: "MED-002", category: "MEDICAMENTO", price: 8.90, stockQuantity: 45, minimumStock: 15, manufacturer: "BioMed", status: "ACTIVE", lowStock: false, expiringSoon: false, expiryDate: "2026-06-15" },
  { id: 3, name: "Jeringa 5ml", sku: "CON-001", category: "CONSUMIBLE", price: 0.35, stockQuantity: 500, minimumStock: 100, manufacturer: "MedSupply", status: "ACTIVE", lowStock: false, expiringSoon: false, expiryDate: null },
  { id: 4, name: "Termómetro Digital", sku: "EQU-001", category: "EQUIPO", price: 45.00, stockQuantity: 12, minimumStock: 5, manufacturer: "Welch Allyn", status: "ACTIVE", lowStock: false, expiringSoon: false, expiryDate: null },
  { id: 5, name: "Ibuprofeno 400mg", sku: "MED-003", category: "MEDICAMENTO", price: 3.20, stockQuantity: 5, minimumStock: 30, manufacturer: "Farma SA", status: "ACTIVE", lowStock: true, expiringSoon: true, expiryDate: "2026-05-20" },
  { id: 6, name: "Guantes Nitrilo L", sku: "CON-002", category: "CONSUMIBLE", price: 0.15, stockQuantity: 1200, minimumStock: 200, manufacturer: "SafeHand", status: "ACTIVE", lowStock: false, expiringSoon: false, expiryDate: null },
  { id: 7, name: "Bisturí N°22", sku: "INS-001", category: "INSTRUMENTAL", price: 1.80, stockQuantity: 80, minimumStock: 25, manufacturer: "SurgTech", status: "ACTIVE", lowStock: false, expiringSoon: false, expiryDate: null },
  { id: 8, name: "Omeprazol 20mg", sku: "MED-004", category: "MEDICAMENTO", price: 5.60, stockQuantity: 3, minimumStock: 20, manufacturer: "PharmaCo", status: "ACTIVE", lowStock: true, expiringSoon: true, expiryDate: "2026-05-30" },
];

const MOCK_STATS = {
  totalProducts: 8, activeProducts: 8, lowStockAlerts: 3, expiringSoonAlerts: 2
};

// ─── ICONS ──────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20 }) => {
  const icons = {
    dashboard: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    inventory: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>,
    alert: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    pill: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>,
    search: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    plus: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    close: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    logout: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    user: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    package: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    calendar: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    filter: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    trending: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  };
  return icons[name] || null;
};

// ─── THEME ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap');

  :root {
    --bg: #0a0e1a;
    --surface: #111827;
    --surface2: #1a2235;
    --surface3: #1f2d47;
    --border: rgba(255,255,255,0.07);
    --border2: rgba(255,255,255,0.12);
    --accent: #00d4aa;
    --accent-dim: rgba(0,212,170,0.15);
    --accent-glow: 0 0 20px rgba(0,212,170,0.3);
    --red: #ff4d6a;
    --red-dim: rgba(255,77,106,0.12);
    --yellow: #fbbf24;
    --yellow-dim: rgba(251,191,36,0.12);
    --blue: #60a5fa;
    --blue-dim: rgba(96,165,250,0.12);
    --text: #f1f5f9;
    --text-muted: #94a3b8;
    --text-dim: #64748b;
    --radius: 12px;
    --radius-sm: 8px;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Outfit', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    font-size: 14px;
    line-height: 1.6;
  }

  .app { display: flex; min-height: 100vh; }

  /* SIDEBAR */
  .sidebar {
    width: 240px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
    overflow: hidden;
  }

  .sidebar-logo {
    padding: 24px 20px;
    border-bottom: 1px solid var(--border);
  }

  .logo-mark {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-icon {
    width: 36px; height: 36px;
    background: var(--accent);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0a0e1a;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 16px;
    letter-spacing: -1px;
    box-shadow: var(--accent-glow);
  }

  .logo-text {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: -0.5px;
    color: var(--text);
  }

  .logo-sub {
    font-size: 10px;
    color: var(--text-dim);
    font-family: 'DM Mono', monospace;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-top: 1px;
  }

  .sidebar-nav {
    flex: 1;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-label {
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-family: 'DM Mono', monospace;
    padding: 8px 8px 4px;
    margin-top: 8px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 500;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    position: relative;
  }

  .nav-item:hover {
    background: var(--surface2);
    color: var(--text);
  }

  .nav-item.active {
    background: var(--accent-dim);
    color: var(--accent);
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0; top: 50%;
    transform: translateY(-50%);
    width: 3px; height: 60%;
    background: var(--accent);
    border-radius: 0 3px 3px 0;
  }

  .nav-badge {
    margin-left: auto;
    background: var(--red);
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 20px;
    font-family: 'DM Mono', monospace;
  }

  .sidebar-user {
    padding: 16px;
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-avatar {
    width: 34px; height: 34px;
    background: linear-gradient(135deg, #00d4aa, #0099ff);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 13px;
    color: #fff;
    flex-shrink: 0;
  }

  .user-info { flex: 1; overflow: hidden; }
  .user-name { font-size: 13px; font-weight: 600; truncate: clip; }
  .user-role { font-size: 11px; color: var(--text-dim); font-family: 'DM Mono', monospace; }

  .logout-btn {
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition: color 0.2s;
  }
  .logout-btn:hover { color: var(--red); }

  /* MAIN */
  .main { margin-left: 240px; flex: 1; display: flex; flex-direction: column; }

  .topbar {
    height: 60px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 28px;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .topbar-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 20px;
    letter-spacing: -0.3px;
    flex: 1;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    width: 280px;
    transition: border-color 0.2s;
  }

  .search-box:focus-within {
    border-color: var(--accent);
  }

  .search-box input {
    background: none;
    border: none;
    outline: none;
    color: var(--text);
    font-size: 13px;
    font-family: 'Outfit', sans-serif;
    width: 100%;
  }

  .search-box input::placeholder { color: var(--text-dim); }

  .content { padding: 28px; flex: 1; }

  /* STAT CARDS */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 28px;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: border-color 0.2s, transform 0.2s;
    cursor: default;
  }

  .stat-card:hover { border-color: var(--border2); transform: translateY(-1px); }

  .stat-header { display: flex; align-items: center; justify-content: space-between; }

  .stat-icon {
    width: 38px; height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-icon.green { background: var(--accent-dim); color: var(--accent); }
  .stat-icon.red { background: var(--red-dim); color: var(--red); }
  .stat-icon.yellow { background: var(--yellow-dim); color: var(--yellow); }
  .stat-icon.blue { background: var(--blue-dim); color: var(--blue); }

  .stat-trend {
    font-size: 11px;
    color: var(--accent);
    font-family: 'DM Mono', monospace;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1;
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-muted);
    font-weight: 500;
  }

  /* TABLE */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .card-header {
    padding: 18px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .card-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 16px;
    flex: 1;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    font-family: 'Outfit', sans-serif;
    border: none;
    text-decoration: none;
  }

  .btn-primary {
    background: var(--accent);
    color: #0a0e1a;
    font-weight: 600;
  }
  .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }

  .btn-ghost {
    background: var(--surface2);
    color: var(--text-muted);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { color: var(--text); border-color: var(--border2); }

  .btn-danger {
    background: var(--red-dim);
    color: var(--red);
    border: 1px solid rgba(255,77,106,0.2);
  }
  .btn-danger:hover { background: rgba(255,77,106,0.2); }

  .btn-sm { padding: 5px 10px; font-size: 12px; }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    text-align: left;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--text-dim);
    border-bottom: 1px solid var(--border);
    font-family: 'DM Mono', monospace;
    white-space: nowrap;
  }

  td {
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
    vertical-align: middle;
  }

  tr:last-child td { border-bottom: none; }

  tr:hover td { background: rgba(255,255,255,0.02); }

  .sku-cell {
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: var(--text-muted);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    font-family: 'DM Mono', monospace;
    white-space: nowrap;
  }

  .badge-green { background: var(--accent-dim); color: var(--accent); }
  .badge-red { background: var(--red-dim); color: var(--red); }
  .badge-yellow { background: var(--yellow-dim); color: var(--yellow); }
  .badge-blue { background: var(--blue-dim); color: var(--blue); }
  .badge-gray { background: rgba(100,116,139,0.15); color: var(--text-dim); }

  .stock-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stock-bar {
    width: 60px;
    height: 4px;
    background: var(--surface3);
    border-radius: 4px;
    overflow: hidden;
  }

  .stock-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s;
  }

  .actions { display: flex; gap: 6px; }

  /* SELECT */
  select {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 7px 10px;
    color: var(--text);
    font-size: 13px;
    font-family: 'Outfit', sans-serif;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  select:focus { border-color: var(--accent); }

  /* MODAL */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.15s;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 16px;
    width: 100%;
    max-width: 540px;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp 0.2s;
    scrollbar-width: thin;
    scrollbar-color: var(--border2) transparent;
  }

  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

  .modal-header {
    padding: 22px 24px 18px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: var(--surface);
    z-index: 1;
  }

  .modal-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 700;
  }

  .modal-body { padding: 20px 24px; }
  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  /* FORM */
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-full { grid-column: 1 / -1; }

  .form-group { display: flex; flex-direction: column; gap: 6px; }

  .form-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-family: 'DM Mono', monospace;
  }

  .form-input {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    color: var(--text);
    font-size: 13px;
    font-family: 'Outfit', sans-serif;
    outline: none;
    transition: border-color 0.2s;
    width: 100%;
  }

  .form-input:focus { border-color: var(--accent); }
  .form-input::placeholder { color: var(--text-dim); }

  .form-hint { font-size: 11px; color: var(--text-dim); }

  /* ALERT BANNER */
  .alert-strip {
    background: var(--red-dim);
    border: 1px solid rgba(255,77,106,0.25);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--red);
    font-size: 13px;
    font-weight: 500;
  }

  /* LOGIN */
  .login-page {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  .login-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 20% 30%, rgba(0,212,170,0.06) 0%, transparent 60%),
      radial-gradient(ellipse 40% 40% at 80% 70%, rgba(96,165,250,0.05) 0%, transparent 50%);
  }

  .login-card {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: 20px;
    padding: 40px;
    width: 100%;
    max-width: 380px;
    position: relative;
    z-index: 1;
    box-shadow: 0 40px 80px rgba(0,0,0,0.5);
  }

  .login-logo { text-align: center; margin-bottom: 32px; }

  .login-icon {
    width: 56px; height: 56px;
    background: var(--accent);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0a0e1a;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 22px;
    margin: 0 auto 16px;
    box-shadow: 0 0 30px rgba(0,212,170,0.4);
  }

  .login-title {
    font-family: 'Syne', sans-serif;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  .login-subtitle { color: var(--text-muted); font-size: 13px; margin-top: 6px; }

  .error-msg {
    background: var(--red-dim);
    border: 1px solid rgba(255,77,106,0.25);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    color: var(--red);
    font-size: 13px;
    margin-bottom: 16px;
  }

  .success-msg {
    background: var(--accent-dim);
    border: 1px solid rgba(0,212,170,0.25);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    color: var(--accent);
    font-size: 13px;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .filters-bar {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 20px;
  }

  /* TOAST */
  .toast-container {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .toast {
    background: var(--surface);
    border: 1px solid var(--border2);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    font-size: 13px;
    animation: slideUp 0.2s;
    min-width: 260px;
  }

  .toast.success { border-left: 3px solid var(--accent); }
  .toast.error { border-left: 3px solid var(--red); }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-muted);
  }

  .empty-icon {
    width: 56px; height: 56px;
    background: var(--surface2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: var(--text-dim);
  }

  .empty-title { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
  .empty-sub { font-size: 13px; color: var(--text-dim); }

  .price-cell { font-family: 'DM Mono', monospace; font-size: 13px; }
  .name-cell { font-weight: 500; }

  .demo-note {
    background: linear-gradient(90deg, rgba(0,212,170,0.1), rgba(96,165,250,0.1));
    border: 1px solid rgba(0,212,170,0.2);
    border-radius: var(--radius-sm);
    padding: 10px 16px;
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'DM Mono', monospace;
  }

  .demo-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;

// ─── TOAST ───────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === "success" ? <Icon name="check" size={16} /> : <Icon name="alert" size={16} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const CATEGORIES = ["MEDICAMENTO", "CONSUMIBLE", "INSTRUMENTAL", "EQUIPO", "REACTIVO", "OTRO"];
const STATUS_MAP = { ACTIVE: "Activo", INACTIVE: "Inactivo", DISCONTINUED: "Discontinuado", OUT_OF_STOCK: "Sin stock" };
const CAT_LABELS = { MEDICAMENTO: "Medicamento", CONSUMIBLE: "Consumible", INSTRUMENTAL: "Instrumental", EQUIPO: "Equipo", REACTIVO: "Reactivo", OTRO: "Otro" };

function stockColor(pct) {
  if (pct < 0.3) return "#ff4d6a";
  if (pct < 0.6) return "#fbbf24";
  return "#00d4aa";
}

function StockCell({ qty, min }) {
  const pct = Math.min((qty / (min * 2)) || 0, 1);
  return (
    <div className="stock-indicator">
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}>{qty}</span>
      <div className="stock-bar">
        <div className="stock-fill" style={{ width: `${pct * 100}%`, background: stockColor(pct) }} />
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.password) { setError("Completa todos los campos"); return; }
    setLoading(true); setError("");
    try {
      // Try real API first, fall back to demo
      try {
        const res = await apiClient.post("/auth/login", form);
        if (res.data?.token) {
          apiClient.setToken(res.data.token);
          onLogin(res.data.user || { username: form.username, role: "ADMIN", fullName: "Admin" });
        }
      } catch {
        // Demo fallback
        if (form.username === "admin" && form.password === "admin123") {
          onLogin({ username: "admin", role: "ADMIN", fullName: "Administrador Demo" });
        } else {
          setError("Credenciales incorrectas.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <div className="login-icon">MS</div>
          <div className="login-title">MediStock</div>
          <div className="login-subtitle">Sistema de inventario médico</div>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Usuario</label>
            <input className="form-input" placeholder="Ingresa tu usuario"
              value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}
            style={{ marginTop: 8, padding: "12px", fontSize: 14, justifyContent: "center" }}>
            {loading ? "Iniciando..." : "Iniciar sesión"}
          </button>
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-dim)" }}>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT MODAL ────────────────────────────────────────────────────────────
function ProductModal({ product, onClose, onSave }) {
  const isEdit = !!product?.id;
  const [form, setForm] = useState({
    name: "", sku: "", category: "MEDICAMENTO", price: "", stockQuantity: "",
    minimumStock: "10", manufacturer: "", batchNumber: "", expiryDate: "",
    description: "", status: "ACTIVE",
    ...(product && {
      name: product.name, sku: product.sku, category: product.category,
      price: product.price, stockQuantity: product.stockQuantity,
      minimumStock: product.minimumStock, manufacturer: product.manufacturer || "",
      batchNumber: product.batchNumber || "", expiryDate: product.expiryDate || "",
      description: product.description || "", status: product.status
    })
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.sku || !form.price || !form.stockQuantity) {
      setError("Nombre, SKU, precio y stock son obligatorios"); return;
    }
    setLoading(true); setError("");
    try {
      const payload = { ...form, price: parseFloat(form.price), stockQuantity: parseInt(form.stockQuantity), minimumStock: parseInt(form.minimumStock) || 10 };
      let result;
      try {
        if (isEdit) {
          result = await apiClient.put(`/products/${product.id}`, payload);
        } else {
          result = await apiClient.post("/products", payload);
        }
        onSave(result.data);
      } catch {
        // Demo fallback
        const fakeProduct = { ...payload, id: product?.id || Date.now(), lowStock: parseInt(form.stockQuantity) <= parseInt(form.minimumStock), expiringSoon: false, createdAt: new Date().toISOString() };
        onSave(fakeProduct);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{isEdit ? "Editar Producto" : "Nuevo Producto"}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>
        <div className="modal-body">
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Nombre del producto *</label>
              <input className="form-input" value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Ej: Paracetamol 500mg" />
            </div>
            <div className="form-group">
              <label className="form-label">SKU *</label>
              <input className="form-input" value={form.sku} onChange={e => setF("sku", e.target.value)} placeholder="MED-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select className="form-input" value={form.category} onChange={e => setF("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Precio (S/) *</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={e => setF("price", e.target.value)} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-input" value={form.status} onChange={e => setF("status", e.target.value)}>
                {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Stock actual *</label>
              <input className="form-input" type="number" min="0" value={form.stockQuantity} onChange={e => setF("stockQuantity", e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Stock mínimo</label>
              <input className="form-input" type="number" min="0" value={form.minimumStock} onChange={e => setF("minimumStock", e.target.value)} placeholder="10" />
              <span className="form-hint">Alerta de stock bajo si cae a este nivel</span>
            </div>
            <div className="form-group">
              <label className="form-label">Fabricante</label>
              <input className="form-input" value={form.manufacturer} onChange={e => setF("manufacturer", e.target.value)} placeholder="Nombre del laboratorio" />
            </div>
            <div className="form-group">
              <label className="form-label">N° de lote</label>
              <input className="form-input" value={form.batchNumber} onChange={e => setF("batchNumber", e.target.value)} placeholder="LOTE-2024-001" />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de vencimiento</label>
              <input className="form-input" type="date" value={form.expiryDate} onChange={e => setF("expiryDate", e.target.value)} />
            </div>
            <div className="form-group form-full">
              <label className="form-label">Descripción</label>
              <textarea className="form-input" value={form.description} onChange={e => setF("description", e.target.value)} rows={2} placeholder="Descripción opcional del producto" style={{ resize: "vertical", minHeight: 60 }} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : (isEdit ? "Actualizar" : "Crear producto")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── INVENTORY VIEW ───────────────────────────────────────────────────────────
function InventoryView({ toast }) {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [modal, setModal] = useState(null); // null | 'create' | product

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.manufacturer && p.manufacturer.toLowerCase().includes(q));
    const matchCat = catFilter === "ALL" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const handleSave = (product) => {
    setProducts(prev => {
      const existing = prev.findIndex(p => p.id === product.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = product;
        return updated;
      }
      return [product, ...prev];
    });
    toast.show(modal?.id ? "Producto actualizado" : "Producto creado exitosamente");
    setModal(null);
  };

  const handleDelete = (id) => {
    if (!confirm("¿Discontinuar este producto?")) return;
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: "DISCONTINUED" } : p));
    toast.show("Producto discontinuado");
  };

  return (
    <div>
      <div className="demo-note">
        <div className="demo-dot" />
        Modo demo activo — los cambios se guardan localmente. Conecta al backend Spring Boot en localhost:8080
      </div>

      <div className="filters-bar">
        <div className="search-box" style={{ width: 260 }}>
          <Icon name="search" size={16} />
          <input placeholder="Buscar por nombre, SKU..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="ALL">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
        </select>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn btn-primary" onClick={() => setModal("create")}>
            <Icon name="plus" size={16} /> Nuevo producto
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Productos</div>
          <span className="badge badge-gray">{filtered.length} registros</span>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Icon name="package" size={28} /></div>
            <div className="empty-title">Sin resultados</div>
            <div className="empty-sub">No se encontraron productos con los filtros aplicados</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Vence</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="name-cell">{p.name}</div>
                    {p.manufacturer && <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{p.manufacturer}</div>}
                  </td>
                  <td><span className="sku-cell">{p.sku}</span></td>
                  <td><span className="badge badge-blue">{CAT_LABELS[p.category]}</span></td>
                  <td><span className="price-cell">S/ {Number(p.price).toFixed(2)}</span></td>
                  <td>
                    <StockCell qty={p.stockQuantity} min={p.minimumStock} />
                    {p.lowStock && <span className="badge badge-red" style={{ marginTop: 2, fontSize: 10 }}>Stock bajo</span>}
                  </td>
                  <td>
                    <span className={`badge ${p.status === "ACTIVE" ? "badge-green" : "badge-gray"}`}>
                      {STATUS_MAP[p.status]}
                    </span>
                  </td>
                  <td>
                    {p.expiryDate ? (
                      <span style={{ fontSize: 12, fontFamily: "monospace", color: p.expiringSoon ? "var(--yellow)" : "var(--text-muted)" }}>
                        {p.expiryDate}
                        {p.expiringSoon && " ⚠"}
                      </span>
                    ) : <span style={{ color: "var(--text-dim)" }}>—</span>}
                  </td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(p)} title="Editar">
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)} title="Discontinuar">
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(modal === "create" || (modal && modal.id)) && (
        <ProductModal
          product={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ─── ALERTS VIEW ─────────────────────────────────────────────────────────────
function AlertsView() {
  const lowStock = MOCK_PRODUCTS.filter(p => p.lowStock);
  const expiring = MOCK_PRODUCTS.filter(p => p.expiringSoon);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="card">
        <div className="card-header">
          <div style={{ color: "var(--red)" }}><Icon name="alert" size={18} /></div>
          <div className="card-title">Stock Bajo</div>
          <span className="badge badge-red">{lowStock.length}</span>
        </div>
        {lowStock.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}><Icon name="check" size={28} /></div>
            <div className="empty-title">Todo en orden</div>
            <div className="empty-sub">No hay productos con stock bajo</div>
          </div>
        ) : (
          <table>
            <thead><tr><th>Producto</th><th>SKU</th><th>Stock actual</th><th>Mínimo requerido</th><th>Déficit</th></tr></thead>
            <tbody>
              {lowStock.map(p => (
                <tr key={p.id}>
                  <td><div className="name-cell">{p.name}</div></td>
                  <td><span className="sku-cell">{p.sku}</span></td>
                  <td><span style={{ color: "var(--red)", fontFamily: "monospace", fontWeight: 700 }}>{p.stockQuantity}</span></td>
                  <td><span style={{ fontFamily: "monospace" }}>{p.minimumStock}</span></td>
                  <td><span className="badge badge-red">-{p.minimumStock - p.stockQuantity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ color: "var(--yellow)" }}><Icon name="calendar" size={18} /></div>
          <div className="card-title">Próximos a Vencer (30 días)</div>
          <span className="badge badge-yellow">{expiring.length}</span>
        </div>
        {expiring.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}><Icon name="check" size={28} /></div>
            <div className="empty-title">Sin vencimientos próximos</div>
          </div>
        ) : (
          <table>
            <thead><tr><th>Producto</th><th>SKU</th><th>Fecha vencimiento</th><th>Stock disponible</th></tr></thead>
            <tbody>
              {expiring.map(p => (
                <tr key={p.id}>
                  <td><div className="name-cell">{p.name}</div></td>
                  <td><span className="sku-cell">{p.sku}</span></td>
                  <td><span style={{ color: "var(--yellow)", fontFamily: "monospace" }}>{p.expiryDate}</span></td>
                  <td><span style={{ fontFamily: "monospace" }}>{p.stockQuantity}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── DASHBOARD VIEW ───────────────────────────────────────────────────────────
function DashboardView() {
  const stats = MOCK_STATS;
  const lowCount = MOCK_PRODUCTS.filter(p => p.lowStock).length;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green"><Icon name="package" size={20} /></div>
            <div className="stat-trend">↑ activos</div>
          </div>
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-label">Total productos</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue"><Icon name="pill" size={20} /></div>
          </div>
          <div className="stat-value">{stats.activeProducts}</div>
          <div className="stat-label">Productos activos</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon red"><Icon name="alert" size={20} /></div>
          </div>
          <div className="stat-value" style={{ color: lowCount > 0 ? "var(--red)" : "inherit" }}>{lowCount}</div>
          <div className="stat-label">Alertas stock bajo</div>
        </div>
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon yellow"><Icon name="calendar" size={20} /></div>
          </div>
          <div className="stat-value" style={{ color: stats.expiringSoonAlerts > 0 ? "var(--yellow)" : "inherit" }}>{stats.expiringSoonAlerts}</div>
          <div className="stat-label">Por vencer (30d)</div>
        </div>
      </div>

      {lowCount > 0 && (
        <div className="alert-strip" style={{ marginBottom: 24 }}>
          <Icon name="alert" size={18} />
          <strong>{lowCount} productos</strong> tienen stock por debajo del mínimo requerido. Revisar alertas.
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Resumen de inventario</div>
          <span className="badge badge-gray">Por categoría</span>
        </div>
        <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {CATEGORIES.map(cat => {
            const count = MOCK_PRODUCTS.filter(p => p.category === cat).length;
            return (
              <div key={cat} style={{ background: "var(--surface2)", borderRadius: "var(--radius-sm)", padding: "14px 16px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "monospace", marginBottom: 6 }}>{cat}</div>
                <div style={{ fontSize: 28, fontFamily: "'Syne', sans-serif", fontWeight: 800, letterSpacing: -1 }}>{count}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{CAT_LABELS[cat]}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function MediStockApp() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const toast = useToast();

  const alertCount = MOCK_PRODUCTS.filter(p => p.lowStock || p.expiringSoon).length;

  const handleLogout = () => { setUser(null); apiClient.setToken(null); };

  if (!user) return (
    <>
      <style>{styles}</style>
      <LoginPage onLogin={setUser} />
      <ToastContainer toasts={toast.toasts} />
    </>
  );

  const pageTitle = { dashboard: "Dashboard", inventory: "Inventario", alerts: "Alertas" }[page];

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        {/* SIDEBAR */}
        <nav className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">
              <div className="logo-icon">MS</div>
              <div>
                <div className="logo-text">MediStock</div>
                <div className="logo-sub">Inventario médico</div>
              </div>
            </div>
          </div>

          <div className="sidebar-nav">
            <div className="nav-label">Navegación</div>
            {[
              { id: "dashboard", icon: "dashboard", label: "Dashboard" },
              { id: "inventory", icon: "inventory", label: "Inventario" },
              { id: "alerts", icon: "alert", label: "Alertas", badge: alertCount > 0 ? alertCount : null },
            ].map(item => (
              <button key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
                <Icon name={item.icon} size={18} />
                {item.label}
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}
          </div>

          <div className="sidebar-user">
            <div className="user-avatar">{user.fullName?.[0] || user.username[0].toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user.fullName || user.username}</div>
              <div className="user-role">{user.role}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
              <Icon name="logout" size={16} />
            </button>
          </div>
        </nav>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <div className="topbar-title">{pageTitle}</div>
          </div>
          <div className="content">
            {page === "dashboard" && <DashboardView />}
            {page === "inventory" && <InventoryView toast={toast} />}
            {page === "alerts" && <AlertsView />}
          </div>
        </main>
      </div>
      <ToastContainer toasts={toast.toasts} />
    </>
  );
}