import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const API  = process.env.REACT_APP_API_URL;
const WS   = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
const hdrs = () => ({ 'server-token': localStorage.getItem('serverToken') });

const NEXT_STATUS = { pending: 'preparing', preparing: 'served' };

const STATUS_META = {
  pending:   { label: 'START',    color: '#f59e0b', icon: '○' },
  preparing: { label: 'DONE',     color: '#22d3ee', icon: '◐' },
  served:    { label: 'SERVED',   color: '#4ade80', icon: '●' },
  canceled:  { label: 'CANCELED', color: '#ef4444', icon: '✕' }, // ← added
};

const CATEGORY_VIEW = {
  coffee: 'bar', drink: 'bar', games: 'bar',
  food: 'kitchen', dessert: 'kitchen',
  smoking: 'chicha',
};

// ── FIX 4: All three stations defined — was only 'bar' before ────
const VIEW_META = {
  bar:     { label: 'BAR',     icon: '☕', accent: '#f59e0b' },
  kitchen: { label: 'KITCHEN', icon: '🍳', accent: '#f472b6' },
  chicha:  { label: 'CHICHA',  icon: '💨', accent: '#a78bfa' },
};

const fmt       = d => new Date(d).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
const timeSince = d => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s/60)}m`;
  return `${Math.floor(s/3600)}h`;
};

function buildOrder(raw) {
  const items = (raw.OrderItems ?? raw.items ?? []).map(oi => ({
    id:        oi.id,
    name:      oi.itemName ?? oi.Item?.name ?? oi.name ?? '?',
    quantity:  oi.quantity,
    comment:   oi.comment  || null,
    category:  oi.Item?.category ?? oi.category ?? 'drink',
    view:      CATEGORY_VIEW[oi.Item?.category ?? oi.category ?? 'drink'] ?? 'bar',
    status:    oi.status   ?? 'pending',
    createdAt: oi.createdAt ?? raw.createdAt,
  }));
  return {
    id:          raw.id,
    tableNumber: raw.tableNumber ?? raw.Table?.number,
    createdAt:   raw.createdAt,
    totalPrice:  raw.totalPrice ?? 0,
    items,
  };
}

const SERVED_DELAY_MS = 60_000;

const G = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Bebas+Neue&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  :root{--bg:#0a0a0f;--bg2:#111118;--border:rgba(255,255,255,0.07);--text:#e2e8f0;--muted:#64748b;--mono:'JetBrains Mono',monospace;--display:'Bebas Neue',sans-serif;}
  html,body{background:var(--bg);color:var(--text);font-family:var(--mono);}
  .bm-root{min-height:100dvh;background:var(--bg);display:flex;flex-direction:column;font-family:var(--mono);position:relative;}
  .bm-root::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px);pointer-events:none;z-index:999;}
  .bm-nav{position:sticky;top:0;z-index:100;background:var(--bg2);border-bottom:1px solid var(--border);display:flex;align-items:stretch;height:56px;overflow:hidden;}
  .bm-nav-brand{display:flex;align-items:center;gap:12px;padding:0 20px;border-right:1px solid var(--border);flex-shrink:0;}
  .bm-nav-brand-text{font-family:var(--display);font-size:22px;letter-spacing:2px;color:var(--text);line-height:1;}
  .bm-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;transition:background .3s;}
  .bm-dot.on{background:#4ade80;box-shadow:0 0 8px rgba(74,222,128,0.7);}
  .bm-dot.off{background:#ef4444;box-shadow:0 0 8px rgba(239,68,68,0.7);}
  .bm-tabs{display:flex;flex:1;}
  .bm-tab{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;font-family:var(--display);font-size:18px;letter-spacing:2px;color:var(--muted);background:transparent;border:none;border-right:1px solid var(--border);cursor:pointer;position:relative;transition:color .15s,background .15s;padding:0 16px;white-space:nowrap;}
  .bm-tab:last-child{border-right:none;}
  .bm-tab::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--accent,#f59e0b);transform:scaleX(0);transition:transform .2s;}
  .bm-tab.active{color:var(--accent,#f59e0b);background:color-mix(in srgb,var(--accent,#f59e0b) 6%,transparent);}
  .bm-tab.active::after{transform:scaleX(1);}
  .bm-tab-badge{font-family:var(--mono);font-size:11px;font-weight:800;border-radius:4px;padding:2px 6px;line-height:1;min-width:20px;text-align:center;}
  .bm-notif{display:flex;align-items:center;padding:0 20px;border-left:1px solid var(--border);flex-shrink:0;gap:8px;cursor:pointer;transition:background .15s;}
  .bm-notif:hover{background:rgba(239,68,68,0.1);}
  .bm-notif-badge{font-family:var(--mono);font-size:11px;font-weight:800;background:#ef4444;color:#fff;border-radius:4px;padding:2px 8px;animation:pulse-badge 1s ease-in-out infinite;}
  .bm-notif-label{font-size:11px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;}
  @keyframes pulse-badge{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4);}50%{box-shadow:0 0 0 6px rgba(239,68,68,0);}}
  .bm-order-count{display:flex;align-items:center;padding:0 20px;border-left:1px solid var(--border);flex-shrink:0;gap:6px;}
  .bm-order-count-num{font-family:var(--display);font-size:28px;line-height:1;}
  .bm-order-count-lbl{font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;line-height:1.3;}
  .bm-grid{flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1px;background:var(--border);align-content:start;padding-bottom:28px;}
  .bm-card{background:var(--bg2);display:flex;flex-direction:column;position:relative;overflow:hidden;transition:background .2s;animation:card-in .2s ease;}
  @keyframes card-in{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
  .bm-card.all-served{background:color-mix(in srgb,#4ade80 4%,var(--bg2));}
  .bm-card-accent-bar{height:3px;flex-shrink:0;transition:background .3s;}
  .bm-card.urgent .bm-card-accent-bar{background:#ef4444 !important;animation:urgent-flash 1.2s ease-in-out infinite;}
  @keyframes urgent-flash{0%,100%{opacity:1;}50%{opacity:0.4;}}
  .bm-card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid var(--border);}
  .bm-table-label{font-size:10px;letter-spacing:2px;text-transform:uppercase;}
  .bm-table-num{font-family:var(--display);font-size:36px;line-height:1;}
  .bm-urgent-tag{font-family:var(--mono);font-size:11px;font-weight:800;color:#ef4444;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.3);border-radius:4px;padding:3px 8px;letter-spacing:1px;animation:pulse-badge 1s ease-in-out infinite;}
  .bm-card-meta{text-align:right;}
  .bm-card-time{font-size:20px;font-weight:700;color:var(--text);line-height:1;letter-spacing:1px;}
  .bm-card-ago{font-size:10px;color:var(--muted);margin-top:2px;letter-spacing:1px;text-transform:uppercase;}
  .bm-card-ago.urgent{color:#ef4444;}
  .bm-progress{height:2px;background:var(--border);overflow:hidden;flex-shrink:0;}
  .bm-progress-fill{height:100%;transition:width .8s ease;}
  .bm-pills{display:flex;gap:6px;padding:8px 16px;border-bottom:1px solid var(--border);flex-wrap:wrap;}
  .bm-pill{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;border-radius:3px;padding:3px 8px;}
  .bm-pill-pending{background:rgba(245,158,11,0.12);color:#f59e0b;border:1px solid rgba(245,158,11,0.25);}
  .bm-pill-preparing{background:rgba(34,211,238,0.10);color:#22d3ee;border:1px solid rgba(34,211,238,0.25);}
  .bm-pill-served{background:rgba(74,222,128,0.08);color:#4ade80;border:1px solid rgba(74,222,128,0.20);}
  .bm-items{display:flex;flex-direction:column;}
  .bm-item{display:flex;align-items:flex-start;border-bottom:1px solid var(--border);cursor:pointer;position:relative;user-select:none;-webkit-user-select:none;transition:background .1s;}
  .bm-item:last-child{border-bottom:none;}
  .bm-item.done{cursor:default;}
  .bm-item.busy{opacity:.45;cursor:default;}
  .bm-item::after{content:'';position:absolute;inset:0;background:rgba(255,255,255,0);transition:background .1s;pointer-events:none;}
  .bm-item:not(.done):not(.busy):hover::after{background:rgba(255,255,255,0.025);}
  .bm-item-stripe{width:3px;align-self:stretch;flex-shrink:0;transition:background .2s;}
  .bm-item-icon{width:44px;height:44px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;font-weight:800;transition:color .2s;}
  .bm-item-body{flex:1;min-width:0;padding:10px 0;}
  .bm-item-name{font-size:15px;font-weight:700;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2;letter-spacing:0.3px;}
  .bm-item-ts{font-size:10px;color:var(--muted);margin-top:3px;letter-spacing:1px;text-transform:uppercase;}
  .bm-item-comment{margin-top:6px;background:rgba(250,204,21,0.1);border-left:2px solid #facc15;padding:4px 8px;font-size:11px;font-weight:500;color:#fde047;line-height:1.4;letter-spacing:0.3px;}
  .bm-item-right{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding:10px 14px;gap:4px;flex-shrink:0;min-width:70px;}
  .bm-item-qty{font-family:var(--display);font-size:32px;line-height:1;transition:color .2s;}
  .bm-item-action{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;transition:color .2s;}
  .bm-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 20px;gap:12px;}
  .bm-empty-icon{font-size:56px;opacity:.15;}
  .bm-empty-title{font-family:var(--display);font-size:28px;color:var(--muted);letter-spacing:4px;}
  .bm-empty-sub{font-size:11px;color:var(--border);letter-spacing:2px;text-transform:uppercase;}
  .bm-ticker{position:fixed;bottom:0;left:0;right:0;height:28px;background:var(--bg);border-top:1px solid var(--border);display:flex;align-items:center;overflow:hidden;z-index:90;}
  .bm-ticker-inner{display:flex;gap:48px;animation:ticker-scroll 30s linear infinite;white-space:nowrap;}
  @keyframes ticker-scroll{from{transform:translateX(0);}to{transform:translateX(-50%);}}
  .bm-ticker-item{font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;flex-shrink:0;}
  .bm-ticker-accent{color:var(--text);}
`;

export default function Barman() {
  const [view,      setView]      = useState('bar');
  const [orders,    setOrders]    = useState([]);
  const [connected, setConnected] = useState(false);
  const [notif,     setNotif]     = useState(0);
  const [busy,      setBusy]      = useState({});

  const audioRef     = useRef(null);
  const removeTimers = useRef({});

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
    audioRef.current.volume = 0.6;
    return () => audioRef.current?.pause();
  }, []);

  const ping = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  };

  const scheduleRemove = useCallback((orderId) => {
    if (removeTimers.current[orderId]) return;
    removeTimers.current[orderId] = setTimeout(() => {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      delete removeTimers.current[orderId];
    }, SERVED_DELAY_MS);
  }, []);

  const cancelRemove = useCallback((orderId) => {
    if (removeTimers.current[orderId]) {
      clearTimeout(removeTimers.current[orderId]);
      delete removeTimers.current[orderId];
    }
  }, []);

  useEffect(() => () => Object.values(removeTimers.current).forEach(clearTimeout), []);

  useEffect(() => {
    axios.get(`${API}/barman/getOrders`, { headers: hdrs() })
      .then(r => {
        const raw = r.data.orders ?? r.data ?? [];
        setOrders(raw.map(buildOrder));
      })
      .catch((e) => {if(e.response.status===403) window.location.href=e?.response?.data?.redirectTo});
  }, []);

  useEffect(() => {
    const token  = localStorage.getItem('serverToken');
    const socket = io(WS, {
      auth:                { token },
      transports:          ['polling', 'websocket'],
      upgrade:             true,
      reconnection:        true,
      reconnectionDelay:   1000,
      reconnectionDelayMax:5000,
      withCredentials:     true,
    });

    socket.on('connect',       () => setConnected(true));
    socket.on('disconnect',    () => setConnected(false));
    socket.on('connect_error', err => { console.warn('[socket] barman:', err.message); setConnected(false); });

    socket.on('newOrder', (payload) => {
      ping();
      setNotif(n => n + 1);
      const incoming = buildOrder(payload);
      setOrders(prev => {
        const idx = prev.findIndex(o => o.id === incoming.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], items: [...(updated[idx].items || []), ...(incoming.items || [])] };
          return updated;
        }
        return [incoming, ...prev];
      });
    });

    socket.on('barman:itemStatusChanged', ({ orderId, orderItemId, status }) => {
      setOrders(prev => {
        const updated = prev.map(o => {
          if (o.id !== orderId) return o;
          return { ...o, items: o.items.map(i => i.id === orderItemId ? { ...i, status } : i) };
        });
        const order = updated.find(o => o.id === orderId);
        if (order && order.items.every(i => i.status === 'served')) scheduleRemove(orderId);
        else cancelRemove(orderId);
        return updated;
      });
    });

    // ── FIX 5: order:canceled — remove card immediately ──────────
    // Also handles via orderStatusUpdated below, but being explicit is cleaner.
    socket.on('order:canceled', ({ orderId }) => {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      cancelRemove(orderId);
    });

    socket.on('orderStatusUpdated', ({ id, status }) => {
      if (status === 'served' || status === 'canceled') {
        setOrders(prev => prev.filter(o => o.id !== id));
        cancelRemove(id);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('newOrder');
      socket.off('barman:itemStatusChanged');
      socket.off('order:canceled');
      socket.off('orderStatusUpdated');
      socket.disconnect();
    };
  }, [scheduleRemove, cancelRemove]);

  const handleItemTap = useCallback(async (orderId, item) => {
    const next = NEXT_STATUS[item.status];
    if (!next || busy[item.id]) return;

    setBusy(b => ({ ...b, [item.id]: true }));

    setOrders(prev => {
      const updated = prev.map(o => {
        if (o.id !== orderId) return o;
        return { ...o, items: o.items.map(i => i.id === item.id ? { ...i, status: next } : i) };
      });
      const order = updated.find(o => o.id === orderId);
      if (order && order.items.every(i => i.status === 'served')) scheduleRemove(orderId);
      else cancelRemove(orderId);
      return updated;
    });

    try {
      await axios.put(
        `${API}/server/updateOrderItemStatus/${item.id}`,
        { status: next, orderId },
        { headers: hdrs() }
      );
    } catch {
      setBusy(b => { const n = {...b}; delete n[item.id]; return n; });
      cancelRemove(orderId);
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        return { ...o, items: o.items.map(i => i.id === item.id ? { ...i, status: item.status } : i) };
      }));
      return;
    }
    setBusy(b => { const n = {...b}; delete n[item.id]; return n; });
  }, [busy, scheduleRemove, cancelRemove]);

  const viewOrders = orders
    .map(o => ({ ...o, items: o.items.filter(i => i.view === view) }))
    .filter(o => o.items.length > 0)
    .sort((a, b) => {
      const oldest = ord => {
        const active = ord.items.filter(i => i.status !== 'served');
        return active.length ? Math.min(...active.map(i => new Date(i.createdAt))) : Infinity;
      };
      return oldest(a) - oldest(b);
    });

  const tabCounts = { bar: 0, kitchen: 0, chicha: 0 };
  orders.forEach(o => o.items.forEach(i => {
    if (i.status !== 'served') tabCounts[i.view] = (tabCounts[i.view] || 0) + 1;
  }));

  // ── FIX 6: Safe meta access — falls back to bar if view is somehow invalid ──
  const meta     = VIEW_META[view] ?? VIEW_META.bar;
  const allItems = orders.flatMap(o => o.items);
  const nowStr   = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const TICKER   = [
    ['PENDING',     allItems.filter(i=>i.status==='pending').length],
    ['IN PROGRESS', allItems.filter(i=>i.status==='preparing').length],
    ['ACTIVE',      viewOrders.length],
    ['STATION',     meta.label],
    ['TIME',        nowStr],
  ];
  const tickerItems = [...TICKER, ...TICKER];

  return (
    <>
      <style>{G}</style>
      <div className="bm-root">

        <nav className="bm-nav">
          <div className="bm-nav-brand">
            <div className={`bm-dot ${connected?'on':'off'}`}/>
            <span className="bm-nav-brand-text">KDS</span>
          </div>

          <div className="bm-tabs">
            {Object.entries(VIEW_META).map(([k, m]) => (
              <button key={k}
                className={`bm-tab ${view===k?'active':''}`}
                style={{ '--accent': m.accent }}
                onClick={() => { setView(k); setNotif(0); }}
              >
                <span style={{fontSize:16}}>{m.icon}</span>
                {m.label}
                {tabCounts[k] > 0 && (
                  <span className="bm-tab-badge"
                    style={{ background: view===k ? m.accent : 'rgba(255,255,255,0.08)', color: view===k ? '#000' : m.accent }}>
                    {tabCounts[k]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {notif > 0 && (
            <div className="bm-notif" onClick={() => setNotif(0)}>
              <span className="bm-notif-badge">{notif > 99 ? '99+' : notif}</span>
              <span className="bm-notif-label">NEW</span>
            </div>
          )}

          <div className="bm-order-count">
            <span className="bm-order-count-num" style={{color:meta.accent}}>{viewOrders.length}</span>
            <span className="bm-order-count-lbl">ACTIVE<br/>ORDERS</span>
          </div>
        </nav>

        <div className="bm-grid">
          {viewOrders.length === 0 ? (
            <div className="bm-empty">
              <div className="bm-empty-icon">{meta.icon}</div>
              <div className="bm-empty-title">ALL CLEAR</div>
              <div className="bm-empty-sub">No orders for {meta.label}</div>
            </div>
          ) : viewOrders.map(order => (
            <OrderCard key={order.id} order={order} accent={meta.accent} busy={busy} onTap={handleItemTap}/>
          ))}
        </div>

        <div className="bm-ticker">
          <div className="bm-ticker-inner">
            {tickerItems.map(([label, val], i) => (
              <span key={i} className="bm-ticker-item">
                {label} · <span className="bm-ticker-accent">{val}</span>
              </span>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

function OrderCard({ order, accent, busy, onTap }) {
  const oldestTime = Math.min(...order.items.map(i => new Date(i.createdAt)));
  const ageMin     = Math.floor((Date.now() - oldestTime) / 60000);
  const isUrgent   = ageMin >= 10;
  const urgency    = Math.min(ageMin / 10, 1);

  const served    = order.items.filter(i => i.status === 'served').length;
  const total     = order.items.length;
  const allServed = served === total;
  const pending   = order.items.filter(i => i.status === 'pending').length;
  const preparing = order.items.filter(i => i.status === 'preparing').length;

  const sortedItems = [...order.items].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className={`bm-card${isUrgent?' urgent':''}${allServed?' all-served':''}`}>
      <div className="bm-card-accent-bar"
        style={{ background: allServed ? '#4ade80' : isUrgent ? '#ef4444' : accent }}/>

      <div className="bm-card-head">
        <div>
          <div style={{display:'flex', alignItems:'center', gap:6}}>
            <span className="bm-table-label" style={{color:accent}}>TABLE</span>
            {isUrgent && <span className="bm-urgent-tag">⚠ {ageMin}m</span>}
          </div>
          <div className="bm-table-num" style={{color:accent}}>{order.tableNumber}</div>
        </div>
        <div className="bm-card-meta">
          <div className="bm-card-time">{fmt(oldestTime)}</div>
          <div className={`bm-card-ago${isUrgent?' urgent':''}`}>{timeSince(oldestTime)} ago</div>
        </div>
      </div>

      <div className="bm-progress">
        <div className="bm-progress-fill"
          style={{ width:`${urgency*100}%`, background: isUrgent ? '#ef4444' : accent }}/>
      </div>

      <div className="bm-pills">
        {pending   > 0 && <span className="bm-pill bm-pill-pending">{pending} PENDING</span>}
        {preparing > 0 && <span className="bm-pill bm-pill-preparing">{preparing} IN PROGRESS</span>}
        {served    > 0 && <span className="bm-pill bm-pill-served">{served} SERVED</span>}
      </div>

      <div className="bm-items">
        {sortedItems.map(item => {
          const sm     = STATUS_META[item.status] ?? STATUS_META.pending;
          const canTap = !!NEXT_STATUS[item.status];
          const isBusy = !!busy[item.id];
          return (
            <div key={item.id}
              className={`bm-item${!canTap?' done':''}${isBusy?' busy':''}`}
              onClick={() => !isBusy && canTap && onTap(order.id, item)}
            >
              <div className="bm-item-stripe" style={{background: isBusy ? 'rgba(255,255,255,0.1)' : sm.color}}/>
              <div className="bm-item-icon" style={{color: isBusy ? 'rgba(255,255,255,0.2)' : sm.color}}>
                {isBusy ? '·' : sm.icon}
              </div>
              <div className="bm-item-body">
                <div className="bm-item-name">{item.name}</div>
                <div className="bm-item-ts">{fmt(item.createdAt)} · {timeSince(item.createdAt)} ago</div>
                {item.comment && <div className="bm-item-comment">▶ {item.comment}</div>}
              </div>
              <div className="bm-item-right">
                <div className="bm-item-qty" style={{color: isBusy ? 'rgba(255,255,255,0.15)' : sm.color}}>
                  ×{item.quantity}
                </div>
                <div className="bm-item-action"
                  style={{color: isBusy ? 'rgba(255,255,255,0.15)' : canTap ? sm.color : '#4ade80'}}>
                  {isBusy ? '···' : canTap ? sm.label : '✓'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}