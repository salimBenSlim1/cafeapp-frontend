import { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, WifiOff } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import ChatbotWaiter from '../ChatbotWaiter';

/* ─── category meta ───────────────────────────────────────────────── */
const CAT_META = {
  all:     { emoji: '✦',  label: 'All',      gradient: 'linear-gradient(135deg,#1bcbe0,#1a6dd4)' },
  coffee:  { emoji: '☕', label: 'Coffee',   gradient: 'linear-gradient(135deg,#c9933a,#7c4a1e)' },
  food:    { emoji: '🍽', label: 'Food',     gradient: 'linear-gradient(135deg,#34d399,#059669)' },
  drink:   { emoji: '🥤', label: 'Drinks',   gradient: 'linear-gradient(135deg,#818cf8,#4f46e5)' },
  dessert: { emoji: '🍰', label: 'Desserts', gradient: 'linear-gradient(135deg,#f472b6,#db2777)' },
  games:   { emoji: '🎲', label: 'Games',    gradient: 'linear-gradient(135deg,#fb923c,#ea580c)' },
  smoking: { emoji: '🚬', label: 'Smoking',  gradient: 'linear-gradient(135deg,#94a3b8,#475569)' },
};
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
  const [expandedCard, setExpandedCard]     = useState(null);
  const searchRef                           = useRef(null);

  const API      = process.env.REACT_APP_API_URL;
  const location = useLocation();
  const navigate = useNavigate();
  const qp       = new URLSearchParams(location.search);
  const qrKey    = qp.get('t');

  /* ── connectivity banner ───────────────────────────────────────── */
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  /* ── session bootstrap ─────────────────────────────────────────── */
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
        const r = await axios.get(`${API}/start-session`, {
          params: { key: qrKey },
         
        });
        const { token, cafeId } = r.data;
        setCafeName(cafeId);
        localStorage.setItem('userToken', token);
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

  /* ── socket — session invalidation only ────────────────────────── */
  useEffect(() => {
    if (!sessionActive) return;
    const url = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    const s = io(url, {
      transports: ['websocket'],
      reconnection: true,
      withCredentials: true,
      auth: { token: localStorage.getItem('userToken') },
    });
    s.on('statusUpdated', () => expire());
    return () => s.disconnect();
  }, [sessionActive]);

  const expire = () => {
    localStorage.removeItem('userToken');
    sessionStorage.removeItem('tai');
    setSessionExpired(true);
    setTimeout(() => { window.location.href = 'https://www.google.com'; }, 5000);
  };

  /* ── filter ────────────────────────────────────────────────────── */
  useEffect(() => {
    let f = products;
    if (search) f = f.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (cat !== 'all') f = f.filter(p => p.category === cat);
    setFiltered(f);
  }, [search, cat, products]);

  const availableCats = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  /* ── splash screens ────────────────────────────────────────────── */
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
           type === 'loading' ? 'Loading your menu, just a moment…'                                          :
                                'Scan the QR code at your table to view the menu'}
        </p>
        {type !== 'inactive' && <div className="splash-spin" />}
      </div>
    </div>
  );

  if (sessionExpired) return <><style>{CSS}</style><Splash type="expired" /></>;
  if (loading)        return <><style>{CSS}</style><Splash type="loading" /></>;
  if (!sessionActive) return <><style>{CSS}</style><Splash type="inactive" /></>;

  /* ═══════════════════════════════════════════════════════════════ */
  return (
    <>
      <style>{CSS}</style>

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

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <header className="hdr">
          <div className="hdr-in">
            {/* brand */}
            <div className="brand">
              <div className="brand-logo">
                <img src="/images/coffai1.png" alt="" style={{ width: 38, height: 38, objectFit: 'contain', position: 'relative', zIndex: 1 }} />
                <div className="brand-glow" />
              </div>
              <div>
                <div className="brand-name">{cafeName+ ' Menu' || 'Our Menu'}</div>
                <div className="brand-meta">
                  <span>Live menu</span>
                  {tableId && <><span className="sep">·</span><span>Table {tableId}</span></>}
                </div>
              </div>
            </div>

            {/* search trigger */}
            <button className="srch-btn" onClick={() => searchRef.current?.focus()} aria-label="Search">
              <Search size={16} />
            </button>
          </div>

          {/* search input */}
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

        {/* ── CATEGORIES ─────────────────────────────────────────── */}
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

        {/* ── DIVIDER ────────────────────────────────────────────── */}
        <div className="divider">
          <span className="div-line" />
          <span className="div-txt">
            {cat === 'all' ? 'Full Menu' : (CAT_META[cat]?.label || cat)}
            <span className="div-n"> · {filtered.length}</span>
          </span>
          <span className="div-line" />
        </div>

        {/* ── GRID ───────────────────────────────────────────────── */}
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
                const oos  = !p.stock;
                const open = expandedCard === p.id;
                const cm   = CAT_META[p.category] || { emoji: '✦', gradient: 'linear-gradient(135deg,#1bcbe0,#1a6dd4)' };
                return (
                  <article
                    key={p.id}
                    className={`card${oos ? ' card-oos' : ''}${open ? ' card-open' : ''}`}
                    style={{ animationDelay: `${Math.min(i * 0.045, 0.38)}s` }}
                    onClick={() => !oos && setExpandedCard(open ? null : p.id)}
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
                      {/* category dot */}
                      <span className="card-cat-dot" style={{ background: cm.gradient }}>
                        {cm.emoji}
                      </span>
                    </div>

                    {/* body */}
                    <div className="card-body">
                      <p className="card-name">{p.name}</p>
                      <div className="card-foot">
                        <span className="card-price">
                          {p.price.toFixed(2)}<small> TND</small>
                        </span>
                        {p.description && (
                          <span className="card-chevron" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
                            <ChevronDown size={13} />
                          </span>
                        )}
                      </div>
                      {open && p.description && (
                        <p className="card-desc">{p.description}</p>
                      )}
                    </div>

                    {/* hover shimmer */}
                    <div className="card-shimmer" />
                  </article>
                );
              })}
            </div>
          )}
          <div style={{ height: 110 }} />
        </main>

        <ChatbotWaiter products={products} menuOnly />
      </div>
    </>
  );
}

/* ─── CSS ─────────────────────────────────────────────────────────── */
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

/* OFFLINE */
.offline-bar{
  position:fixed;top:0;left:0;right:0;z-index:999;
  background:rgba(248,113,113,.13);border-bottom:1px solid rgba(248,113,113,.28);
  color:#f87171;font-size:.7rem;font-weight:600;letter-spacing:.07em;
  padding:7px 16px;display:flex;align-items:center;gap:7px;
  backdrop-filter:blur(14px);
}

/* SPLASH */
.splash{
  min-height:100svh;display:flex;align-items:center;justify-content:center;
  background:var(--bg);position:relative;overflow:hidden;padding:32px;
}
.splash-orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;}
.o1{width:560px;height:560px;background:var(--cyan);opacity:.055;top:-180px;right:-130px;}
.o2{width:480px;height:480px;background:var(--gold);opacity:.045;bottom:-140px;left:-110px;}
.o3{width:320px;height:320px;background:var(--cyan2);opacity:.04;top:50%;left:50%;transform:translate(-50%,-50%);}
.splash-card{position:relative;z-index:1;text-align:center;max-width:340px;}
.splash-logo-ring{
  width:110px;height:110px;border-radius:50%;margin:0 auto 28px;position:relative;
  background:rgba(232,184,109,.07);border:1px solid rgba(232,184,109,.18);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 0 60px rgba(232,184,109,.1);
}
.splash-ring-anim{
  position:absolute;inset:-12px;border-radius:50%;
  border:1px dashed rgba(232,184,109,.2);
  animation:spin-slow 14s linear infinite;
}
@keyframes spin-slow{to{transform:rotate(360deg);}}
.splash-h{font-family:var(--serif);font-size:2.1rem;color:var(--t);margin-bottom:13px;line-height:1.1;}
.splash-p{font-size:.88rem;color:var(--t2);line-height:1.78;margin-bottom:28px;}
.splash-spin{
  width:30px;height:30px;border-radius:50%;margin:0 auto;
  border:2px solid rgba(27,203,224,.1);border-top-color:var(--cyan);
  animation:spin .75s linear infinite;
}
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
.atm-grid{
  position:absolute;inset:0;
  background-image:linear-gradient(rgba(27,203,224,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(27,203,224,.022) 1px,transparent 1px);
  background-size:52px 52px;
  mask-image:radial-gradient(ellipse 75% 75% at 50% 50%,black 10%,transparent 100%);
}

/* HEADER */
.hdr{
  position:sticky;top:0;z-index:40;
  background:rgba(7,16,30,.9);backdrop-filter:blur(26px) saturate(180%);
  border-bottom:1px solid var(--brd);padding:0 16px 12px;
}
.hdr-in{
  max-width:900px;margin:0 auto;
  display:flex;align-items:center;justify-content:space-between;
  gap:12px;padding:13px 0 10px;
}
.brand{display:flex;align-items:center;gap:11px;}
.brand-logo{position:relative;width:38px;height:38px;flex-shrink:0;}
.brand-glow{
  position:absolute;inset:-5px;border-radius:50%;
  background:radial-gradient(circle,rgba(232,184,109,.22),transparent 70%);
  animation:glow-pulse 3.5s ease-in-out infinite;
}
@keyframes glow-pulse{0%,100%{opacity:.4;}50%{opacity:.9;}}
.brand-name{
  font-family:var(--serif);font-size:1.28rem;line-height:1;
  background:linear-gradient(135deg,var(--gold) 0%,#f5d99a 50%,var(--gold2) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.brand-meta{display:flex;align-items:center;gap:6px;font-size:.6rem;color:var(--t3);letter-spacing:.09em;text-transform:uppercase;margin-top:3px;}
.live-dot{display:block;width:6px;height:6px;border-radius:50%;background:var(--green);animation:live 2.5s ease-out infinite;}
@keyframes live{0%{box-shadow:0 0 0 0 rgba(52,211,153,.5);}70%{box-shadow:0 0 0 8px rgba(52,211,153,0);}100%{box-shadow:0 0 0 0 rgba(52,211,153,0);}}
.sep{opacity:.3;}
.srch-btn{
  width:37px;height:37px;border-radius:11px;border:1px solid var(--brd);
  background:var(--sur);color:var(--t2);
  display:flex;align-items:center;justify-content:center;transition:all .2s;
}
.srch-btn:hover{background:var(--sur2);color:var(--t);}

/* search */
.srch-wrap{position:relative;max-width:900px;margin:0 auto;}
.srch-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--t3);pointer-events:none;}
.srch-input{
  width:100%;padding:11px 40px;border-radius:var(--r);
  border:1px solid var(--brd);background:var(--sur);
  color:var(--t);font-family:var(--sans);font-size:.86rem;outline:none;
  transition:border-color .2s,box-shadow .2s,background .2s;
}
.srch-input::placeholder{color:var(--t3);}
.srch-input:focus{border-color:rgba(27,203,224,.35);box-shadow:0 0 0 3px rgba(27,203,224,.06);background:rgba(27,203,224,.025);}
.srch-clear{
  position:absolute;right:10px;top:50%;transform:translateY(-50%);
  width:23px;height:23px;border-radius:7px;border:none;
  background:var(--sur2);color:var(--t3);
  display:flex;align-items:center;justify-content:center;transition:all .15s;
}
.srch-clear:hover{color:var(--t);}

/* CATEGORIES */
.cats-scroll{overflow-x:auto;scrollbar-width:none;padding:14px 0 2px;position:relative;z-index:1;}
.cats-scroll::-webkit-scrollbar{display:none;}
.cats-track{display:flex;gap:8px;padding:0 16px;width:max-content;}
.cat{
  display:flex;align-items:center;gap:6px;padding:8px 14px;
  border-radius:999px;border:1px solid var(--brd);background:var(--sur);
  color:var(--t2);font-size:.77rem;font-weight:500;white-space:nowrap;
  transition:all .22s var(--ease);flex-shrink:0;
}
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
@keyframes card-in{
  from{opacity:0;transform:translateY(20px) scale(.96);}
  to{opacity:1;transform:translateY(0) scale(1);}
}
.card{
  background:var(--sur);border:1px solid var(--brd);
  border-radius:var(--r);overflow:hidden;position:relative;
  cursor:pointer;animation:card-in .5s var(--ease) both;
  transition:transform .32s var(--ease),border-color .3s,box-shadow .3s;
  -webkit-tap-highlight-color:transparent;
}
.card:hover{
  transform:translateY(-6px) scale(1.015);
  border-color:rgba(232,184,109,.22);
  box-shadow:0 18px 44px rgba(0,0,0,.45),0 0 0 1px rgba(232,184,109,.07);
}
.card:hover .card-img{transform:scale(1.08);}
.card:hover .card-shimmer{opacity:1;}
.card:active{transform:translateY(-2px) scale(1.005);}
.card-oos{opacity:.45;pointer-events:none;}
.card-open{border-color:rgba(27,203,224,.28);box-shadow:0 14px 40px rgba(0,0,0,.42),0 0 0 1px rgba(27,203,224,.1);}

/* image */
.card-img-wrap{position:relative;overflow:hidden;height:150px;background:#060e1a;}
@media(min-width:480px){.card-img-wrap{height:168px;}}
.card-img{width:100%;height:100%;object-fit:cover;transition:transform .5s var(--ease);}
.card-overlay{
  position:absolute;inset:0;
  background:linear-gradient(to bottom,transparent 45%,rgba(7,16,30,.72) 100%);
  pointer-events:none;
}
.card-veil{
  position:absolute;inset:0;background:rgba(7,16,30,.7);
  backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;
}
.oos-tag{
  padding:5px 13px;border-radius:999px;
  background:rgba(248,113,113,.1);color:#f87171;
  font-size:.63rem;font-weight:700;border:1px solid rgba(248,113,113,.22);
  letter-spacing:.08em;text-transform:uppercase;
}
.card-cat-dot{
  position:absolute;top:8px;right:8px;
  width:27px;height:27px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:.75rem;box-shadow:0 2px 10px rgba(0,0,0,.4);
  border:1px solid rgba(255,255,255,.14);
}

/* body */
.card-body{padding:10px 11px 12px;}
.card-name{
  font-size:.8rem;font-weight:500;color:var(--t);
  line-height:1.4;margin-bottom:9px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
  min-height:33px;
}
.card-foot{display:flex;align-items:center;justify-content:space-between;}
.card-price{font-family:var(--serif);font-size:1.05rem;color:var(--gold);}
.card-price small{font-family:var(--sans);font-size:.6rem;color:var(--t3);}
.card-chevron{
  color:var(--t3);transition:transform .25s var(--ease);display:flex;align-items:center;
}
.card-desc{
  font-size:.74rem;color:var(--t2);line-height:1.65;
  margin-top:10px;padding-top:10px;border-top:1px solid var(--brd);
  animation:card-in .3s var(--ease) both;
}
.card-shimmer{
  position:absolute;inset:0;opacity:0;pointer-events:none;
  background:linear-gradient(135deg,transparent 40%,rgba(255,255,255,.025) 50%,transparent 60%);
  transition:opacity .4s;
}

/* EMPTY */
.empty{padding:70px 0;text-align:center;}
.empty-ico{font-size:3.5rem;opacity:.13;margin-bottom:16px;}
.empty-t{color:var(--t2);font-weight:600;font-size:.95rem;}
.empty-s{color:var(--t3);font-size:.82rem;margin-top:5px;}
.empty-reset{
  margin-top:18px;padding:9px 22px;border-radius:999px;
  border:1px solid var(--brd);background:var(--sur);color:var(--t2);
  font-size:.8rem;transition:all .2s;
}
.empty-reset:hover{background:var(--sur2);color:var(--t);}
`;