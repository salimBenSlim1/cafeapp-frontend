import { ArrowLeft, Bell, LogOut, Clock, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, AlertCircle, Package } from 'lucide-react';
import { Add as AddIcon } from '@mui/icons-material';
import ServerAddItems from './ServerAddItems';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const API = process.env.REACT_APP_API_URL;
const WS  = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
const hds = () => ({ 'server-token': localStorage.getItem('serverToken') });

// ── FIX 1: Added 'canceled' to all status maps ───────────────────
const STATUS_PILL  = {
  pending:  'bg-amber-50 text-amber-700',
  preparing:'bg-blue-50 text-blue-700',
  served:   'bg-green-50 text-green-700',
  canceled: 'bg-red-50 text-red-500',          // ← added
};
const STATUS_LABEL = {
  pending:  '⏳ Pending',
  preparing:' Preparing',
  served:   '✅ Served',
  canceled: '✕ Canceled',                       // ← added
};
const CHIP_CLS = {
  pending:  'bg-amber-100 text-amber-800',
  preparing:'bg-blue-100 text-blue-800',
  served:   'bg-green-100 text-green-800',
  canceled: 'bg-red-100 text-red-600',          // ← added
};
const DETAIL_BORDER = {
  pending:  '#f59e0b',
  preparing:'#3b82f6',
  served:   '#22c55e',
  canceled: '#ef4444',                          // ← added
};
const DETAIL_BG = {
  pending:  'bg-amber-50/40',
  preparing:'bg-blue-50/40',
  served:   'bg-green-50/30',
  canceled: 'bg-red-50/30',                     // ← added
};

function timeAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60)   return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}

export default function ServerDash() {
  const [page,       setPage]       = useState(1);
  const [items,      setItems]      = useState([]);
  const [tables,     setTables]     = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [expanded,   setExpanded]   = useState(new Set());
  const [showComp,   setShowComp]   = useState(false);
  const [error,      setError]      = useState(null);
  const [connected,  setConnected]  = useState(false);
  const limit     = 10;
  const navigate  = useNavigate();
  const socketRef = useRef(null);

  /* ── fetch orders on page change ── */
  useEffect(() => {
    axios.get(`${API}/server/getOrders?page=${page}&limit=${limit}`, { headers: hds() })
      .then(r => {
        setOrders(r.data.orders ?? []);
        setTotal(r.data.total ?? 0);
        setTotalPages(r.data.totalPages ?? 1);
      })
      .catch(e => {
        if (e?.response?.status === 403) navigate(e.response.data?.redirectTo);
        if (e?.response?.status === 401) navigate(e.response.data?.redirectTo);
        else setError('Failed to load orders.');
      });
  }, [page]);

  /* ── fetch items + tables once ── */
  useEffect(() => {
    Promise.all([
      axios.get(`${API}/server/getItems`,  { headers: hds() }),
      axios.get(`${API}/server/getTables`, { headers: hds() }),
    ])
      .then(([ir, tr]) => { setItems(ir.data); setTables(tr.data); })
      .catch(e => { if (e?.response?.status === 403) navigate(e.response.data?.redirectTo); });
  }, []);

  /* ── socket ── */
  useEffect(() => {
    const token = localStorage.getItem('serverToken');
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
    let wasConnected  = false;

    socket.on('connect', () => {
      setConnected(true);
      if (wasConnected) {
        // reconnect — re-fetch page 1 to catch missed events
        axios.get(`${API}/server/getOrders?page=1&limit=${limit}`, { headers: hds() })
          .then(r => {
            setOrders(r.data.orders ?? []);
            setTotal(r.data.total ?? 0);
            setTotalPages(r.data.totalPages ?? 1);
          })
          .catch(e => { 
            if (e?.response?.status === 403) navigate(e.response?.data?.redirectTo); 
            if (e?.response?.status === 401) navigate(e.response?.data?.redirectTo); 
          });
      }
      wasConnected = true;
    });

    socket.on('disconnect',    () => setConnected(false));
    socket.on('connect_error', err => console.warn('[socket] waiter:', err.message));

    /* ── FIX 2: newOrder — normalize itemName field ─────────────── */
    socket.on('newOrder', (payload) => {
      if (payload._socketId && payload._socketId === socket.id) return;

      // Normalize OrderItems so itemName is always present
      const normalized = {
        ...payload,
        OrderItems: (payload.OrderItems ?? []).map(i => ({
          ...i,
          itemName: i.itemName ?? i.Item?.name ?? i.name ?? '?',
        })),
      };

      setOrders(prev => {
        const existingIndex = prev.findIndex(o => o.id === normalized.id);
        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            totalPrice: Number(normalized.totalPrice),
            OrderItems: [
              ...(updated[existingIndex].OrderItems || []),
              ...(normalized.OrderItems || []),
            ],
          };
          return updated;
        }
        setTotal(t => {
      const newTotal = t + 1;
      setTotalPages(Math.ceil(newTotal / limit));
      return newTotal;
    });

    const next = [normalized, ...prev];
    if (next.length > limit) next.splice(limit, 1);
    return next;

      });
    });

    /* ── FIX 3: order:canceled — patch status + all items ────────── */
    socket.on('order:canceled', ({ orderId, itemIds }) => {
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'canceled',
          OrderItems: (o.OrderItems ?? []).map(i =>
            itemIds.includes(i.id) ? { ...i, status: 'canceled' } : i
          ),
        };
      }));
    });

    /* barman changed an item status */
    socket.on('barman:itemStatusChanged', ({ orderId, orderItemId, status }) => {
      setOrders(prev => prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          OrderItems: (o.OrderItems ?? []).map(i =>
            i.id === orderItemId ? { ...i, status } : i
          ),
        };
      }));
    });

    /* whole order served */
    socket.on('orderStatusUpdated', ({ id, status }) => {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('newOrder');
      socket.off('order:canceled');
      socket.off('barman:itemStatusChanged');
      socket.off('orderStatusUpdated');
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  /* ── place order ── */
  const onOrderPlaced = async (payload) => {
    console.log(orders)
    try {
      await axios.post(
        `${API}/server/addOrderForTable`,
        payload,
        { headers: { ...hds(), 'x-socket-id': socketRef.current?.id ?? '' } }
      );
      
    } catch (e) {
      setError(e?.response?.data?.error ?? 'Failed to place order.');
      if (e?.response?.status === 403) navigate(e?.response?.data?.redirectTo);
    }
  };

  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        @keyframes detail-in{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .detail-animate{animation:detail-in .18s ease}
        @media(max-width:639px){.orders-table{display:none}.orders-cards{display:flex}.pagination-wrap{border-radius:0 0 1rem 1rem}}
        @media(min-width:640px){.orders-table{display:table}.orders-cards{display:none}}
        @media(max-width:767px){.col-total{display:none}.col-time{display:none}}
        @media(max-width:900px){.chip-area{max-width:200px}}
      `}</style>

      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50" style={{boxShadow:'0 1px 12px rgba(30,80,200,0.06)'}}>
        <div className="max-w-5xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={() => window.history.back()} className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-semibold hover:bg-slate-200 transition-colors shrink-0">
              <ArrowLeft size={13}/><span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <img src="/images/coffai1.png" alt="" className="w-7 h-7 object-contain shrink-0"/>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 tracking-tight leading-none truncate">Orders</div>
                <div className="text-[10px] text-slate-400 mt-0.5 hidden sm:block">Server Dashboard</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span title={connected?'Live':'Reconnecting…'} className={`w-2 h-2 rounded-full shrink-0 transition-colors ${connected?'bg-green-400':'bg-red-400 animate-pulse'}`}/>
            <h1 className='text-sm'>{localStorage.getItem('name')}</h1>
            <button className="relative w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <Bell size={16} className="text-slate-500"/>
            </button>
            <button onClick={()=>{localStorage.clear();window.history.back();}} className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors">
              <LogOut size={13}/><span className="hidden sm:inline">Disconnect</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-5 py-4 sm:py-6 pb-28 flex flex-col gap-4 sm:gap-5">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium">
            <AlertCircle size={14} className="shrink-0"/>
            <span className="flex-1">{error}</span>
            <button onClick={()=>setError(null)} className="text-red-400 hover:text-red-600 leading-none text-base shrink-0">✕</button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-4xl mb-3">☕</div>
              <div className="text-base font-semibold text-blue-400">No orders yet</div>
              <div className="text-sm mt-1">Tap "Add Order" to get started</div>
            </div>
          ) : (
            <>
              {/* TABLE VIEW ≥640px */}
              <table className="orders-table w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50/50 border-b border-slate-100">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Table</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Items</th>
                    <th className="col-total px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Total</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                    <th className="col-time px-4 py-3 text-left text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Time</th>
                    <th className="w-8 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const orderItems = order.OrderItems ?? [];
                    const preview    = orderItems.slice(0, 2);
                    const isOpen     = expanded.has(order.id);
                    return (
                      <>
                        <tr key={`row-${order.id}`} onClick={() => toggleExpand(order.id)}
                          className={['border-b border-slate-50 cursor-pointer transition-all duration-150 select-none',
                            isOpen ? 'bg-blue-50/30 border-b-0' : 'hover:bg-slate-50/80'].join(' ')}
                        >
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-bold text-slate-800 bg-indigo-50 px-2.5 py-1 rounded-lg">#{order.tableNumber}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="chip-area flex flex-wrap gap-1">
                              {preview.map((item, i) => (
                                <span key={i} className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap ${CHIP_CLS[item.status] ?? CHIP_CLS.pending}`}>
                                  {item.itemName}<span className="font-bold ml-0.5">×{item.quantity}</span>
                                </span>
                              ))}
                              {orderItems.length > 2 && <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-400">+{orderItems.length-2}</span>}
                            </div>
                          </td>
                          <td className="col-total px-4 py-3.5">
                            <span className="text-sm font-bold text-blue-700">{Number(order.totalPrice).toFixed(2)} TND</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_PILL[order.status] ?? STATUS_PILL.pending}`}>
                              {STATUS_LABEL[order.status] ?? STATUS_LABEL.pending}
                            </span>
                          </td>
                          <td className="col-time px-4 py-3.5">
                            <div className="flex items-center gap-1 text-[11px] text-slate-400"><Clock size={10}/> {timeAgo(order.updatedAt||order.createdAt)}</div>
                          </td>
                          <td className="px-4 py-3.5 w-8 text-center">
                            <div className={`flex justify-center ${isOpen?'text-blue-500':'text-slate-400'}`}>
                              {isOpen?<ChevronUp size={14}/>:<ChevronDown size={14}/>}
                            </div>
                          </td>
                        </tr>

                        {isOpen && (
                          <tr key={`detail-${order.id}`}>
                            <td colSpan={6} className="p-0">
                              <div className="detail-animate border-b border-slate-100" style={{background:'linear-gradient(to bottom,#f0f6ff,#f8faff)'}}>
                                <div className="flex items-center gap-2 px-5 pt-3 pb-2 border-b border-blue-100/60">
                                  <Package size={12} className="text-blue-400"/>
                                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
                                    Order #{order.id} · {orderItems.length} item{orderItems.length!==1?'s':''}
                                  </span>
                                  <span className="ml-auto text-[11px] text-slate-400">{timeAgo(order.createdAt)}</span>
                                </div>
                                <div className="px-4 py-3 flex flex-col gap-2">
                                  {orderItems.map((item, idx) => {
                                    const st = item.status ?? 'pending';
                                    return (
                                      <div key={item.id??idx} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm border-l-[3px] shadow-sm ${DETAIL_BG[st] ?? DETAIL_BG.pending}`} style={{borderLeftColor: DETAIL_BORDER[st] ?? DETAIL_BORDER.pending}}>
                                        <span className="font-semibold text-slate-800 flex-1 truncate">{item.itemName}</span>
                                        {item.comment && item.comment.trim()!=='' && (
                                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 shrink-0 hidden sm:inline-flex items-center gap-1">
                                            💬 {item.comment}
                                          </span>
                                        )}
                                        <span className="text-slate-400 font-bold text-xs shrink-0 tabular-nums">×{item.quantity}</span>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_PILL[st] ?? STATUS_PILL.pending}`}>{STATUS_LABEL[st] ?? STATUS_LABEL.pending}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className="flex items-center justify-between px-5 py-2.5 border-t border-blue-100/60">
                                  <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Total</span>
                                  <span className="text-sm font-bold text-blue-700">{Number(order.totalPrice).toFixed(2)} TND</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>

              {/* CARD VIEW <640px */}
              <div className="orders-cards flex-col divide-y divide-slate-50">
                {orders.map(order => {
                  const orderItems = order.OrderItems ?? [];
                  const isOpen     = expanded.has(order.id);
                  const st         = order.status ?? 'pending';
                  return (
                    <div key={`card-${order.id}`}>
                      <div onClick={() => toggleExpand(order.id)}
                        className={['flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors select-none',
                          isOpen?'bg-blue-50/40':'hover:bg-slate-50'].join(' ')}
                      >
                        <div className="flex flex-col items-center justify-center bg-indigo-50 rounded-xl w-12 h-12 shrink-0">
                          <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wide leading-none">TBL</span>
                          <span className="text-lg font-bold text-indigo-700 leading-none mt-0.5">{order.tableNumber}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_PILL[st] ?? STATUS_PILL.pending}`}>{STATUS_LABEL[st] ?? STATUS_LABEL.pending}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Clock size={9}/> {timeAgo(order.createdAt)}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {orderItems.slice(0,2).map((item,i)=>(
                              <span key={i} className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CHIP_CLS[item.status] ?? CHIP_CLS.pending}`}>
                                {item.itemName} ×{item.quantity}
                              </span>
                            ))}
                            {orderItems.length > 2 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">+{orderItems.length-2}</span>}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-sm font-bold text-blue-700">{Number(order.totalPrice).toFixed(2)} TND</span>
                          <div className={isOpen?'text-blue-400':'text-slate-300'}>{isOpen?<ChevronUp size={14}/>:<ChevronDown size={14}/>}</div>
                        </div>
                      </div>
                      {isOpen && (
                        <div className="detail-animate border-t border-blue-100/60" style={{background:'linear-gradient(to bottom,#f0f6ff,#f8faff)'}}>
                          <div className="px-4 py-3 flex flex-col gap-2">
                            {orderItems.map((item,idx)=>{
                              const ist = item.status ?? 'pending';
                              return (
                                <div key={item.id??idx} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border-l-[3px] shadow-sm ${DETAIL_BG[ist] ?? DETAIL_BG.pending}`} style={{borderLeftColor: DETAIL_BORDER[ist] ?? DETAIL_BORDER.pending}}>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-slate-800 text-sm truncate">{item.itemName}</div>
                                    {item.comment && item.comment.trim()!=='' && <div className="text-[11px] text-amber-700 mt-0.5">💬 {item.comment}</div>}
                                  </div>
                                  <span className="text-slate-400 font-bold text-xs shrink-0 mt-0.5">×{item.quantity}</span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${STATUS_PILL[ist] ?? STATUS_PILL.pending}`}>{STATUS_LABEL[ist] ?? STATUS_LABEL.pending}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex justify-between items-center px-4 pb-3 pt-1">
                            <span className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">Total</span>
                            <span className="text-sm font-bold text-blue-700">{Number(order.totalPrice).toFixed(2)} TND</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="pagination-wrap flex items-center justify-between px-4 py-3 border-t border-slate-100 flex-wrap gap-2.5">
                  <span className="text-xs text-slate-500">{total} order{total!==1?'s':''} · page {page} of {totalPages}</span>
                  <div className="flex items-center gap-1">
                    <PgBtn disabled={page===1} onClick={()=>setPage(1)}>«</PgBtn>
                    <PgBtn disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={13}/></PgBtn>
                    {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>Math.abs(p-page)<=2).map(p=>(
                      <PgBtn key={p} active={p===page} onClick={()=>setPage(p)}>{p}</PgBtn>
                    ))}
                    <PgBtn disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={13}/></PgBtn>
                    <PgBtn disabled={page===totalPages} onClick={()=>setPage(totalPages)}>»</PgBtn>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* FAB */}
      <button onClick={()=>setShowComp(true)}
        className="fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-full bg-blue-700 text-white text-sm font-bold transition-all hover:-translate-y-0.5 hover:bg-blue-800 active:translate-y-0"
        style={{boxShadow:'0 6px 24px rgba(29,78,216,0.38)'}}>
        <AddIcon style={{fontSize:17}}/>
        <span className="hidden sm:inline">Add Order</span>
        <span className="sm:hidden">Add</span>
      </button>

      <ServerAddItems
        items={items} tables={tables}
        showComp={showComp} setShowComp={setShowComp}
        onOrderPlaced={onOrderPlaced}
      />
    </div>
  );
}

function PgBtn({ children, disabled=false, active=false, onClick }) {
  return (
    <button disabled={disabled} onClick={onClick}
      className={['min-w-[32px] h-8 px-2 rounded-lg border text-[13px] font-medium flex items-center justify-center transition-all',
        active    ? 'bg-blue-700 border-blue-700 text-white cursor-default'
        : disabled ? 'border-slate-200 text-slate-300 cursor-not-allowed'
        :            'border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50'
      ].join(' ')}>
      {children}
    </button>
  );
}