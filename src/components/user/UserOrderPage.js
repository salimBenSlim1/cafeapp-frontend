import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronDown, WifiOff, Star, Tag, ArrowLeft, Info } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import ChatbotWaiter from '../ChatbotWaiter';
import OrderTracker from './OrderTracker';

/* ─── category meta ─────────────────────────────────────────────────── */
const CAT_META = {
  all:     { emoji: '✦',  label: 'All',      gradient: 'linear-gradient(135deg,#1bcbe0,#1a6dd4)' },
  coffee:  { emoji: '☕', label: 'Coffee',   gradient: 'linear-gradient(135deg,#c9933a,#7c4a1e)' },
  food:    { emoji: '🍽', label: 'Food',     gradient: 'linear-gradient(135deg,#34d399,#059669)' },
  drink:   { emoji: '🥤', label: 'Drinks',   gradient: 'linear-gradient(135deg,#818cf8,#4f46e5)' },
  dessert: { emoji: '🍰', label: 'Desserts', gradient: 'linear-gradient(135deg,#f472b6,#db2777)' },
  games:   { emoji: '🎲', label: 'Games',    gradient: 'linear-gradient(135deg,#fb923c,#ea580c)' },
  smoking: { emoji: '🚬', label: 'Smoking',  gradient: 'linear-gradient(135deg,#94a3b8,#475569)' },
};

/* ─── Item Detail Modal ─────────────────────────────────────────────── */
function ItemModal({ product, onClose }) {
  const [visible, setVisible] = useState(false);
  const cm = CAT_META[product.category] || { emoji: '✦', label: product.category, gradient: 'linear-gradient(135deg,#1bcbe0,#1a6dd4)' };

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => setVisible(true));
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  return (
    <div className={`modal-backdrop${visible ? ' modal-backdrop-in' : ''}`} onClick={handleClose}>
      <div
        className={`modal-sheet${visible ? ' modal-sheet-in' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Image hero ── */}
        <div className="modal-img-wrap">
          <img className="modal-img" src={product.imageUrl} alt={product.name} />
          <div className="modal-img-overlay" />

          {/* Gradient orb behind image for depth */}
          <div className="modal-img-orb" style={{ background: cm.gradient }} />

          {/* Close button */}
          <button className="modal-close" onClick={handleClose} aria-label="Close">
            <ArrowLeft size={16} />
          </button>

          {/* Category badge */}
          <div className="modal-cat-badge" style={{ background: cm.gradient }}>
            <span>{cm.emoji}</span>
            <span>{cm.label}</span>
          </div>

          {/* OOS overlay */}
          {!product.stock && (
            <div className="modal-oos-veil">
              <span className="modal-oos-tag">Sold out</span>
            </div>
          )}

          {/* Price on image */}
          <div className="modal-price-hero">
            <span className="modal-price-num">{product.price.toFixed(2)}</span>
            <span className="modal-price-cur">TND</span>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="modal-content">
          {/* Name */}
          <h2 className="modal-name">{product.name}</h2>

          {/* Decorative divider */}
          <div className="modal-divider">
            <span className="modal-div-line" />
            <span className="modal-div-gem" style={{ background: cm.gradient }}>✦</span>
            <span className="modal-div-line" />
          </div>

          {/* Description */}
          {product.description ? (
            <div className="modal-desc-wrap">
              <div className="modal-desc-icon">
                <Info size={13} />
              </div>
              <p className="modal-desc">{product.description}</p>
            </div>
          ) : (
            <p className="modal-no-desc">No description available.</p>
          )}

          {/* Meta chips */}
          <div className="modal-meta-row">
            <div className="modal-meta-chip">
              <Tag size={11} />
              <span>{cm.label}</span>
            </div>
            <div className={`modal-meta-chip${product.stock ? ' modal-meta-available' : ' modal-meta-oos'}`}>
              <span className="modal-meta-dot" />
              <span>{product.stock ? 'Available' : 'Sold out'}</span>
            </div>
          </div>

          {/* Bottom price strip */}
          <div className="modal-price-strip">
            <div>
              <div className="modal-strip-label">Price</div>
              <div className="modal-strip-price">
                {product.price.toFixed(2)} <small>TND</small>
              </div>
            </div>
            <div className="modal-strip-cat" style={{ background: cm.gradient }}>
              {cm.emoji}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════ */
export default function UserOrderPage() {
  const [products, setProducts]             = useState([]);
  const [filtered, setFiltered]             = useState([]);
  const [search, setSearch]                 = useState('');
  const [cat, setCat]                       = useState('all');
  const [sessionActive, setSessionActive]   = useState(false);
  const [loading, setLoading]               = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [cafeName, setCafeName]             = useState('');
  const [tableId, setTableId]               = useState('');
  const [heroVisible, setHeroVisible]       = useState(false);
  const [online, setOnline]                 = useState(navigator.onLine);
  const [selectedProduct, setSelectedProduct] = useState(null); // ← modal
  const searchRef                           = useRef(null);

  const API      = process.env.REACT_APP_API_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const qp       = new URLSearchParams(location.search);
  const qrKey    = qp.get('t');

  /* ── connectivity banner ─────────────────────────────────────────── */
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  /* ── session bootstrap ───────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const tok = localStorage.getItem('userToken');
        if (tok) {
          try {
            const r = await axios.get(`${API}/getUserItems`, { headers: { Authorization: `Bearer ${tok}` } });
            setProducts(r.data.data);
            setFiltered(r.data.data);
            setTableId(sessionStorage.getItem('tai') || '');
            setSessionActive(true);
            setLoading(false);
            setTimeout(() => setHeroVisible(true), 80);
            return;
          } catch { localStorage.removeItem('userToken'); }
        }
        if (!qrKey) { setLoading(false); setSessionActive(false); return; }
        const r = await axios.get(`${API}/start-session`, { params: { key: qrKey } });
        const { token, cafeId,tableId } = r.data;
        setCafeName(cafeId);
        localStorage.setItem('userToken', token);
        localStorage.setItem('tableId', tableId);
        setTableId(tableId)
        qp.delete('t');
        navigate(`${location.pathname}${qp.toString() ? `?${qp}` : ''}`, { replace: true });

        const r2 = await axios.get(`${API}/getUserItems`, { headers: { Authorization: `Bearer ${token}` } });
        setProducts(r2.data.data);
        setFiltered(r2.data.data);
      
        setSessionActive(true);
        setLoading(false);
        setTimeout(() => setHeroVisible(true), 80);
      } catch (err) {
        if (err.response?.status === 404)  alert('Invalid QR code.');
        else if (err.response?.status === 403) alert(err.response?.data?.error || 'Table inactive.');
        else if (err.response?.status === 410) expire();
        else if (err.response?.status === 451) alert('Too far from the café.');
        setLoading(false);
        setSessionActive(false);
      }
    })();
  }, []);



  const expire = () => {
    localStorage.removeItem('userToken');
    sessionStorage.removeItem('tai');
    setSessionExpired(true);
    setTimeout(() => { window.location.href = 'https://www.google.com'; }, 5000);
  };

  /* ── filter ──────────────────────────────────────────────────────── */
  useEffect(() => {
    let f = products;
    if (search) f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (cat !== 'all') f = f.filter(p => p.category === cat);
    setFiltered(f);
  }, [search, cat, products]);

  const availableCats = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  /* ── splash screens ──────────────────────────────────────────────── */
  const Splash = ({ type }) => (
    <div className="splash">
      <div className="splash-orb o1" /><div className="splash-orb o2" /><div className="splash-orb o3" />
      <div className="splash-card">
        <div className="splash-logo-ring">
          <img src="/images/coffai1.png" alt="CoffAI" style={{ width: 60, height: 60, objectFit: 'contain', position: 'relative', zIndex: 1 }} />
          <div className="splash-ring-anim" />
        </div>
        <h1 className="splash-h">
          {type === 'expired' ? 'See you soon!'   :
           type === 'loading' ? 'Setting up…'     : 'Welcome'}
        </h1>
        <p className="splash-p">
          {type === 'expired' ? `Thanks for visiting${cafeName ? ` ${cafeName}` : ''}. Have a great day 👋` :
           type === 'loading' ? 'Loading your menu, just a moment…' :
                                'Scan the QR code at your table to view the menu'}
        </p>
        {type !== 'inactive' && <div className="splash-spin" />}
      </div>
    </div>
  );

  if (sessionExpired) return <><style>{CSS}</style><Splash type="expired" /></>;
  if (loading)        return <><style>{CSS}</style><Splash type="loading" /></>;
  if (!sessionActive) return <><style>{CSS}</style><Splash type="inactive" /></>;

  /* ═══════════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{CSS}</style>

      {/* Item detail modal */}
      {selectedProduct && (
        <ItemModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* offline banner */}
      {!online && (
        <div className="offline-bar">
          <WifiOff size={13} /> No connection — reconnecting…
        </div>
      )}

      <div className={`root ${heroVisible ? 'root-on' : ''}`}>

        {/* atmosphere */}
        <div className="atm" aria-hidden>
          <div className="atm-1" /><div className="atm-2" /><div className="atm-3" />
          <div className="atm-grid" />
        </div>

        {/* ── HEADER ───────────────────────────────────────────────── */}
        <header className="hdr">
          <div className="hdr-in">
            <div className="brand">
              <div className="brand-logo">
                <img src="/images/coffai1.png" alt="" style={{ width: 38, height: 38, objectFit: 'contain', position: 'relative', zIndex: 1 }} />
                <div className="brand-glow" />
              </div>
              <div>
                <div className="brand-name">{cafeName + ' Menu' || 'Our Menu'}</div>
                <div className="brand-meta">
                  <span>Live menu</span>
                  {tableId && <><span className="sep">·</span><span>Table {tableId}</span></>}
                </div>
              </div>
            </div>
            <button className="srch-btn" onClick={() => searchRef.current?.focus()} aria-label="Search">
              <Search size={16} />
            </button>
          </div>
          <div className="srch-wrap">
            <Search size={14} className="srch-icon" />
            <input
              ref={searchRef}
              className="srch-input"
              type="text"
              placeholder="Search the menu…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="srch-clear" onClick={() => setSearch('')}><X size={13} /></button>
            )}
          </div>
        </header>

        {/* ── CATEGORIES ───────────────────────────────────────────── */}
        <div className="cats-scroll">
          <div className="cats-track">
            {availableCats.map(c => {
              const m  = CAT_META[c] || { emoji: '✦', label: c, gradient: 'linear-gradient(135deg,#1bcbe0,#1a6dd4)' };
              const on = cat === c;
              const n  = c === 'all' ? products.length : products.filter(p => p.category === c).length;
              return (
                <button
                  key={c}
                  className={`cat ${on ? 'cat-on' : ''}`}
                  style={on ? { background: m.gradient, borderColor: 'transparent' } : {}}
                  onClick={() => setCat(c)}
                >
                  <span className="cat-em">{m.emoji}</span>
                  <span className="cat-lb">{m.label}</span>
                  <span className="cat-n">{n}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DIVIDER ──────────────────────────────────────────────── */}
        <div className="divider">
          <span className="div-line" />
          <span className="div-txt">
            {cat === 'all' ? 'Full Menu' : (CAT_META[cat]?.label || cat)}
            <span className="div-n"> · {filtered.length}</span>
          </span>
          <span className="div-line" />
        </div>

        {/* ── GRID ─────────────────────────────────────────────────── */}
        <main className="grid-wrap">
          {filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-ico">☕</div>
              <p className="empty-t">Nothing found</p>
              <p className="empty-s">Try a different search or category</p>
              {search && (
                <button className="empty-reset" onClick={() => setSearch('')}>Clear search</button>
              )}
            </div>
          ) : (
            <div className="grid">
              {filtered.map((p, i) => {
                const oos = !p.stock;
                const cm  = CAT_META[p.category] || { emoji: '✦', gradient: 'linear-gradient(135deg,#1bcbe0,#1a6dd4)' };
                return (
                  <article
                    key={p.id}
                    className={`card${oos ? ' card-oos' : ''}`}
                    style={{ animationDelay: `${Math.min(i * 0.045, 0.38)}s` }}
                    onClick={() => setSelectedProduct(p)}
                  >
                    {/* image */}
                    <div className="card-img-wrap">
                      <img className="card-img" src={p.imageUrl} alt={p.name} loading="lazy" />
                      <div className="card-overlay" />
                      {oos && (
                        <div className="card-veil">
                          <span className="oos-tag">Sold out</span>
                        </div>
                      )}
                      <span className="card-cat-dot" style={{ background: cm.gradient }}>
                        {cm.emoji}
                      </span>
                      {/* tap hint */}
                      {!oos && (
                        <span className="card-tap-hint">Tap for details</span>
                      )}
                    </div>

                    {/* body */}
                    <div className="card-body">
                      <p className="card-name">{p.name}</p>
                      <div className="card-foot">
                        <span className="card-price">
                          {p.price.toFixed(2)}<small> TND</small>
                        </span>
                        {p.description && (
                          <span className="card-has-desc" title="Has description">
                            <Info size={11} />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="card-shimmer" />
                  </article>
                );
              })}
            </div>
          )}
          <div style={{ height: 110 }} />
        </main>
          <OrderTracker tableId={tableId}/>
        <ChatbotWaiter products={products} menuOnly />
      </div>
    </>
  );
}

/* ─── CSS ────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

:root{
  --bg:#07101e;--bg2:#0b1625;
  --sur:rgba(255,255,255,.04);--sur2:rgba(255,255,255,.08);
  --brd:rgba(255,255,255,.07);
  --cyan:#1bcbe0;--cyan2:#1a6dd4;
  --gold:#e8b86d;--gold2:#c9933a;
  --green:#34d399;--red:#f87171;
  --t:#ede7d6;--t2:#7a9ab8;--t3:#2b4460;
  --r:14px;--rl:22px;
  --serif:'DM Serif Display',Georgia,serif;
  --sans:'DM Sans',system-ui,sans-serif;
  --ease:cubic-bezier(.16,1,.3,1);
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{-webkit-tap-highlight-color:transparent;scroll-behavior:smooth;}
body{font-family:var(--sans);background:var(--bg);color:var(--t);overscroll-behavior:none;}
button{font-family:var(--sans);cursor:pointer;}
img{display:block;}

/* ═══════════════════ MODAL ═══════════════════ */
@keyframes modal-bd-in  { from{opacity:0} to{opacity:1} }
@keyframes modal-sh-in  { from{opacity:0;transform:translateY(100%)} to{opacity:1;transform:translateY(0)} }
@keyframes modal-content-in { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }

.modal-backdrop{
  position:fixed;inset:0;z-index:100;
  background:rgba(4,10,20,.82);
  backdrop-filter:blur(10px) saturate(140%);
  display:flex;align-items:flex-end;justify-content:center;
  opacity:0;transition:opacity .32s var(--ease);
}
.modal-backdrop-in{ opacity:1; }

.modal-sheet{
  width:100%;max-width:480px;
  background:var(--bg2);
  border-radius:28px 28px 0 0;
  border:1px solid var(--brd);border-bottom:none;
  overflow:hidden;
  transform:translateY(100%);
  transition:transform .38s var(--ease), opacity .32s var(--ease);
  opacity:0;
  max-height:92svh;
  display:flex;flex-direction:column;
  box-shadow:0 -24px 80px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.04);
}
.modal-sheet-in{ transform:translateY(0); opacity:1; }

/* Image hero */
.modal-img-wrap{
  position:relative;width:100%;height:260px;
  overflow:hidden;flex-shrink:0;
}
@media(min-height:700px){ .modal-img-wrap{ height:310px; } }

.modal-img{
  width:100%;height:100%;object-fit:cover;
  transition:transform .6s var(--ease);
}
.modal-sheet-in .modal-img{ transform:scale(1.04); }

.modal-img-overlay{
  position:absolute;inset:0;
  background:linear-gradient(
    to bottom,
    rgba(7,16,30,.15) 0%,
    transparent 35%,
    rgba(7,16,30,.5) 70%,
    rgba(7,16,30,.95) 100%
  );
  pointer-events:none;
}

.modal-img-orb{
  position:absolute;bottom:-60px;left:50%;transform:translateX(-50%);
  width:280px;height:120px;border-radius:50%;
  filter:blur(50px);opacity:.35;pointer-events:none;
}

/* Close */
.modal-close{
  position:absolute;top:14px;left:14px;
  width:36px;height:36px;border-radius:12px;border:none;
  background:rgba(7,16,30,.6);backdrop-filter:blur(12px);
  border:1px solid rgba(255,255,255,.1);
  color:var(--t);
  display:flex;align-items:center;justify-content:center;
  transition:all .18s;z-index:2;
}
.modal-close:hover{ background:rgba(7,16,30,.85);color:var(--gold); }
.modal-close:active{ transform:scale(.93); }

/* Category badge */
.modal-cat-badge{
  position:absolute;top:14px;right:14px;
  display:flex;align-items:center;gap:5px;
  padding:5px 11px;border-radius:999px;
  font-size:.65rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  color:#fff;z-index:2;
  box-shadow:0 4px 16px rgba(0,0,0,.4);
  border:1px solid rgba(255,255,255,.18);
}

/* OOS overlay */
.modal-oos-veil{
  position:absolute;inset:0;background:rgba(7,16,30,.72);
  backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;z-index:3;
}
.modal-oos-tag{
  padding:7px 20px;border-radius:999px;
  background:rgba(248,113,113,.1);color:#f87171;
  font-size:.75rem;font-weight:700;border:1px solid rgba(248,113,113,.25);
  letter-spacing:.1em;text-transform:uppercase;
}

/* Price on image */
.modal-price-hero{
  position:absolute;bottom:16px;right:16px;
  display:flex;align-items:baseline;gap:4px;
  z-index:2;
}
.modal-price-num{
  font-family:var(--serif);font-size:2.1rem;line-height:1;
  background:linear-gradient(135deg,var(--gold) 0%,#f5d99a 50%,var(--gold2) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.modal-price-cur{
  font-family:var(--sans);font-size:.7rem;font-weight:600;
  color:rgba(232,184,109,.55);letter-spacing:.08em;
}

/* Content area */
.modal-content{
  flex:1;overflow-y:auto;padding:22px 22px 28px;
  display:flex;flex-direction:column;gap:16px;
  scrollbar-width:none;
  animation:modal-content-in .45s .1s var(--ease) both;
}
.modal-content::-webkit-scrollbar{ display:none; }

.modal-name{
  font-family:var(--serif);font-size:1.75rem;line-height:1.15;
  background:linear-gradient(135deg,var(--t) 0%,#f5d99a 60%,var(--gold2) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}

/* Divider */
.modal-divider{
  display:flex;align-items:center;gap:12px;
}
.modal-div-line{
  flex:1;height:1px;
  background:linear-gradient(90deg,transparent,var(--brd),transparent);
}
.modal-div-gem{
  width:22px;height:22px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:.65rem;color:#fff;flex-shrink:0;
  box-shadow:0 2px 10px rgba(0,0,0,.4);
}

/* Description */
.modal-desc-wrap{
  display:flex;gap:10px;align-items:flex-start;
  background:rgba(255,255,255,.03);
  border:1px solid var(--brd);border-radius:14px;
  padding:14px 15px;
}
.modal-desc-icon{
  width:26px;height:26px;border-radius:8px;flex-shrink:0;
  background:rgba(232,184,109,.1);border:1px solid rgba(232,184,109,.2);
  display:flex;align-items:center;justify-content:center;
  color:var(--gold);margin-top:1px;
}
.modal-desc{
  font-size:.875rem;color:var(--t2);line-height:1.75;flex:1;
}
.modal-no-desc{
  font-size:.82rem;color:var(--t3);font-style:italic;text-align:center;padding:8px 0;
}

/* Meta chips */
.modal-meta-row{
  display:flex;gap:8px;flex-wrap:wrap;
}
.modal-meta-chip{
  display:flex;align-items:center;gap:6px;
  padding:6px 13px;border-radius:999px;
  border:1px solid var(--brd);background:var(--sur);
  font-size:.72rem;font-weight:500;color:var(--t2);
}
.modal-meta-available{
  border-color:rgba(52,211,153,.25);background:rgba(52,211,153,.07);color:#34d399;
}
.modal-meta-oos{
  border-color:rgba(248,113,113,.25);background:rgba(248,113,113,.07);color:#f87171;
}
.modal-meta-dot{
  width:6px;height:6px;border-radius:50%;background:currentColor;flex-shrink:0;
}

/* Bottom price strip */
.modal-price-strip{
  display:flex;align-items:center;justify-content:space-between;
  padding:16px 18px;
  background:rgba(232,184,109,.05);
  border:1px solid rgba(232,184,109,.15);
  border-radius:16px;
  margin-top:auto;
}
.modal-strip-label{
  font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:var(--t3);margin-bottom:4px;
}
.modal-strip-price{
  font-family:var(--serif);font-size:1.55rem;
  background:linear-gradient(135deg,var(--gold),var(--gold2));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.modal-strip-price small{
  font-family:var(--sans);font-size:.65rem;
  -webkit-text-fill-color:var(--t3);color:var(--t3);
}
.modal-strip-cat{
  width:46px;height:46px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:1.35rem;
  box-shadow:0 4px 18px rgba(0,0,0,.4);
  border:1px solid rgba(255,255,255,.15);
}

/* ═══════════════════ PAGE ═══════════════════ */
/* OFFLINE */
.offline-bar{
  position:fixed;top:0;left:0;right:0;z-index:99;
  background:rgba(248,113,113,.13);border-bottom:1px solid rgba(248,113,113,.28);
  color:#f87171;font-size:.7rem;font-weight:600;letter-spacing:.07em;
  padding:7px 16px;display:flex;align-items:center;gap:7px;
  backdrop-filter:blur(14px);
}

/* SPLASH */
.splash{min-height:100svh;display:flex;align-items:center;justify-content:center;background:var(--bg);position:relative;overflow:hidden;padding:32px;}
.splash-orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;}
.o1{width:560px;height:560px;background:var(--cyan);opacity:.055;top:-180px;right:-130px;}
.o2{width:480px;height:480px;background:var(--gold);opacity:.045;bottom:-140px;left:-110px;}
.o3{width:320px;height:320px;background:var(--cyan2);opacity:.04;top:50%;left:50%;transform:translate(-50%,-50%);}
.splash-card{position:relative;z-index:1;text-align:center;max-width:340px;}
.splash-logo-ring{width:110px;height:110px;border-radius:50%;margin:0 auto 28px;position:relative;background:rgba(232,184,109,.07);border:1px solid rgba(232,184,109,.18);display:flex;align-items:center;justify-content:center;box-shadow:0 0 60px rgba(232,184,109,.1);}
.splash-ring-anim{position:absolute;inset:-12px;border-radius:50%;border:1px dashed rgba(232,184,109,.2);animation:spin-slow 14s linear infinite;}
@keyframes spin-slow{to{transform:rotate(360deg);}}
.splash-h{font-family:var(--serif);font-size:2.1rem;color:var(--t);margin-bottom:13px;line-height:1.1;}
.splash-p{font-size:.88rem;color:var(--t2);line-height:1.78;margin-bottom:28px;}
.splash-spin{width:30px;height:30px;border-radius:50%;margin:0 auto;border:2px solid rgba(27,203,224,.1);border-top-color:var(--cyan);animation:spin .75s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

/* ROOT */
.root{min-height:100svh;position:relative;opacity:0;transition:opacity .55s var(--ease);}
.root-on{opacity:1;}

/* ATMOSPHERE */
.atm{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;}
.atm-1,.atm-2,.atm-3{position:absolute;border-radius:50%;filter:blur(115px);}
.atm-1{width:620px;height:620px;background:var(--cyan);opacity:.04;top:-200px;right:-140px;animation:af1 17s ease-in-out infinite;}
.atm-2{width:520px;height:520px;background:var(--cyan2);opacity:.038;bottom:-150px;left:-120px;animation:af2 21s ease-in-out infinite;}
.atm-3{width:360px;height:360px;background:var(--gold);opacity:.028;top:42%;left:46%;transform:translate(-50%,-50%);animation:af3 14s ease-in-out infinite;}
@keyframes af1{0%,100%{transform:translate(0,0);}50%{transform:translate(-18px,24px);}}
@keyframes af2{0%,100%{transform:translate(0,0);}50%{transform:translate(20px,-18px);}}
@keyframes af3{0%,100%{transform:translate(-50%,-50%);}50%{transform:translate(calc(-50% + 14px),calc(-50% + 10px));}}
.atm-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(27,203,224,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(27,203,224,.022) 1px,transparent 1px);background-size:52px 52px;mask-image:radial-gradient(ellipse 75% 75% at 50% 50%,black 10%,transparent 100%);}

/* HEADER */
.hdr{position:sticky;top:0;z-index:40;background:rgba(7,16,30,.9);backdrop-filter:blur(26px) saturate(180%);border-bottom:1px solid var(--brd);padding:0 16px 12px;}
.hdr-in{max-width:900px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 0 10px;}
.brand{display:flex;align-items:center;gap:11px;}
.brand-logo{position:relative;width:38px;height:38px;flex-shrink:0;}
.brand-glow{position:absolute;inset:-5px;border-radius:50%;background:radial-gradient(circle,rgba(232,184,109,.22),transparent 70%);animation:glow-pulse 3.5s ease-in-out infinite;}
@keyframes glow-pulse{0%,100%{opacity:.4;}50%{opacity:.9;}}
.brand-name{font-family:var(--serif);font-size:1.28rem;line-height:1;background:linear-gradient(135deg,var(--gold) 0%,#f5d99a 50%,var(--gold2) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.brand-meta{display:flex;align-items:center;gap:6px;font-size:.6rem;color:var(--t3);letter-spacing:.09em;text-transform:uppercase;margin-top:3px;}
.sep{opacity:.3;}
.srch-btn{width:37px;height:37px;border-radius:11px;border:1px solid var(--brd);background:var(--sur);color:var(--t2);display:flex;align-items:center;justify-content:center;transition:all .2s;}
.srch-btn:hover{background:var(--sur2);color:var(--t);}
.srch-wrap{position:relative;max-width:900px;margin:0 auto;}
.srch-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none;}
.srch-input{width:100%;padding:11px 40px;border-radius:var(--r);border:1px solid var(--brd);background:var(--sur);color:var(--t);font-family:var(--sans);font-size:.86rem;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;}
.srch-input::placeholder{color:var(--t3);}
.srch-input:focus{border-color:rgba(27,203,224,.35);box-shadow:0 0 0 3px rgba(27,203,224,.06);background:rgba(27,203,224,.025);}
.srch-clear{position:absolute;right:10px;top:50%;transform:translateY(-50%);width:23px;height:23px;border-radius:7px;border:none;background:var(--sur2);color:var(--t3);display:flex;align-items:center;justify-content:center;transition:all .15s;}
.srch-clear:hover{color:var(--t);}

/* CATEGORIES */
.cats-scroll{overflow-x:auto;scrollbar-width:none;padding:14px 0 2px;position:relative;z-index:1;}
.cats-scroll::-webkit-scrollbar{display:none;}
.cats-track{display:flex;gap:8px;padding:0 16px;width:max-content;}
.cat{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:999px;border:1px solid var(--brd);background:var(--sur);color:var(--t2);font-size:.77rem;font-weight:500;white-space:nowrap;transition:all .22s var(--ease);flex-shrink:0;}
.cat:hover{background:var(--sur2);color:var(--t);transform:translateY(-1px);}
.cat-on{color:#fff;box-shadow:0 4px 18px rgba(0,0,0,.38);transform:translateY(-1px);}
.cat-em{font-size:.88rem;}
.cat-lb{font-weight:600;}
.cat-n{font-size:.64rem;opacity:.7;background:rgba(255,255,255,.14);padding:1px 6px;border-radius:999px;}

/* DIVIDER */
.divider{display:flex;align-items:center;gap:13px;padding:14px 16px 8px;position:relative;z-index:1;max-width:900px;margin:0 auto;}
.div-line{flex:1;height:1px;background:var(--brd);}
.div-txt{font-size:.62rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--t3);white-space:nowrap;}
.div-n{color:var(--t3);font-weight:400;}

/* GRID */
.grid-wrap{position:relative;z-index:1;max-width:900px;margin:0 auto;padding:0 14px;}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:11px;}
@media(min-width:480px){.grid{grid-template-columns:repeat(3,1fr);gap:13px;}}
@media(min-width:700px){.grid{grid-template-columns:repeat(4,1fr);gap:15px;}}

/* CARD */
@keyframes card-in{from{opacity:0;transform:translateY(20px) scale(.96);}to{opacity:1;transform:translateY(0) scale(1);}}
.card{background:var(--sur);border:1px solid var(--brd);border-radius:var(--r);overflow:hidden;position:relative;cursor:pointer;animation:card-in .5s var(--ease) both;transition:transform .32s var(--ease),border-color .3s,box-shadow .3s;-webkit-tap-highlight-color:transparent;}
.card:hover{transform:translateY(-6px) scale(1.015);border-color:rgba(232,184,109,.22);box-shadow:0 18px 44px rgba(0,0,0,.45),0 0 0 1px rgba(232,184,109,.07);}
.card:hover .card-img{transform:scale(1.08);}
.card:hover .card-tap-hint{opacity:1;}
.card:hover .card-shimmer{opacity:1;}
.card:active{transform:translateY(-2px) scale(1.005);}
.card-oos{opacity:.45;pointer-events:none;}

.card-img-wrap{position:relative;overflow:hidden;height:150px;background:#060e1a;}
@media(min-width:480px){.card-img-wrap{height:168px;}}
.card-img{width:100%;height:100%;object-fit:cover;transition:transform .5s var(--ease);}
.card-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 45%,rgba(7,16,30,.72) 100%);pointer-events:none;}
.card-veil{position:absolute;inset:0;background:rgba(7,16,30,.7);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;}
.oos-tag{padding:5px 13px;border-radius:999px;background:rgba(248,113,113,.1);color:#f87171;font-size:.63rem;font-weight:700;border:1px solid rgba(248,113,113,.22);letter-spacing:.08em;text-transform:uppercase;}
.card-cat-dot{position:absolute;top:8px;right:8px;width:27px;height:27px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;box-shadow:0 2px 10px rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.14);}

.card-tap-hint{
  position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
  font-size:.6rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;
  color:rgba(255,255,255,.65);background:rgba(7,16,30,.6);backdrop-filter:blur(8px);
  padding:3px 9px;border-radius:999px;white-space:nowrap;
  border:1px solid rgba(255,255,255,.1);
  opacity:0;transition:opacity .25s;
}

.card-body{padding:10px 11px 12px;}
.card-name{font-size:.8rem;font-weight:500;color:var(--t);line-height:1.4;margin-bottom:9px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:33px;}
.card-foot{display:flex;align-items:center;justify-content:space-between;}
.card-price{font-family:var(--serif);font-size:1.05rem;color:var(--gold);}
.card-price small{font-family:var(--sans);font-size:.6rem;color:var(--t3);}
.card-has-desc{
  width:20px;height:20px;border-radius:6px;
  background:rgba(27,203,224,.1);border:1px solid rgba(27,203,224,.2);
  color:var(--cyan);display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
}
.card-shimmer{position:absolute;inset:0;opacity:0;pointer-events:none;background:linear-gradient(135deg,transparent 40%,rgba(255,255,255,.025) 50%,transparent 60%);transition:opacity .4s;}

/* EMPTY */
.empty{padding:70px 0;text-align:center;}
.empty-ico{font-size:3.5rem;opacity:.13;margin-bottom:16px;}
.empty-t{color:var(--t2);font-weight:600;font-size:.95rem;}
.empty-s{color:var(--t3);font-size:.82rem;margin-top:5px;}
.empty-reset{margin-top:18px;padding:9px 22px;border-radius:999px;border:1px solid var(--brd);background:var(--sur);color:var(--t2);font-size:.8rem;transition:all .2s;}
.empty-reset:hover{background:var(--sur2);color:var(--t);}
`;