import { useState, useEffect, useCallback, useReducer } from "react";
import { initMercadoPago } from '@mercadopago/sdk-react';

// ─── API CLIENT ───────────────────────────────────────────────────────────────
const API = "http://localhost:8081/api";
const MP_PUBLIC_KEY = "APP_USR-9a5edfc0-5ae7-4915-a56b-2cf940063617";
initMercadoPago(MP_PUBLIC_KEY, { locale: 'es-CL' });

const api = {
  token: null,
  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem("store_token", t);
    else localStorage.removeItem("store_token");
  },
  getToken() { return this.token || localStorage.getItem("store_token"); },
  headers() {
    const h = { "Content-Type": "application/json" };
    const t = this.getToken();
    if (t) h["Authorization"] = `Bearer ${t}`;
    return h;
  },
  async req(method, path, body) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error del servidor");
    return data; // { success, message, data: ... }
  },
  get:  (p)    => api.req("GET",  p),
  post: (p, b) => api.req("POST", p, b),
};

// ─── FORMATO CLP/USD ─────────────────────────────────────────────────────────────
const clp = (value) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value)));

const usd = (clpValue) => {
  const rate = 0.0011;
  const converted = clpValue * rate;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(converted);
};

// ─── CART REDUCER ─────────────────────────────────────────────────────────────
const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD": {
      const existing = state.find(i => i.id === action.product.id);
      if (existing) {
        return state.map(i =>
          i.id === action.product.id
            ? { ...i, qty: Math.min(i.qty + 1, i.stockQuantity) }
            : i
        );
      }
      return [...state, { ...action.product, qty: 1 }];
    }
    case "REMOVE": return state.filter(i => i.id !== action.id);
    case "QTY":    return state.map(i => i.id === action.id ? { ...i, qty: Math.max(1, Math.min(action.qty, i.stockQuantity)) } : i);
    case "CLEAR":  return [];
    default:       return state;
  }
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --bg: #f8fafc;
    --white: #ffffff;
    --surface: #f1f5f9;
    --border: #e2e8f0;
    --text: #0f172a;
    --text-muted: #64748b;
    --text-dim: #94a3b8;
    --accent: #0ea5e9;
    --accent-dark: #0284c7;
    --accent-dim: rgba(14,165,233,0.1);
    --green: #10b981;
    --green-dim: rgba(16,185,129,0.1);
    --red: #ef4444;
    --red-dim: rgba(239,68,68,0.1);
    --yellow: #f59e0b;
    --yellow-dim: rgba(245,158,11,0.1);
    --mp-blue: #009ee3;
    --radius: 14px;
    --radius-sm: 8px;
    --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
    --shadow-md: 0 4px 16px rgba(0,0,0,0.1);
    --shadow-lg: 0 20px 40px rgba(0,0,0,0.12);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Outfit', sans-serif; background: var(--bg); color: var(--text); font-size: 15px; line-height: 1.6; }

  .nav { background: var(--white); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; box-shadow: var(--shadow); }
  .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; height: 64px; display: flex; align-items: center; gap: 16px; }
  .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; cursor: pointer; background: none; border: none; }
  .logo-dot { width: 36px; height: 36px; background: linear-gradient(135deg, var(--accent), #7c3aed); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 14px; font-family: 'Syne', sans-serif; }
  .logo-name { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 18px; color: var(--text); }
  .logo-tag { font-size: 11px; color: var(--text-muted); margin-top: -2px; }
  .nav-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
  .nav-btn { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 50px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; font-family: 'Outfit', sans-serif; transition: all 0.15s; }
  .nav-btn-ghost { background: none; color: var(--text-muted); }
  .nav-btn-ghost:hover { background: var(--surface); color: var(--text); }
  .nav-btn-primary { background: var(--accent); color: white; }
  .nav-btn-primary:hover { background: var(--accent-dark); }
  .cart-btn { background: var(--surface); border: 1px solid var(--border); color: var(--text); padding: 8px 16px; border-radius: 50px; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; font-family: 'Outfit', sans-serif; }
  .cart-btn:hover { border-color: var(--accent); color: var(--accent); }
  .cart-badge { background: var(--accent); color: white; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 20px; font-family: 'DM Mono', monospace; }
  .user-chip { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: var(--accent-dim); border-radius: 50px; font-size: 13px; color: var(--accent-dark); font-weight: 500; }
  .user-avatar-sm { width: 24px; height: 24px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 700; }

  .page { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }

  .hero { background: linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%); padding: 64px 24px; text-align: center; color: white; margin-bottom: 48px; }
  .hero h1 { font-family: 'Syne', sans-serif; font-size: 40px; font-weight: 800; margin-bottom: 12px; letter-spacing: -1px; }
  .hero p { font-size: 18px; opacity: 0.85; max-width: 480px; margin: 0 auto 28px; }
  .hero-search { display: flex; max-width: 440px; margin: 0 auto; background: white; border-radius: 50px; overflow: hidden; box-shadow: var(--shadow-lg); }
  .hero-search input { flex: 1; border: none; outline: none; padding: 14px 20px; font-size: 15px; font-family: 'Outfit', sans-serif; color: var(--text); }
  .hero-search button { background: var(--accent); color: white; border: none; padding: 0 24px; cursor: pointer; font-weight: 600; font-size: 14px; font-family: 'Outfit', sans-serif; }
  .hero-search button:hover { background: var(--accent-dark); }

  .section-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.3px; }
  .cat-grid { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 36px; }
  .cat-chip { padding: 8px 18px; border-radius: 50px; border: 1.5px solid var(--border); background: white; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s; color: var(--text-muted); }
  .cat-chip:hover { border-color: var(--accent); color: var(--accent); }
  .cat-chip.active { background: var(--accent); color: white; border-color: var(--accent); }

  .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; margin-bottom: 48px; }
  .product-card { background: white; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: all 0.2s; box-shadow: var(--shadow); display: flex; flex-direction: column; }
  .product-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: #cbd5e1; }
  .product-img { height: 140px; background: linear-gradient(135deg, var(--accent-dim), rgba(124,58,237,0.08)); display: flex; align-items: center; justify-content: center; font-size: 48px; }
  .product-body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .product-cat { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--accent); font-family: 'DM Mono', monospace; }
  .product-name { font-weight: 600; font-size: 15px; line-height: 1.3; }
  .product-maker { font-size: 12px; color: var(--text-muted); }
  .product-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); }
  .product-price { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 20px; color: var(--text); }
  .product-stock { font-size: 11px; color: var(--text-muted); }
  .product-stock.low { color: var(--red); font-weight: 600; }
  .add-btn { background: var(--accent); color: white; border: none; padding: 8px 14px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'Outfit', sans-serif; display: flex; align-items: center; gap: 5px; }
  .add-btn:hover { background: var(--accent-dark); transform: scale(1.03); }
  .add-btn:disabled { background: var(--text-dim); cursor: not-allowed; transform: none; }

  .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; backdrop-filter: blur(2px); animation: fadeIn 0.2s; }
  .drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 420px; background: white; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; animation: slideIn 0.25s; z-index: 201; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .drawer-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 12px; }
  .drawer-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; flex: 1; }
  .drawer-close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 6px; }
  .drawer-close:hover { background: var(--surface); color: var(--text); }
  .drawer-items { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .cart-item { display: flex; gap: 12px; align-items: center; background: var(--surface); border-radius: var(--radius-sm); padding: 12px; }
  .cart-item-icon { font-size: 28px; width: 40px; text-align: center; flex-shrink: 0; }
  .cart-item-info { flex: 1; min-width: 0; }
  .cart-item-name { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cart-item-price { font-size: 13px; color: var(--text-muted); }
  .qty-control { display: flex; align-items: center; gap: 6px; }
  .qty-btn { width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid var(--border); background: white; font-size: 16px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; color: var(--text); }
  .qty-btn:hover { border-color: var(--accent); color: var(--accent); }
  .qty-num { font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 500; min-width: 20px; text-align: center; }
  .remove-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; padding: 4px; border-radius: 4px; }
  .remove-btn:hover { color: var(--red); background: var(--red-dim); }
  .drawer-footer { padding: 20px 24px; border-top: 1px solid var(--border); }
  .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .total-label { font-size: 15px; color: var(--text-muted); font-weight: 500; }
  .total-amount { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: var(--text); }
  .checkout-btn { width: 100%; padding: 14px; border-radius: var(--radius-sm); background: var(--mp-blue); color: white; border: none; font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Outfit', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s; }
  .checkout-btn:hover { filter: brightness(1.1); }
  .checkout-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .empty-cart { text-align: center; padding: 48px 24px; color: var(--text-muted); }
  .empty-cart-icon { font-size: 48px; margin-bottom: 12px; }

  /* AUTH */
  .auth-page { min-height: 100vh; background: var(--bg); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .auth-card { background: white; border: 1px solid var(--border); border-radius: 20px; padding: 40px; width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); }
  .auth-logo { text-align: center; margin-bottom: 32px; }
  .auth-icon { width: 56px; height: 56px; background: linear-gradient(135deg, var(--accent), #7c3aed); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; color: white; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px; box-shadow: 0 8px 24px rgba(14,165,233,0.3); }
  .auth-title { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; }
  .auth-sub { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
  .tabs { display: flex; border-bottom: 2px solid var(--border); margin-bottom: 28px; }
  .tab { flex: 1; padding: 12px; text-align: center; cursor: pointer; font-weight: 600; font-size: 14px; color: var(--text-muted); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.15s; }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
  .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .form-label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
  .form-input { background: var(--surface); border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 11px 14px; color: var(--text); font-size: 14px; font-family: 'Outfit', sans-serif; outline: none; transition: border-color 0.2s; }
  .form-input:focus { border-color: var(--accent); background: white; }
  .auth-btn { width: 100%; padding: 13px; border-radius: var(--radius-sm); background: var(--accent); color: white; border: none; font-size: 15px; font-weight: 600; cursor: pointer; font-family: 'Outfit', sans-serif; transition: all 0.15s; margin-top: 8px; }
  .auth-btn:hover { background: var(--accent-dark); }
  .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .error-box { background: var(--red-dim); border: 1px solid rgba(239,68,68,0.2); border-radius: var(--radius-sm); padding: 10px 14px; color: var(--red); font-size: 13px; margin-bottom: 16px; }
  .back-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 16px; color: var(--text-muted); font-size: 13px; cursor: pointer; background: none; border: none; font-family: 'Outfit', sans-serif; }
  .back-link:hover { color: var(--accent); }

  /* PAYMENT */
  .payment-page { min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 40px; }
  .payment-card { background: white; border: 1px solid var(--border); border-radius: 20px; padding: 48px; max-width: 480px; width: 100%; text-align: center; box-shadow: var(--shadow-md); }
  .payment-icon { font-size: 64px; margin-bottom: 20px; }
  .payment-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; margin-bottom: 8px; }
  .payment-sub { color: var(--text-muted); font-size: 15px; margin-bottom: 28px; }

  /* ORDERS */
  .orders-list { display: flex; flex-direction: column; gap: 16px; }
  .order-card { background: white; border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
  .order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
  .order-num { font-family: 'DM Mono', monospace; font-weight: 600; font-size: 15px; }
  .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; font-family: 'DM Mono', monospace; }
  .status-COMPLETED { background: var(--green-dim); color: var(--green); }
  .status-PENDING { background: var(--yellow-dim); color: var(--yellow); }
  .status-PROCESSING { background: var(--accent-dim); color: var(--accent); }
  .status-CANCELLED { background: var(--red-dim); color: var(--red); }
  .order-items { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
  .order-item-row { display: flex; justify-content: space-between; font-size: 14px; color: var(--text-muted); }
  .order-total { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px; }
  .order-total-label { font-weight: 600; }
  .order-total-amount { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 20px; }

  /* TOAST */
  .toast-wrap { position: fixed; bottom: 24px; right: 24px; z-index: 999; display: flex; flex-direction: column; gap: 8px; }
  .toast { background: var(--text); color: white; border-radius: var(--radius-sm); padding: 12px 18px; font-size: 14px; box-shadow: var(--shadow-md); animation: slideIn 0.2s; display: flex; align-items: center; gap: 8px; min-width: 240px; }
  .toast.success { background: var(--green); }
  .toast.error { background: var(--red); }

  .loading { text-align: center; padding: 60px; color: var(--text-muted); font-size: 15px; }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: var(--radius-sm); font-size: 14px; font-weight: 500; cursor: pointer; border: none; font-family: 'Outfit', sans-serif; transition: all 0.15s; }
  .btn-primary { background: var(--accent); color: white; }
  .btn-primary:hover { background: var(--accent-dark); }
  .page-title { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; margin-bottom: 8px; }
  .page-sub { color: var(--text-muted); margin-bottom: 28px; }
`;

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 18 }) => {
  const icons = {
    cart:   <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
    x:      <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    plus:   <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    check:  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
    logout: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    orders: <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    trash:  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>,
    user:   <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    back:   <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  };
  return icons[name] || null;
};

const catEmoji = { MEDICAMENTO: "💊", CONSUMIBLE: "🩺", INSTRUMENTAL: "🔬", EQUIPO: "⚕️", REACTIVO: "🧪", OTRO: "📦" };
const catImage = {
  MEDICAMENTO: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?w=300",
  CONSUMIBLE:  "https://images.pexels.com/photos/4031867/pexels-photo-4031867.jpeg?w=300",
  INSTRUMENTAL:"https://images.pexels.com/photos/4225880/pexels-photo-4225880.jpeg?w=300",
  EQUIPO:      "https://images.pexels.com/photos/7659564/pexels-photo-7659564.jpeg?w=300",
  REACTIVO:    "https://images.pexels.com/photos/3992933/pexels-photo-3992933.jpeg?w=300",
  OTRO:        "https://images.pexels.com/photos/4226264/pexels-photo-4226264.jpeg?w=300",
};
const catLabel = { MEDICAMENTO: "Medicamentos", CONSUMIBLE: "Consumibles", INSTRUMENTAL: "Instrumental", EQUIPO: "Equipos", REACTIVO: "Reactivos", OTRO: "Otros" };

// ─── TOAST ────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, show };
}

// ─── MOCK FALLBACK ────────────────────────────────────────────────────────────
const MOCK = [
  { id: 1, name: "Paracetamol 500mg",      sku: "MED-001", category: "MEDICAMENTO", price: 2500,  stockQuantity: 120,  manufacturer: "Farma SA",    status: "ACTIVE" },
  { id: 2, name: "Amoxicilina 250mg/5ml",  sku: "MED-002", category: "MEDICAMENTO", price: 8900,  stockQuantity: 45,   manufacturer: "BioMed",      status: "ACTIVE" },
  { id: 3, name: "Jeringa 5ml",            sku: "CON-001", category: "CONSUMIBLE",  price: 350,   stockQuantity: 500,  manufacturer: "MedSupply",   status: "ACTIVE" },
  { id: 4, name: "Termómetro Digital",     sku: "EQU-001", category: "EQUIPO",      price: 45000, stockQuantity: 12,   manufacturer: "Welch Allyn", status: "ACTIVE" },
  { id: 5, name: "Ibuprofeno 400mg",       sku: "MED-003", category: "MEDICAMENTO", price: 3200,  stockQuantity: 80,   manufacturer: "Farma SA",    status: "ACTIVE" },
  { id: 6, name: "Guantes Nitrilo L",      sku: "CON-002", category: "CONSUMIBLE",  price: 150,   stockQuantity: 1200, manufacturer: "SafeHand",    status: "ACTIVE" },
  { id: 7, name: "Bisturí N°22",           sku: "INS-001", category: "INSTRUMENTAL",price: 1800,  stockQuantity: 80,   manufacturer: "SurgTech",    status: "ACTIVE" },
  { id: 8, name: "Omeprazol 20mg",         sku: "MED-004", category: "MEDICAMENTO", price: 5600,  stockQuantity: 60,   manufacturer: "PharmaCo",    status: "ACTIVE" },
];

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin, onBack }) {
  const [tab, setTab]       = useState("login");
  const [form, setForm]     = useState({ username: "", password: "", email: "", fullName: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = async () => {
    if (!form.username || !form.password) { setError("Completa todos los campos"); return; }
    setLoading(true); setError("");
    try {
      // El backend devuelve: { success, message, data: { token, tokenType, expiresIn, user } }
      const res = await api.post("/auth/login", { username: form.username, password: form.password });
      const { token, user } = res.data;
      api.setToken(token);
      onLogin(user);
    } catch (e) {
      setError(e.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.username || !form.password || !form.email || !form.fullName) {
      setError("Completa todos los campos"); return;
    }
    setLoading(true); setError("");
    try {
      await api.post("/auth/register", { ...form, role: "STAFF" });
      // Login automático tras registro
      const res = await api.post("/auth/login", { username: form.username, password: form.password });
      const { token, user } = res.data;
      api.setToken(token);
      onLogin(user);
    } catch (e) {
      setError(e.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-icon">MS</div>
          <div className="auth-title">MediStock Store</div>
          <div className="auth-sub">Tu farmacia de confianza</div>
        </div>

        <div className="tabs">
          <div className={`tab ${tab === "login" ? "active" : ""}`}
            onClick={() => { setTab("login"); setError(""); }}>Iniciar sesión</div>
          <div className={`tab ${tab === "register" ? "active" : ""}`}
            onClick={() => { setTab("register"); setError(""); }}>Crear cuenta</div>
        </div>

        {error && <div className="error-box">{error}</div>}

        {tab === "login" ? (
          <>
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <input className="form-input" value={form.username}
                onChange={e => setF("username", e.target.value)}
                placeholder="Tu usuario"
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" value={form.password}
                onChange={e => setF("password", e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && handleLogin()} />
            </div>
            <button className="auth-btn" onClick={handleLogin} disabled={loading}>
              {loading ? "Ingresando…" : "Ingresar"}
            </button>
          </>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" value={form.fullName}
                onChange={e => setF("fullName", e.target.value)} placeholder="Juan Pérez" />
            </div>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input className="form-input" type="email" value={form.email}
                onChange={e => setF("email", e.target.value)} placeholder="tu@correo.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <input className="form-input" value={form.username}
                onChange={e => setF("username", e.target.value)} placeholder="usuario123" />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" value={form.password}
                onChange={e => setF("password", e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <button className="auth-btn" onClick={handleRegister} disabled={loading}>
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </button>
          </>
        )}

        {/* Volver sin necesidad de login */}
        <button className="back-link" onClick={onBack}>
          <Icon name="back" size={14} /> Volver a la tienda
        </button>
      </div>
    </div>
  );
}

// ─── CATALOG PAGE ─────────────────────────────────────────────────────────────
function CatalogPage({ cart, dispatch, toast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [cat, setCat]           = useState("ALL");

  useEffect(() => {
    api.get("/store/products?size=50")
      .then(r => setProducts(r.data?.content || r.data || MOCK))
      .catch(() => setProducts(MOCK))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    const matchCat    = cat === "ALL" || p.category === cat;
    return matchSearch && matchCat && p.status === "ACTIVE";
  });

  const addToCart = (product) => {
    dispatch({ type: "ADD", product });
    toast.show(`${product.name} agregado al carrito`);
  };

  const inCart = (id) => cart.find(i => i.id === id)?.qty || 0;

  if (loading) return <div className="loading">Cargando productos…</div>;

  return (
    <div>
      <div className="hero">
        <h1>Tu salud, nuestra prioridad</h1>
        <p>Encuentra medicamentos y productos médicos de calidad</p>
        <div className="hero-search">
          <input placeholder="Buscar medicamentos, equipos…" value={search}
            onChange={e => setSearch(e.target.value)} />
          <button>Buscar</button>
        </div>
      </div>

      <div className="page">
        <div className="cat-grid">
          <div className={`cat-chip ${cat === "ALL" ? "active" : ""}`} onClick={() => setCat("ALL")}>Todos</div>
          {Object.keys(catLabel).map(c => (
            <div key={c} className={`cat-chip ${cat === c ? "active" : ""}`} onClick={() => setCat(c)}>
              {catEmoji[c]} {catLabel[c]}
            </div>
          ))}
        </div>

        <div className="section-title">
          {cat === "ALL" ? "Todos los productos" : catLabel[cat]}{" "}
          <span style={{ fontSize: 15, fontWeight: 400, color: "var(--text-muted)" }}>({filtered.length})</span>
        </div>

        <div className="products-grid">
          {filtered.map(p => {
            const qty = inCart(p.id);
            return (
              <div key={p.id} className="product-card">
                  <div className="product-img">
                    <img 
                      src={p.imageUrl || catImage[p.category]}
                      alt={p.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.style.display = "none"; e.target.parentNode.innerHTML = catEmoji[p.category] || "📦"; }}
                    />
                  </div>
                <div className="product-body">
                  <div className="product-cat">{catLabel[p.category]}</div>
                  <div className="product-name">{p.name}</div>
                  {p.manufacturer && <div className="product-maker">{p.manufacturer}</div>}
                  <div className="product-footer">
                    <div>
                      <div className="product-price">
                        {clp(p.price)}
                        <span style={{ fontSize: "0.75rem", color: "#888", marginLeft: "6px" }}>
                          {usd(p.price)}
                        </span>
                      </div>
                      <div className={`product-stock ${p.stockQuantity < 10 ? "low" : ""}`}>
                        {p.stockQuantity < 10 ? `¡Solo ${p.stockQuantity} disponibles!` : `Stock: ${p.stockQuantity}`}
                      </div>
                    </div>
                    <button className="add-btn" onClick={() => addToCart(p)}
                      disabled={p.stockQuantity === 0 || qty >= p.stockQuantity}>
                      {qty > 0
                        ? <><Icon name="check" size={14} /> {qty}</>
                        : <><Icon name="plus" size={14} /> Agregar</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── CART DRAWER ──────────────────────────────────────────────────────────────
function CartDrawer({ cart, dispatch, onClose, onCheckout, user, onGoToAuth }) {
  const total   = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    // Si no está logueado, redirigir a auth
    if (!user) {
      onClose();
      onGoToAuth();
      return;
    }
    setLoading(true);
    try {
      const orderItems = cart.map(i => ({ productId: i.id, quantity: i.qty }));
      const orderRes   = await api.post("/store/orders", { items: orderItems });
      const orderId    = orderRes.data?.id;
      const prefRes    = await api.post("/store/payments/create-preference", { orderId });
      const url        = prefRes.data?.sandboxInitPoint || prefRes.data?.initPoint;
      if (url) { window.location.href = url; }
      else { onCheckout(orderId); }
      dispatch({ type: "CLEAR" });
    } catch {
      onCheckout(null);
      dispatch({ type: "CLEAR" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <Icon name="cart" size={20} />
          <div className="drawer-title">Tu carrito</div>
          <button className="drawer-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="drawer-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Tu carrito está vacío</div>
              <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Agrega productos para comenzar</div>
            </div>
          ) : cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-icon">{catEmoji[item.category]}</div>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">{clp(item.price)} c/u</div>
              </div>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => dispatch({ type: "QTY", id: item.id, qty: item.qty - 1 })}>−</button>
                <span className="qty-num">{item.qty}</span>
                <button className="qty-btn" onClick={() => dispatch({ type: "QTY", id: item.id, qty: item.qty + 1 })}>+</button>
              </div>
              <button className="remove-btn" onClick={() => dispatch({ type: "REMOVE", id: item.id })}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="total-row">
              <span className="total-label">Total</span>
                  <span className="total-amount">
                    {clp(total)}
                    <span style={{ fontSize: "0.8rem", color: "#888", marginLeft: "8px" }}>
                      {usd(total)}
                    </span>
                  </span>
            </div>
            {!user && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, textAlign: "center" }}>
                Debes iniciar sesión para completar la compra
              </div>
            )}
            <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
              {loading ? "Procesando…" : user
                ? <><span>Pagar con</span><span style={{ fontWeight: 800 }}>Mercado Pago</span></>
                : <><Icon name="user" size={16} /><span>Iniciar sesión para pagar</span></>}
            </button>
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-dim)", marginTop: 10 }}>
              🔒 Pago seguro con MercadoPago
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── PAYMENT RESULT ───────────────────────────────────────────────────────────
function PaymentResult({ status, onBack }) {
  const configs = {
    success: { icon: "✅", title: "¡Pago exitoso!",   sub: "Tu pedido fue confirmado y está siendo procesado.", color: "var(--green)",  btn: "Volver a la tienda" },
    failure: { icon: "❌", title: "Pago rechazado",    sub: "No se pudo procesar tu pago. Intenta de nuevo.",    color: "var(--red)",    btn: "Intentar de nuevo" },
    pending: { icon: "⏳", title: "Pago pendiente",    sub: "Tu pago está siendo verificado. Te avisaremos.",    color: "var(--yellow)", btn: "Ver mis pedidos" },
  };
  const c = configs[status] || configs.success;
  return (
    <div className="payment-page">
      <div className="payment-card">
        <div className="payment-icon">{c.icon}</div>
        <div className="payment-title" style={{ color: c.color }}>{c.title}</div>
        <div className="payment-sub">{c.sub}</div>
        <button className="btn btn-primary" onClick={onBack} style={{ margin: "0 auto" }}>{c.btn}</button>
      </div>
    </div>
  );
}

// ─── ORDERS PAGE ──────────────────────────────────────────────────────────────
function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/store/orders?size=20")
      .then(r => setOrders(r.data?.content || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const STATUS_LABEL = { PENDING: "Pendiente", PROCESSING: "En proceso", COMPLETED: "Completado", CANCELLED: "Cancelado", APPROVED: "Aprobado" };

  if (loading) return <div className="page"><div className="loading">Cargando pedidos…</div></div>;

  return (
    <div className="page">
      <div className="page-title">Mis pedidos</div>
      <div className="page-sub">Historial de todas tus compras</div>
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>No tienes pedidos aún</div>
          <div style={{ fontSize: 14 }}>Cuando hagas tu primera compra aparecerá aquí</div>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(o => (
            <div key={o.id} className="order-card">
              <div className="order-header">
                <div>
                  <div className="order-num">{o.orderNumber}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {new Date(o.createdAt).toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" })}
                  </div>
                </div>
                <span className={`status-badge status-${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span>
              </div>
              <div className="order-items">
                {o.items?.map(i => (
                  <div key={i.id} className="order-item-row">
                    <span>{i.productName} × {i.quantity}</span>
                    <span>{clp(i.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <span className="order-total-label">Total</span>
                <span className="order-total-amount">{clp(o.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function StoreApp() {
  const [user, setUser] = useState(null);
  const [page, setPage]               = useState("catalog");
  const [cartOpen, setCartOpen]       = useState(false);
  const [paymentStatus, setPayStatus] = useState(null);
  const [cart, dispatch]              = useReducer(cartReducer, []);
  const toast                         = useToast();
  const [usdRate, setUsdRate] = useState(0.0011);

  // Detectar retorno de MercadoPago por URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("orderId")) {
      const status = window.location.pathname.includes("success") ? "success"
        : window.location.pathname.includes("failure") ? "failure" : "pending";
      setPayStatus(status);
      setPage("payment-result");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
  fetch("http://localhost:8081/api/exchange/convert?from=CLP&to=USD&amount=1")
    .then(r => r.json())
    .then(data => { if (data.success) setUsdRate(data.data.rate); })
    .catch(() => {});
}, []);

  const cartCount  = cart.reduce((s, i) => s + i.qty, 0);

const handleLogin = (u) => { setUser(u); setPage("catalog"); };
  // ✅ FIX: ya no hay guardia "if (!user) setPage('catalog')" que pisaba la navegación
  const handleLogout = () => { setUser(null); api.setToken(null); setPage("catalog"); };

  return (
    <>
      <style>{styles}</style>

      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <button className="nav-logo" onClick={() => setPage("catalog")}>
            <div className="logo-dot">MS</div>
            <div>
              <div className="logo-name">MediStock</div>
              <div className="logo-tag">Farmacia en línea</div>
            </div>
          </button>

          <div className="nav-actions">
            {user ? (
              <>
                <button className="nav-btn nav-btn-ghost" onClick={() => setPage("orders")}>
                  <Icon name="orders" size={16} /> Mis pedidos
                </button>
                <div className="user-chip">
                  <div className="user-avatar-sm">{(user.fullName || user.username || "U")[0].toUpperCase()}</div>
                  {user.fullName || user.username}
                </div>
                <button className="nav-btn nav-btn-ghost" onClick={handleLogout} title="Cerrar sesión">
                  <Icon name="logout" size={16} />
                </button>
              </>
            ) : (
              /* ✅ FIX: setPage("auth") ahora funciona — no hay guardia que lo cancele */
              <button className="nav-btn nav-btn-primary" onClick={() => setPage("auth")}>
                <Icon name="user" size={16} /> Iniciar sesión
              </button>
            )}

            <button className="cart-btn" onClick={() => setCartOpen(true)}>
              <Icon name="cart" size={18} />
              Carrito
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* PÁGINAS */}
      {page === "catalog"        && <CatalogPage cart={cart} dispatch={dispatch} toast={toast} />}
      {page === "auth"           && <AuthPage onLogin={handleLogin} onBack={() => setPage("catalog")} />}
      {page === "orders"         && user && <OrdersPage />}
      {page === "payment-result" && <PaymentResult status={paymentStatus} onBack={() => setPage("catalog")} />}

      {/* CARRITO */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          dispatch={dispatch}
          onClose={() => setCartOpen(false)}
          user={user}
          onGoToAuth={() => setPage("auth")}
          onCheckout={() => {
            setCartOpen(false);
            setPayStatus("success");
            setPage("payment-result");
          }}
        />
      )}

      {/* TOASTS */}
      <div className="toast-wrap">
        {toast.toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === "success" ? "✓" : "!"} {t.msg}
          </div>
        ))}
      </div>
    </>
  );
}