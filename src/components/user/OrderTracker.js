import { useState, useEffect, useRef } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';

const WS  = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
const API = process.env.REACT_APP_API_URL;

const ITEM_STATUS = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,.13)',  border: 'rgba(245,158,11,.28)',  pulse: true  },
  preparing: { label: 'Preparing', color: '#60a5fa', bg: 'rgba(59,130,246,.13)',  border: 'rgba(59,130,246,.28)',  pulse: true  },
  served:    { label: 'Ready',     color: '#34d399', bg: 'rgba(16,185,129,.13)',  border: 'rgba(16,185,129,.28)',  pulse: false },
};

const PRIORITY    = ['pending', 'preparing', 'served'];
const worstStatus = items => PRIORITY.find(s => items.some(i => i.status === s)) || 'served';

function normalizeItem(i) {
  return {
    id:       i.id,
    name:     i.itemName ?? i.Item?.name ?? i.name ?? '?',
    qty:      i.quantity ?? i.qty,
    subtotal: i.subtotal ?? i.quantity * parseFloat(i.price ?? 0),
    status:   i.status   ?? 'pending',
    comment:  i.comment  || null,
  };
}

function shapeOrder(raw) {
  return {
    id:      raw.id,
    tableId: raw.tableNumber ?? raw.tableId,
    total:   parseFloat(raw.totalPrice ?? raw.total ?? 0),
    items:   (raw.OrderItems ?? raw.items ?? []).map(normalizeItem),
  };
}

export default function OrderTracker({ tableId }) {
  const [order,     setOrder]     = useState(null);
  const [open,      setOpen]      = useState(false);
  const [connected, setConnected] = useState(false);
  const [error,     setError]     = useState(false);
  const socketRef   = useRef(null);
  const retryTimer  = useRef(null);
  const connectCount = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem('userToken');

    const refetch = async () => {
      try {
        const { data } = await axios.get(`${API}/orders/last`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrder(shapeOrder(data));
        setError(false);
      } catch (e) {
        if (e.response?.status === 404) setOrder(null);
      }
    };

    const socket = io(WS, {
      auth:                { token },
      transports:          ['polling', 'websocket'],
      upgrade:             true,
      reconnection:        true,
      reconnectionDelay:   1000,
      reconnectionDelayMax:5000,
      withCredentials:     true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError(false);
      connectCount.current += 1;
      clearTimeout(retryTimer.current);

      if (connectCount.current === 1) {
        // First load: fetch immediately, socket room join is fast
        refetch();
      } else {
        // Reconnect after refresh/network drop:
        // Wait 500ms for server to re-add socket to the table room,
        // then fetch. Fetch again after 3s to catch any events fired
        // during the reconnect gap.
        retryTimer.current = setTimeout(() => {
          refetch();
          retryTimer.current = setTimeout(refetch, 3000);
        }, 1000);
      }
    });

    socket.on('disconnect', () => {
      setConnected(false);
      clearTimeout(retryTimer.current);
    });

    socket.on('connect_error', () => {
      setConnected(false);
      setError(true);
    });

    socket.on('newOrder', (payload) => {
      if (String(payload.tableNumber) !== String(localStorage.getItem('tableId'))) return;
      const incoming = shapeOrder(payload);
      setOrder(prev => {
        if (prev && prev.id === incoming.id) {
          return { ...prev, total: incoming.total, items: [...prev.items, ...incoming.items] };
        }
        return incoming;
      });
    });

    socket.on('barman:itemStatusChanged', ({ orderId, orderItemId, status }) => {
      setOrder(prev => {
        if (!prev || prev.id !== orderId) return prev;
        return { ...prev, items: prev.items.map(i => i.id === orderItemId ? { ...i, status } : i) };
      });
    });

    socket.on('orderStatusUpdated', ({ id, status }) => {
      setOrder(prev => {
        if (!prev || prev.id !== id) return prev;
        if (status === 'served') return { ...prev, items: prev.items.map(i => ({ ...i, status: 'served' })) };
        if (status === 'canceled') return null;
        return prev;
      });
    });

    socket.on('order:canceled', ({ orderId }) => {
      setOrder(prev => (prev?.id === orderId ? null : prev));
    });

    return () => {
      clearTimeout(retryTimer.current);
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('newOrder');
      socket.off('barman:itemStatusChanged');
      socket.off('orderStatusUpdated');
      socket.off('order:canceled');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [tableId]);

  // auto-open sheet when an item flips to ready
  useEffect(() => {
    if (order?.items?.some(i => i.status === 'served')) setOpen(true);
  }, [order]);

  // lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const pendingCount = order?.items?.filter(i => i.status !== 'served').length ?? 0;
  const headerStatus = order ? worstStatus(order.items) : 'pending';
  const hs    = ITEM_STATUS[headerStatus];
  const total = order?.total?.toFixed(2);

  return (
    <>
      <style>{TRACKER_CSS}</style>

      {/* ── FAB ── */}
      <button className="ot-fab" onClick={() => setOpen(true)} aria-label="View your order">
        <ShoppingBag size={22} strokeWidth={1.8} />
        {order && pendingCount > 0 && (
          <span className="ot-fab-badge">{pendingCount}</span>
        )}
      </button>

      {/* ── Overlay ── */}
      <div
        className={`ot-overlay${open ? ' ot-overlay-open' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* ── Sheet ── */}
      <div className={`ot-sheet${open ? ' ot-sheet-open' : ''}`} role="dialog" aria-modal="true">

        <div className="ot-drag-handle" />

        {/* Header */}
        <div className="ot-sheet-header">
          <div className="ot-header-left">
            {hs && (
              <span
                className={`ot-dot${hs.pulse ? ' ot-dot-pulse' : ''}`}
                style={{ '--dot-c': hs.color }}
              />
            )}
            <div>
              <div className="ot-title">
                Your Order
                {hs && (
                  <span className="ot-badge"
                    style={{ color: hs.color, background: hs.bg, borderColor: hs.border }}>
                    {hs.label}
                  </span>
                )}
              </div>
              <div className="ot-sub">
                {order
                  ? `Table ${order.tableId} · ${order.items.length} item${order.items.length !== 1 ? 's' : ''}`
                  : 'No active order'}
              </div>
            </div>
          </div>
          <button className="ot-close" onClick={() => setOpen(false)} aria-label="Close">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="ot-sheet-body">
          {error ? (
            <div className="ot-error">Connection lost — reconnecting…</div>
          ) : order ? (
            <>
              <div className="ot-legend">
                {Object.entries(ITEM_STATUS).map(([key, cfg]) => (
                  <div key={key} className="ot-leg-item">
                    <span className="ot-leg-dot" style={{ background: cfg.color }} />
                    <span>{cfg.label}</span>
                  </div>
                ))}
              </div>

              <div className="ot-items">
                {order.items.map((item, idx) => {
                  const is = ITEM_STATUS[item.status] || ITEM_STATUS.pending;
                  return (
                    <div key={item.id ?? idx} className="ot-item">
                      <div className="ot-item-left">
                        <span className="ot-qty">{item.qty}×</span>
                        <span className="ot-iname">{item.name}</span>
                      </div>
                      <div className="ot-item-right">
                        <span className="ot-iprice">{item.subtotal.toFixed(2)} TND</span>
                        <span className="ot-item-badge"
                          style={{ color: is.color, background: is.bg, borderColor: is.border }}>
                          {is.label}
                        </span>
                      </div>
                      {item.comment && (
                        <div className="ot-comment">💬 {item.comment}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="ot-divider" />
              <div className="ot-total">
                <span className="ot-total-lbl">Total</span>
                <span className="ot-total-amt">{total} <small>TND</small></span>
              </div>
            </>
          ) : (
            <div className="ot-empty">No active order</div>
          )}
        </div>

        {/* Footer */}
        <div className="ot-sheet-footer">
          <span className="ot-footer-txt">
            <span className={`ot-live-dot${connected ? '' : ' ot-live-dot-off'}`} />
            {connected ? 'Live updates' : 'Reconnecting…'}
          </span>
        </div>

      </div>
    </>
  );
}

const TRACKER_CSS = `
/* ── FAB ── */
.ot-fab{
  position:fixed; bottom:88px; right:20px; z-index:50;
  width:52px; height:52px; border-radius:50%;
  background:#e8b86d; border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:#07101e;
  box-shadow:0 6px 24px rgba(232,184,109,.4);
  transition:transform .2s, box-shadow .2s;
}
.ot-fab:hover{ transform:scale(1.07); box-shadow:0 8px 30px rgba(232,184,109,.5); }
.ot-fab:active{ transform:scale(.95); }

.ot-fab-badge{
  position:absolute; top:-2px; right:-2px;
  min-width:18px; height:18px; border-radius:999px;
  padding:0 4px;
  background:#ef4444; color:#fff;
  font-size:10px; font-weight:700; font-family:system-ui,sans-serif;
  display:flex; align-items:center; justify-content:center;
  border:2px solid #fff;
}

/* ── Overlay ── */
.ot-overlay{
  position:fixed; inset:0; z-index:60;
  background:rgba(0,0,0,0);
  pointer-events:none;
  transition:background .3s;
}
.ot-overlay.ot-overlay-open{
  background:rgba(0,0,0,.55);
  pointer-events:all;
}

/* ── Sheet ── */
.ot-sheet{
  position:fixed; bottom:0; left:0; right:0; z-index:70;
  background:#07101e;
  border-radius:22px 22px 0 0;
  border-top:1px solid rgba(255,255,255,.1);
  max-height:88vh;
  display:flex; flex-direction:column;
  transform:translateY(100%);
  transition:transform .35s cubic-bezier(.32,.72,0,1);
  font-family:var(--sans,'DM Sans',system-ui,sans-serif);
  overflow:hidden;
}
.ot-sheet.ot-sheet-open{ transform:translateY(0); }

.ot-drag-handle{
  width:36px; height:4px; border-radius:999px;
  background:rgba(255,255,255,.15);
  margin:10px auto 0; flex-shrink:0;
}

/* Header */
.ot-sheet-header{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 18px 13px;
  border-bottom:1px solid rgba(255,255,255,.07);
  flex-shrink:0;
}
.ot-header-left{ display:flex; align-items:center; gap:10px; }
.ot-title{ font-size:.88rem; font-weight:600; color:#ede7d6; display:flex; align-items:center; gap:8px; }
.ot-sub{ font-size:.66rem; color:#4a6a8a; margin-top:3px; }

.ot-close{
  width:30px; height:30px; border-radius:50%;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.1);
  cursor:pointer; color:#ede7d6;
  display:flex; align-items:center; justify-content:center;
  transition:background .2s;
  flex-shrink:0;
}
.ot-close:hover{ background:rgba(255,255,255,.14); }

/* Dot */
.ot-dot{
  width:8px; height:8px; border-radius:50%; flex-shrink:0;
  background:var(--dot-c,#f59e0b); position:relative;
}
.ot-dot-pulse::after{
  content:''; position:absolute; inset:-3px; border-radius:50%;
  background:var(--dot-c,#f59e0b); opacity:.28;
  animation:ot-pulse 2s ease-in-out infinite;
}
@keyframes ot-pulse{ 0%,100%{transform:scale(1);opacity:.35} 50%{transform:scale(1.7);opacity:0} }

.ot-badge{
  font-size:.57rem; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
  padding:2px 8px; border-radius:999px; border:1px solid;
}

/* Body */
.ot-sheet-body{ flex:1; overflow-y:auto; padding:0 0 8px; }
.ot-sheet-body::-webkit-scrollbar{ width:0; }

.ot-legend{ display:flex; gap:12px; padding:10px 16px 4px; flex-wrap:wrap; }
.ot-leg-item{ display:flex; align-items:center; gap:5px; font-size:.61rem; color:#4a6a8a; }
.ot-leg-dot{ width:6px; height:6px; border-radius:50%; flex-shrink:0; }

.ot-items{ padding:8px 14px 4px; display:flex; flex-direction:column; gap:6px; }
.ot-item{
  display:flex; align-items:center; justify-content:space-between; gap:8px;
  padding:10px 12px;
  background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.06);
  border-radius:12px;
  flex-wrap:wrap;
}
.ot-item-left{ display:flex; align-items:center; gap:8px; flex:1; min-width:0; }
.ot-qty{ font-size:.7rem; color:#4a6a8a; min-width:18px; flex-shrink:0; }
.ot-iname{ font-size:.8rem; color:#ede7d6; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ot-item-right{ display:flex; align-items:center; gap:7px; flex-shrink:0; }
.ot-iprice{ font-size:.72rem; color:#7a9ab8; }
.ot-item-badge{
  font-size:.55rem; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
  padding:2px 7px; border-radius:999px; border:1px solid; white-space:nowrap;
}
.ot-comment{
  width:100%; margin-top:4px; padding:5px 10px;
  background:rgba(250,204,21,.08); border-left:2px solid rgba(250,204,21,.4);
  font-size:.65rem; color:#fde047; border-radius:0 6px 6px 0;
}

.ot-divider{ margin:10px 16px 0; height:1px; background:rgba(255,255,255,.06); }
.ot-total{ display:flex; align-items:baseline; justify-content:space-between; padding:10px 16px 6px; }
.ot-total-lbl{ font-size:.72rem; color:#4a6a8a; }
.ot-total-amt{ font-family:'DM Serif Display',Georgia,serif; font-size:1.45rem; color:#e8b86d; }
.ot-total-amt small{ font-family:'DM Sans',system-ui,sans-serif; font-size:.6rem; color:#4a6a8a; }

.ot-empty{ padding:32px 16px; text-align:center; font-size:.8rem; color:#4a6a8a; }
.ot-error{ padding:14px 16px; font-size:.75rem; color:#f87171; }

/* Footer */
.ot-sheet-footer{
  flex-shrink:0;
  display:flex; align-items:center;
  padding:10px 16px;
  border-top:1px solid rgba(255,255,255,.05);
  background:rgba(255,255,255,.018);
}
.ot-footer-txt{ font-size:.63rem; color:#2b4460; display:flex; align-items:center; gap:6px; }
.ot-live-dot{
  display:inline-block; width:6px; height:6px; border-radius:50%;
  background:#34d399; flex-shrink:0;
  animation:ot-pulse 2s ease-in-out infinite;
}
.ot-live-dot-off{ background:#ef4444; animation:none; }
`;