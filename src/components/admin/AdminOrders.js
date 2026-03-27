import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  ArrowLeft, Bell, Clock, CheckCircle2, Printer,
  Pencil, Trash2, X, Check, ShoppingBag, AlertTriangle,
} from 'lucide-react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Pagination,
} from '@mui/material';
import { io } from 'socket.io-client';
import SuccessMessage from './SuccessAlert';
import cafeApi from '../../api/cafeApiInstance';

/* ─────────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────────── */
const STATUS = {
  pending:  { label: 'Pending',  bg: 'rgba(245,158,11,.12)',  text: '#f59e0b', border: 'rgba(245,158,11,.28)'  },
  prepared: { label: 'Prepared', bg: 'rgba(14,165,233,.12)',  text: '#38bdf8', border: 'rgba(14,165,233,.28)'  },
  served:   { label: 'Served',   bg: 'rgba(52,211,153,.12)',  text: '#34d399', border: 'rgba(52,211,153,.28)'  },
  canceled: { label: 'Canceled', bg: 'rgba(248,113,113,.12)', text: '#f87171', border: 'rgba(248,113,113,.28)' },
};

const ORDERS_PER_PAGE = 10;

/* ─────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────── */
const StatusBadge = memo(function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 12px', borderRadius: 999,
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      fontWeight: 700, fontSize: '.68rem', letterSpacing: '.08em', textTransform: 'uppercase',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.text, flexShrink: 0 }}/>
      {s.label}
    </span>
  );
});

const OrderRow = memo(function OrderRow({ order, idx, onRowClick, onServe, onCancel }) {
  const isActive = order.status === 'pending' || order.status === 'prepared';

  return (
    <div
      className="ao-row-enter"
      style={{
        display: 'grid',
        gridTemplateColumns: '70px 1fr 110px 180px 70px',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: '1px solid rgba(27,203,224,.07)',
        cursor: 'pointer',
        transition: 'background .15s',
        animationDelay: `${idx * 0.04}s`,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(27,203,224,.04)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Table number */}
      <span style={{
        fontWeight: 800, fontSize: '1.1rem',
        background: 'linear-gradient(135deg,#1bcbe0,#1a6dd4)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>
        #{order.tableNumber}
      </span>

      {/* Items */}
      <div onClick={() => onRowClick(order)} style={{ minWidth: 0 }}>
        {order.OrderItems.map((item, i) => (
          <div key={i} style={{ fontSize: '.84rem', color: '#c8dff0', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: '#1bcbe0' }}>{item.quantity}×</span>{' '}
            {item.itemName}
          </div>
        ))}
      </div>

      {/* Total */}
      <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#34d399' }}>
        {Number(order.totalPrice).toFixed(2)} TND
      </span>

      {/* Status / actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {isActive ? (
          <>
            <button
              onClick={e => { e.stopPropagation(); onServe(order.id, order.tableId); }}
              style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 12px',borderRadius:999,background:'rgba(52,211,153,.12)',color:'#34d399',border:'1px solid rgba(52,211,153,.3)',cursor:'pointer',fontFamily:'inherit',fontSize:'.72rem',fontWeight:700,transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(52,211,153,.22)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(52,211,153,.12)'}>
              <Check size={11}/> Serve
            </button>
            <button
              onClick={e => { e.stopPropagation(); onCancel(order.id, order.tableId); }}
              style={{ display:'flex',alignItems:'center',gap:4,padding:'4px 12px',borderRadius:999,background:'rgba(248,113,113,.1)',color:'#f87171',border:'1px solid rgba(248,113,113,.25)',cursor:'pointer',fontFamily:'inherit',fontSize:'.72rem',fontWeight:700,transition:'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(248,113,113,.2)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(248,113,113,.1)'}>
              <X size={11}/> Cancel
            </button>
          </>
        ) : (
          <StatusBadge status={order.status} />
        )}
      </div>

      {/* Time */}
      <span style={{ color: '#4a7099', fontSize: '.78rem' }}>
        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
function AdminOrders() {
  const [allOrders,        setAllOrders]        = useState([]);
  const [totalOrders,      setTotalOrders]       = useState(0);
  const [totalPages,       setTotalPages]        = useState(1);
  const [currentPage,      setCurrentPage]       = useState(1);
  const [alerts,           setAlerts]            = useState([]);
  const [notifCount,       setNotifCount]        = useState(0);
  const [showSuccess,      setShowSuccess]       = useState(false);
  const [isLoading,        setIsLoading]         = useState(true);
  const [showAllAlerts,    setShowAllAlerts]     = useState(false);

  // Detail dialog
  const [selectedOrder,    setSelectedOrder]     = useState(null);
  const [openDialog,       setOpenDialog]        = useState(false);
  const [editingItem,      setEditingItem]       = useState(null);
  const [itemQuantity,     setItemQuantity]      = useState(0);

  // Delete dialog
  const [openDeleteDialog, setOpenDeleteDialog]  = useState(false);
  const [itemToDelete,     setItemToDelete]      = useState(null);

  /* ── Socket ── */
  useEffect(() => {
    const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');
    const sock = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      transports: ['polling', 'websocket'],
      upgrade: true,
      withCredentials: true,
    });

    sock.on('connect_error', err => console.warn('[socket] admin connect error:', err.message));
    sock.on('newAlert', d => setAlerts(p => [...p, d]));
sock.on('newOrder', newOrder => {
  setNotifCount(p => p + 1);
  const normalized = {
    ...newOrder,
    tableNumber: newOrder.tableNumber ?? newOrder.Table?.number ?? '?',
    OrderItems: (newOrder.OrderItems ?? []).map(i => ({
      ...i,
      itemName: i.itemName ?? '?',
      status:   i.status   ?? 'pending',
    })),
  };
  setAllOrders(p => {
    const exists = p.find(o => o.id === normalized.id);
    if (exists) {
      // Merge incoming items — add only items not already in the order
      const existingItemIds = new Set(exists.OrderItems.map(i => i.id));
      const newItems = normalized.OrderItems.filter(i => !existingItemIds.has(i.id));
      if (newItems.length === 0) return p; // truly duplicate, skip
      return p.map(o =>
        o.id === normalized.id
          ? {
              ...o,
              OrderItems: [...o.OrderItems, ...newItems],
              totalPrice: normalized.totalPrice,
            }
          : o
      );
    }
    return [normalized, ...p];
  });
  setTotalOrders(p => p + 1);
});

    sock.on('orderStatusUpdated', d => {
      setAllOrders(p => p.map(o => o.id === d.id ? { ...o, status: d.status } : o));
    });

    sock.on('order:canceled', ({ orderId, itemIds }) => {
      setAllOrders(p => p.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: 'canceled',
          OrderItems: o.OrderItems.map(i =>
            itemIds.includes(i.id) ? { ...i, status: 'canceled' } : i
          ),
        };
      }));
      setSelectedOrder(prev =>
        prev?.id === orderId
          ? {
              ...prev,
              status: 'canceled',
              OrderItems: prev.OrderItems.map(i =>
                itemIds.includes(i.id) ? { ...i, status: 'canceled' } : i
              ),
            }
          : prev
      );
    });

    sock.on('barman:itemStatusChanged', d => {
      setAllOrders(p => p.map(o => {
        if (o.id !== d.orderId) return o;
        return {
          ...o,
          OrderItems: o.OrderItems.map(i =>
            i.id === d.orderItemId ? { ...i, status: d.status } : i
          ),
        };
      }));
    });

    return () => {
      sock.off('newAlert');
      sock.off('newOrder');
      sock.off('orderStatusUpdated');
      sock.off('order:canceled');
      sock.off('barman:itemStatusChanged');
      sock.connected && sock.close();
    };
  }, []);

  /* ── Fetch ── */
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      cafeApi.get(`/getOrders?page=${currentPage}`),
      currentPage === 1 ? cafeApi.get('/itemsEndSoon') : Promise.resolve(null),
    ])
      .then(([ordersRes, alertsRes]) => {
        setAllOrders(ordersRes.data.orders);
        setTotalOrders(ordersRes.data.total);
        setTotalPages(ordersRes.data.totalPages);
        if (alertsRes) setAlerts(alertsRes.data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentPage]);

  /* ── Handlers ── */
  const handleRowClick = useCallback((order) => {
    setSelectedOrder(order);
    setEditingItem(null);
    setOpenDialog(true);
    setNotifCount(0);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setSelectedOrder(null);
    setEditingItem(null);
  }, []);

  const handleEditItem = useCallback((item) => {
    setEditingItem(item);
    setItemQuantity(item.quantity);
  }, []);

  const handleUpdateQuantity = useCallback(() => {
    if (!editingItem || !selectedOrder) return;
    const newQty = parseInt(itemQuantity);
    if (!newQty || newQty < 1) return;

    cafeApi.put('/updateOrder/' + editingItem.id, { quantity: newQty })
      .then(() => {
        setAllOrders(p => p.map(o => {
          if (o.id !== selectedOrder.id) return o;
          const updatedItems = o.OrderItems.map(i =>
            i.id === editingItem.id ? { ...i, quantity: newQty } : i
          );
          return {
            ...o,
            OrderItems: updatedItems,
            totalPrice: updatedItems.reduce((s, i) => s + i.price * i.quantity, 0),
          };
        }));
        setSelectedOrder(prev => ({
          ...prev,
          OrderItems: prev.OrderItems.map(i =>
            i.id === editingItem.id ? { ...i, quantity: newQty } : i
          ),
        }));
        setEditingItem(null);
        setShowSuccess(true);
      })
      .catch(console.error);
  }, [editingItem, itemQuantity, selectedOrder]);

  const handleDeleteClick = useCallback((item) => {
    setItemToDelete(item);
    setOpenDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!itemToDelete) return;
    cafeApi.delete('/deleteOrder/' + itemToDelete.id)
      .then(() => {
        setAllOrders(p => p.map(o => {
          if (!o.OrderItems.some(i => i.id === itemToDelete.id)) return o;
          const updatedItems = o.OrderItems.filter(i => i.id !== itemToDelete.id);
          if (updatedItems.length === 0) return null;
          return {
            ...o,
            OrderItems: updatedItems,
            totalPrice: updatedItems.reduce((s, i) => s + i.price * i.quantity, 0),
          };
        }).filter(Boolean));
        setSelectedOrder(prev => prev ? {
          ...prev,
          OrderItems: prev.OrderItems.filter(i => i.id !== itemToDelete.id),
        } : null);
        setOpenDeleteDialog(false);
        setOpenDialog(false);
        setShowSuccess(true);
        setItemToDelete(null);
      })
      .catch(console.error);
  }, [itemToDelete]);

  const handleCancelDelete = useCallback(() => {
    setOpenDeleteDialog(false);
    setItemToDelete(null);
  }, []);

  const handleServe = useCallback((id, tableId) => {
    cafeApi.put('/updateOrderStatus/' + id, { status: 'served', tableId })
      .then(() => {
        setAllOrders(p => p.map(o => {
          if (o.id !== id) return o;
          return {
            ...o,
            status: 'served',
            OrderItems: o.OrderItems.map(i => ({ ...i, status: 'served' })),
          };
        }));
        setShowSuccess(true);
      })
      .catch(console.error);
  }, []);

  const handleCancel = useCallback((id, tableId) => {
    cafeApi.put('/updateOrderStatus/' + id, { status: 'canceled', tableId })
      .then(() => {
        setAllOrders(p => p.map(o => {
          if (o.id !== id) return o;
          return {
            ...o,
            status: 'canceled',
            OrderItems: o.OrderItems.map(i => ({ ...i, status: 'canceled' })),
          };
        }));
        setSelectedOrder(prev =>
          prev?.id === id
            ? { ...prev, status: 'canceled', OrderItems: prev.OrderItems.map(i => ({ ...i, status: 'canceled' })) }
            : prev
        );
      })
      .catch(console.error);
  }, []);

  /* ═════════════════ RENDER ═════════════════ */
  return (
    <>
      <style>{CSS}</style>
      <div className="ao-root" style={{ minHeight: '100vh', background: '#0d1f3c', paddingBottom: 60 }}>

        {/* Background */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', width:500, height:500, background:'#1bcbe0', opacity:.07, filter:'blur(90px)', top:-120, right:-80, borderRadius:'50%' }}/>
          <div style={{ position:'absolute', width:400, height:400, background:'#1a6dd4', opacity:.07, filter:'blur(80px)', bottom:-80, left:-60, borderRadius:'50%' }}/>
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(27,203,224,.11) 1px,transparent 1px)', backgroundSize:'38px 38px' }}/>
        </div>

        <div style={{ position:'relative', zIndex:1, maxWidth:1200, margin:'0 auto', padding:'0 24px' }}>

          {/* HEADER */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'28px 0 24px', borderBottom:'1px solid rgba(27,203,224,.1)', marginBottom:32 }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <button
                onClick={() => window.history.back()}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:999, background:'rgba(255,255,255,.04)', border:'1px solid rgba(27,203,224,.15)', color:'#7a9dc0', fontSize:'.82rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(27,203,224,.4)'; e.currentTarget.style.color='#1bcbe0'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(27,203,224,.15)'; e.currentTarget.style.color='#7a9dc0'; }}
              >
                <ArrowLeft size={15}/> Back
              </button>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <img src="/images/coffai1.png" alt="CoffAI" style={{ width:36 }}/>
                <div>
                  <h1 style={{ fontWeight:800, fontSize:'1.5rem', letterSpacing:'-.02em', lineHeight:1.1, background:'linear-gradient(135deg,#1bcbe0,#1a6dd4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:0 }}>
                    Orders
                  </h1>
                  <p style={{ fontSize:'.75rem', color:'#4a7099', marginTop:2, margin:0 }}>
                    Real-time order management · {totalOrders} total
                  </p>
                </div>
              </div>
            </div>

            {/* Bell */}
            <button style={{ position:'relative', width:44, height:44, borderRadius:'50%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(27,203,224,.15)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <Bell size={20} color={notifCount > 0 ? '#1bcbe0' : '#4a7099'} style={notifCount > 0 ? { animation:'ao-pulse 1.8s ease-in-out infinite' } : {}}/>
              {notifCount > 0 && (
                <span style={{ position:'absolute', top:-4, right:-4, width:20, height:20, borderRadius:'50%', background:'linear-gradient(135deg,#1bcbe0,#1a6dd4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.58rem', fontWeight:800, color:'#fff' }}>
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </button>
          </div>

          {/* LOW STOCK ALERTS */}
          {alerts.length > 0 && (() => {
            const VISIBLE = 3;
            const shown   = showAllAlerts ? alerts : alerts.slice(0, VISIBLE);
            const hidden  = alerts.length - VISIBLE;
            return (
              <div style={{ marginBottom: 20, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(251,191,36,.22)', background: 'rgba(251,191,36,.05)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'1px solid rgba(251,191,36,.15)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <AlertTriangle size={15} color="#fbbf24"/>
                    <span style={{ fontSize:'.75rem', fontWeight:700, color:'#fbbf24', letterSpacing:'.08em', textTransform:'uppercase' }}>
                      Low Stock — {alerts.length} item{alerts.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <a href="/admin/items" style={{ fontSize:'.72rem', fontWeight:700, color:'#1bcbe0', textDecoration:'none', letterSpacing:'.04em' }}>
                    Manage stock →
                  </a>
                </div>
                {shown.map((e, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 14px', borderBottom: i < shown.length - 1 ? '1px solid rgba(251,191,36,.08)' : 'none' }}>
                    <span style={{ fontSize:'.82rem', color:'#c8dff0', fontWeight:500 }}>
                      <strong style={{ color:'#fbbf24', fontWeight:700 }}>{e.name}</strong>
                    </span>
                    <span style={{ fontSize:'.75rem', fontWeight:700, color:'#f87171', background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.2)', padding:'2px 10px', borderRadius:999, flexShrink:0, marginLeft:12 }}>
                      {e.stock} left
                    </span>
                  </div>
                ))}
                {alerts.length > VISIBLE && (
                  <button
                    onClick={() => setShowAllAlerts(v => !v)}
                    style={{ width:'100%', padding:'8px', background:'rgba(251,191,36,.06)', border:'none', borderTop:'1px solid rgba(251,191,36,.1)', cursor:'pointer', fontFamily:'inherit', fontSize:'.72rem', fontWeight:700, color:'#fbbf24', letterSpacing:'.06em' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(251,191,36,.12)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(251,191,36,.06)'}
                  >
                    {showAllAlerts ? '▲ Show less' : `▼ Show ${hidden} more`}
                  </button>
                )}
              </div>
            );
          })()}

          {showSuccess && <SuccessMessage setShowSuccess={setShowSuccess}/>}

          {/* TABLE */}
          <div style={{ borderRadius:18, overflow:'hidden', background:'rgba(255,255,255,.03)', border:'1px solid rgba(27,203,224,.12)' }}>
            {/* Header row */}
            <div style={{ display:'grid', gridTemplateColumns:'70px 1fr 110px 180px 70px', padding:'12px 20px', borderBottom:'1px solid rgba(27,203,224,.1)', color:'#4a7099', fontSize:'.65rem', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase' }}>
              <span>Table</span><span>Items</span><span>Total</span><span>Status</span><span>Time</span>
            </div>

            {isLoading ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px 0', gap:16 }}>
                <div className="ao-spinner"/>
                <p style={{ color:'#4a7099', fontSize:'.88rem' }}>Loading orders…</p>
              </div>
            ) : allOrders.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'64px 0', gap:12 }}>
                <ShoppingBag size={40} color="rgba(27,203,224,.2)"/>
                <p style={{ color:'#2a4a6a', fontSize:'.9rem', margin:0 }}>No orders yet</p>
              </div>
            ) : (
              allOrders.map((order, idx) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  idx={idx}
                  onRowClick={handleRowClick}
                  onServe={handleServe}
                  onCancel={handleCancel}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', marginTop:28 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, v) => setCurrentPage(v)}
                color="primary" size="large"
                showFirstButton showLastButton
                className="ao-root"
              />
            </div>
          )}

        </div>

        {/* ══ ORDER DETAIL DIALOG ══ */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth className="ao-root">
          <DialogTitle>Order Detail — Table #{selectedOrder?.tableNumber}</DialogTitle>
          <DialogContent>
            <div style={{ display:'flex', flexDirection:'column', gap:12, paddingTop:8 }}>
              {selectedOrder?.OrderItems?.map(item => (
                <div key={item.id}
                  style={{ display:'flex', alignItems:'flex-start', gap:12, borderRadius:14, padding:16, background:'rgba(255,255,255,.04)', border:'1px solid rgba(27,203,224,.1)' }}>

                  {editingItem?.id === item.id ? (
                    <div style={{ display:'flex', flexDirection:'column', gap:12, width:'100%' }}>
                      <p style={{ fontWeight:700, color:'#e8f4ff', margin:0 }}>{item.itemName}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                        <TextField
                          type="number" value={itemQuantity} size="small"
                          onChange={e => setItemQuantity(e.target.value)}
                          inputProps={{ min: 1 }} style={{ width: 90 }}
                        />
                        <button onClick={handleUpdateQuantity}
                          style={{ padding:'8px 18px', borderRadius:12, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'.85rem', color:'#0d1f3c', background:'linear-gradient(135deg,#1bcbe0,#1a6dd4)', boxShadow:'0 4px 14px rgba(27,203,224,.3)' }}>
                          Update
                        </button>
                        <button onClick={() => setEditingItem(null)}
                          style={{ padding:'8px 16px', borderRadius:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'.85rem', color:'#7a9dc0', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto', gap:12, alignItems:'center', width:'100%' }}>
                      <div>
                        <p style={{ fontWeight:700, fontSize:'.9rem', color:'#e8f4ff', margin:0, marginBottom:4 }}>
                          <span style={{ color:'#1bcbe0' }}>{item.quantity}×</span> {item.itemName}
                        </p>
                        <p style={{ fontSize:'.78rem', fontWeight:700, color:'#34d399', margin:0 }}>
                          {(item.quantity * item.price).toFixed(2)} TND
                        </p>
                        {item.comment && (
                          <p style={{ fontSize:'.75rem', color:'#4a7099', margin:'4px 0 0', fontStyle:'italic' }}>
                            {item.comment}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={item.status}/>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => handleEditItem(item)}
                          style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(26,109,212,.1)', border:'1px solid rgba(26,109,212,.2)', color:'#1a6dd4', cursor:'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(26,109,212,.22)'}
                          onMouseLeave={e => e.currentTarget.style.background='rgba(26,109,212,.1)'}>
                          <Pencil size={14}/>
                        </button>
                        <button onClick={() => handleDeleteClick(item)}
                          style={{ width:34, height:34, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(248,113,113,.1)', border:'1px solid rgba(248,113,113,.2)', color:'#f87171', cursor:'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(248,113,113,.22)'}
                          onMouseLeave={e => e.currentTarget.style.background='rgba(248,113,113,.1)'}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DialogContent>
          <DialogActions>
            <button onClick={handleCloseDialog}
              style={{ padding:'9px 20px', borderRadius:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'.85rem', color:'#7a9dc0', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.09)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.05)'}>
              Close
            </button>
          </DialogActions>
        </Dialog>

        {/* ══ DELETE CONFIRM ══ */}
        <Dialog open={openDeleteDialog} onClose={handleCancelDelete} className="ao-root">
          <DialogTitle><span style={{ color:'#f87171', fontWeight:800 }}>Remove item?</span></DialogTitle>
          <DialogContent>
            <p style={{ color:'#7a9dc0', fontSize:'.9rem', lineHeight:1.6, paddingTop:8, margin:0 }}>
              Remove <strong style={{ color:'#e8f4ff' }}>{itemToDelete?.itemName}</strong> from this order?
              {' '}This cannot be undone.
            </p>
          </DialogContent>
          <DialogActions>
            <button onClick={handleCancelDelete}
              style={{ padding:'9px 20px', borderRadius:12, cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:'.85rem', color:'#7a9dc0', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.09)'}
              onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.05)'}>
              Cancel
            </button>
            <button onClick={handleConfirmDelete}
              style={{ padding:'9px 20px', borderRadius:12, border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:700, fontSize:'.85rem', color:'#fff', background:'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow:'0 4px 16px rgba(239,68,68,.3)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 6px 20px rgba(239,68,68,.5)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(239,68,68,.3)'}>
              Delete
            </button>
          </DialogActions>
        </Dialog>

      </div>
    </>
  );
}

export default AdminOrders;

/* ─── CSS ─────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
.ao-root { font-family: 'Plus Jakarta Sans', sans-serif; }

@keyframes ao-slideup { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
.ao-row-enter { animation: ao-slideup .35s ease-out both; }

@keyframes ao-pulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.22);} }

@keyframes ao-spin { to { transform: rotate(360deg); } }
.ao-spinner {
  width: 36px; height: 36px; border-radius: 50%;
  border: 2.5px solid rgba(27,203,224,.15);
  border-top-color: #1bcbe0;
  animation: ao-spin .7s linear infinite;
}

.ao-root .MuiDialog-paper { background:#0d1f3c !important; border:1px solid rgba(27,203,224,.2) !important; border-radius:20px !important; color:#e8f4ff !important; font-family:'Plus Jakarta Sans',sans-serif !important; }
.ao-root .MuiDialogTitle-root { background:rgba(27,203,224,.06) !important; border-bottom:1px solid rgba(27,203,224,.12) !important; color:#e8f4ff !important; font-family:'Plus Jakarta Sans',sans-serif !important; font-weight:800 !important; font-size:1.05rem !important; }
.ao-root .MuiDialogContent-root { background:transparent !important; padding:20px !important; }
.ao-root .MuiDialogActions-root { background:rgba(255,255,255,.02) !important; border-top:1px solid rgba(27,203,224,.1) !important; padding:14px 20px !important; }
.ao-root .MuiPagination-root .MuiPaginationItem-root { color:#4a7099 !important; border-color:rgba(27,203,224,.15) !important; font-family:'Plus Jakarta Sans',sans-serif !important; }
.ao-root .MuiPagination-root .Mui-selected { background:linear-gradient(135deg,#1bcbe0,#1a6dd4) !important; color:#fff !important; border-color:transparent !important; }
.ao-root .MuiTextField-root .MuiOutlinedInput-root { background:rgba(255,255,255,.04) !important; border-radius:10px !important; color:#e8f4ff !important; font-family:'Plus Jakarta Sans',sans-serif !important; }
.ao-root .MuiTextField-root .MuiOutlinedInput-notchedOutline { border-color:rgba(27,203,224,.2) !important; }
.ao-root .MuiTextField-root .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline { border-color:rgba(27,203,224,.4) !important; }
.ao-root .MuiTextField-root .Mui-disabled { color:#4a7099 !important; -webkit-text-fill-color:#4a7099 !important; }
`;