import { X, Search, Minus, Plus, ShoppingCart, Check, ChevronRight, StickyNote } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

/* ─── debounce — outside component so it's never redefined ── */
function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const CAT_ICON = { coffee:'☕', juice:'🧃', drink:'🥤', food:'🍽️', dessert:'🍰', smoking:'💨', games:'🎮', default:'✦' };

const STEP_TITLES = { table:'Select Table', items:'Add Items', review:'Review Order' };

/* ─── Styles ──────────────────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  .sa-shade{position:fixed;inset:0;z-index:1000;background:rgba(6,12,28,0.65);backdrop-filter:blur(8px);display:flex;align-items:flex-end;font-family:'Plus Jakarta Sans',sans-serif;animation:sa-fade .22s ease;}
  @keyframes sa-fade{from{opacity:0}to{opacity:1}}
  .sa-modal{width:100%;max-width:560px;margin:0 auto;background:#f5f8ff;border-radius:22px 22px 0 0;max-height:94vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -12px 60px rgba(30,80,200,0.15);animation:sa-up .32s cubic-bezier(.32,.72,0,1);}
  @keyframes sa-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
  .sa-handle{width:36px;height:4px;border-radius:2px;background:#d0d9f0;margin:11px auto 0;flex-shrink:0;}
  .sa-header{padding:14px 20px 12px;border-bottom:1px solid #e2e8f8;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:#fff;}
  .sa-header-left{display:flex;align-items:center;gap:10px;}
  .sa-logo{width:28px;height:28px;object-fit:contain;}
  .sa-title{font-size:16px;font-weight:700;color:#0d1a40;letter-spacing:-.3px;line-height:1.2;}
  .sa-subtitle{font-size:11px;color:#7a8bb0;}
  .sa-close{width:32px;height:32px;border-radius:50%;border:none;background:#eef2ff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#4a5fa0;transition:background .15s;}
  .sa-close:hover{background:#dce4ff;}
  .sa-steps{display:flex;background:#fff;border-bottom:1px solid #e2e8f8;flex-shrink:0;}
  .sa-step-tab{flex:1;padding:10px 0;font-size:11px;font-weight:600;color:#9aaad0;text-align:center;position:relative;letter-spacing:.6px;text-transform:uppercase;border:none;background:none;cursor:default;transition:color .2s;font-family:'Plus Jakarta Sans',sans-serif;}
  .sa-step-tab.active{color:#1d4ed8;}
  .sa-step-tab.active::after{content:'';position:absolute;bottom:-1px;left:15%;right:15%;height:2px;background:linear-gradient(90deg,#3b82f6,#1d4ed8);border-radius:1px;}
  .sa-step-tab.done{color:#22c55e;cursor:pointer;}
  .sa-step-body{flex:1;display:flex;flex-direction:column;overflow:hidden;}
  .sa-scroll{flex:1;overflow-y:auto;}
  .sa-scroll::-webkit-scrollbar{width:3px;}
  .sa-scroll::-webkit-scrollbar-thumb{background:#c8d4f0;border-radius:2px;}
  .sa-search-wrap{padding:12px 18px 10px;background:#fff;border-bottom:1px solid #e2e8f8;flex-shrink:0;}
  .sa-search-box{display:flex;align-items:center;gap:8px;background:#f0f4ff;border:1.5px solid #e2e8f8;border-radius:11px;padding:8px 12px;transition:border-color .15s;}
  .sa-search-box:focus-within{border-color:#3b82f6;background:#fff;}
  .sa-search-box input{border:none;outline:none;background:none;font-size:13px;color:#0d1a40;font-family:'Plus Jakarta Sans',sans-serif;width:100%;}
  .sa-search-box input::placeholder{color:#a0aec8;}
  .sa-clear{border:none;background:none;cursor:pointer;color:#a0aec8;display:flex;padding:0;}
  .sa-cats{display:flex;gap:7px;padding:10px 18px;overflow-x:auto;flex-shrink:0;background:#fff;border-bottom:1px solid #e2e8f8;}
  .sa-cats::-webkit-scrollbar{display:none;}
  .sa-cat-btn{flex-shrink:0;padding:5px 12px;border-radius:20px;border:1.5px solid #e2e8f8;background:#f0f4ff;font-size:12px;font-weight:500;color:#6b80b0;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:all .15s;white-space:nowrap;}
  .sa-cat-btn:hover{border-color:#3b82f6;color:#1d4ed8;}
  .sa-cat-btn.active{border-color:#1d4ed8;background:#1d4ed8;color:#fff;}
  .sa-table-section{padding:16px 18px;}
  .sai-table-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
  .sai-table-card{border-radius:14px;border:1.5px solid #e2e8f8;background:#fff;padding:16px 8px 14px;cursor:pointer;text-align:center;transition:all .18s ease;position:relative;overflow:hidden;}
  .sai-table-card:hover{border-color:#3b82f6;transform:translateY(-2px);box-shadow:0 6px 20px rgba(59,130,246,.12);}
  .sai-table-card.selected{border-color:#1d4ed8;background:#eff6ff;box-shadow:0 0 0 3px rgba(59,130,246,.15);}
  .sai-table-card.occupied::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#f87171,#ef4444);}
  .sai-table-card.free::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#4ade80,#22c55e);}
  .sai-table-num{font-size:28px;font-weight:700;color:#0d1a40;line-height:1;}
  .sai-table-card.selected .sai-table-num{color:#1d4ed8;}
  .sai-table-label{font-size:10px;color:#9aaad0;margin-top:3px;font-weight:500;text-transform:uppercase;letter-spacing:.5px;}
  .sai-table-status{font-size:10px;margin-top:7px;padding:3px 8px;border-radius:20px;display:inline-block;font-weight:600;}
  .sai-table-status.occ{background:#fee2e2;color:#dc2626;}
  .sai-table-status.free{background:#dcfce7;color:#16a34a;}
  .sai-items-list{padding:6px 10px 12px;}
  .sai-item-row{display:flex;align-items:center;gap:11px;padding:10px;border-radius:13px;margin-bottom:3px;transition:background .15s;}
  .sai-item-row:hover{background:#fff;}
  .sai-item-row.in-cart{background:#eff6ff;}
  .sai-item-emoji{width:40px;height:40px;border-radius:11px;background:#eef2ff;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;object-fit:cover;}
  .sai-item-row.in-cart .sai-item-emoji{background:#dbeafe;}
  .sai-item-info{flex:1;min-width:0;}
  .sai-item-name{font-size:13.5px;font-weight:600;color:#0d1a40;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sai-item-cat{font-size:11px;color:#9aaad0;text-transform:capitalize;margin-top:1px;}
  .sai-item-price{font-size:13px;font-weight:700;color:#1d4ed8;flex-shrink:0;}
  .sa-qty-ctrl{display:flex;align-items:center;background:#0d1a40;border-radius:9px;overflow:hidden;flex-shrink:0;}
  .sa-qty-btn{width:28px;height:28px;border:none;background:none;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .12s;}
  .sa-qty-btn:hover{background:rgba(255,255,255,.12);}
  .sa-qty-val{min-width:22px;text-align:center;font-size:12px;font-weight:700;color:#fff;}
  .sa-add-btn{width:28px;height:28px;border:none;background:#1d4ed8;border-radius:8px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;flex-shrink:0;}
  .sa-add-btn:hover{background:#1e40af;}
  .sa-note-btn{width:28px;height:28px;border:none;border-radius:8px;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#c0cce8;transition:color .15s;flex-shrink:0;}
  .sa-note-btn:hover,.sa-note-btn.has-note{color:#3b82f6;}
  .sa-note-inline{margin:0 10px 8px 62px;animation:sa-note-in .18s ease;}
  @keyframes sa-note-in{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:translateY(0)}}
  .sa-note-input{width:100%;padding:7px 11px;border-radius:9px;border:1.5px solid #dbeafe;background:#fff;font-size:12px;font-family:'Plus Jakarta Sans',sans-serif;color:#0d1a40;outline:none;resize:none;transition:border-color .15s;box-sizing:border-box;}
  .sa-note-input:focus{border-color:#3b82f6;}
  .sa-note-input::placeholder{color:#b8c8e8;}
  .sa-review-inner{padding:18px 18px 12px;}
  .sa-review-table-badge{display:inline-flex;align-items:center;gap:7px;background:#dbeafe;border-radius:10px;padding:7px 13px;margin-bottom:14px;font-size:13px;font-weight:600;color:#1d4ed8;}
  .sa-review-row{display:flex;align-items:flex-start;justify-content:space-between;padding:11px 0;border-bottom:1px solid #e8eef8;}
  .sa-review-row:last-of-type{border-bottom:none;}
  .sa-review-name{font-size:13.5px;font-weight:600;color:#0d1a40;}
  .sa-review-qty{font-size:11.5px;color:#7a8bb0;margin-top:2px;}
  .sa-review-note{font-size:11px;color:#9aaad0;margin-top:3px;}
  .sa-review-price{font-size:13.5px;font-weight:700;color:#1d4ed8;}
  .sa-review-divider{height:1px;background:#e2e8f8;margin:8px 0;}
  .sa-review-total-row{display:flex;justify-content:space-between;align-items:center;padding-top:10px;}
  .sa-review-total-label{font-size:12px;color:#7a8bb0;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
  .sa-review-total-val{font-size:22px;font-weight:700;color:#0d1a40;}
  .sa-footer{padding:10px 18px 18px;background:#f5f8ff;border-top:1px solid #e2e8f8;flex-shrink:0;}
  .sa-btn-primary{width:100%;padding:13px 18px;border-radius:13px;border:none;background:#1d4ed8;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .15s;}
  .sa-btn-primary:hover:not(:disabled){background:#1e40af;}
  .sa-btn-primary:disabled{opacity:.45;cursor:default;}
  .sa-btn-primary.success{background:#16a34a;}
  .sa-btn-ghost{padding:13px 18px;border-radius:13px;border:1.5px solid #e2e8f8;background:#fff;color:#4a5fa0;font-size:14px;font-weight:600;cursor:pointer;font-family:'Plus Jakarta Sans',sans-serif;transition:border-color .15s;}
  .sa-btn-ghost:hover{border-color:#3b82f6;}
  .sa-badge{background:#3b82f6;color:#fff;border-radius:20px;padding:2px 8px;font-size:12px;font-weight:700;}
  .sa-footer-total{margin-left:auto;font-size:15px;font-weight:700;}
  .sa-empty{text-align:center;padding:40px 24px;color:#9aaad0;font-size:13px;}
  .sa-empty-icon{font-size:32px;margin-bottom:10px;}
`;

export default function ServerAddItems({ showComp, tables=[], items=[], setShowComp, onOrderPlaced }) {
  const [step,             setStep]            = useState('table');
  const [search,           setSearch]          = useState('');
  const [selectedTable,    setSelectedTable]   = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [qty,              setQty]             = useState({});   // { itemId: number }
  const [notes,            setNotes]           = useState({});   // { itemId: string }
  const [noteId,           setNoteId]          = useState(null);
  const [submitting,       setSubmitting]      = useState(false);
  const [success,          setSuccess]         = useState(false);

  // debounced search — input is instant, filtering waits 250ms
  const debouncedSearch = useDebounce(search, 250);

  // simple derived values — no useMemo needed for small lists
  const categories = [...new Set(items.map(i => i.category))];

  const filteredItems = (() => {
    let r = items;
    if (selectedCategory !== 'all') r = r.filter(i => i.category === selectedCategory);
    if (debouncedSearch.trim())     r = r.filter(i => i.name.toLowerCase().includes(debouncedSearch.toLowerCase()));
    return r;
  })();

  const cartItems = Object.entries(qty)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => {
      const item = items.find(i => i.id === parseInt(id));
      return item ? { ...item, quantity: q, comment: notes[id] || '' } : null;
    })
    .filter(Boolean);

  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // reset on open
  useEffect(() => {
    if (showComp) {
      setStep('table'); setSearch(''); setSelectedTable(null);
      setSelectedCategory('all'); setQty({}); setNotes({});
      setNoteId(null); setSubmitting(false); setSuccess(false);
    }
  }, [showComp]);

  // safe qty change
  const changeQty = useCallback((itemId, delta) => {
    setQty(prev => {
      const next = Math.max(0, (prev[itemId] || 0) + delta);
      if (next === 0) { const { [itemId]: _, ...rest } = prev; return rest; }
      return { ...prev, [itemId]: next };
    });
  }, []);

  const handleClose = () => setShowComp(false);

  const handleSubmit = async () => {
    if (!selectedTable || cartCount === 0) return;
    setSubmitting(true);
    try {
      await onOrderPlaced?.({
        tableNumber: selectedTable.number,
        items: cartItems.map(i => ({ itemId: i.id, quantity: i.quantity, comment: i.comment })),
      });
      setSuccess(true);
      setTimeout(handleClose, 700);
    } catch {
      setSubmitting(false);
    }
  };

  const subtitle = {
    table:  'Pick a table to assign',
    items:  selectedTable ? `Table ${selectedTable.number} · ${cartCount} item${cartCount!==1?'s':''}` : '',
    review: selectedTable ? `Table ${selectedTable.number} · ${cartTotal.toFixed(2)} TND` : '',
  };

  if (!showComp) return null;

  return (
    <>
      <style>{S}</style>
      <div className="sa-shade" onClick={handleClose}>
        <div className="sa-modal" onClick={e => e.stopPropagation()}>
          <div className="sa-handle"/>

          {/* HEADER */}
          <div className="sa-header">
            <div className="sa-header-left">
              <img src="/images/coffai1.png" alt="logo" className="sa-logo"/>
              <div>
                <div className="sa-title">{STEP_TITLES[step]}</div>
                <div className="sa-subtitle">{subtitle[step]}</div>
              </div>
            </div>
            <button className="sa-close" onClick={handleClose}><X size={16}/></button>
          </div>

          {/* STEP TABS */}
          <div className="sa-steps">
            <button className={`sa-step-tab ${step==='table'?'active':'done'}`} onClick={()=>setStep('table')}>① Table</button>
            <button className={`sa-step-tab ${step==='items'?'active':step==='review'?'done':''}`} onClick={()=>selectedTable&&setStep('items')}>② Items</button>
            <button className={`sa-step-tab ${step==='review'?'active':''}`} onClick={()=>cartCount>0&&setStep('review')}>③ Review</button>
          </div>

          {/* STEP 1: TABLE */}
          {step === 'table' && (
            <div className="sa-step-body">
              <div className="sa-search-wrap">
                <div className="sa-search-box">
                  <Search size={14} color="#9aaad0"/>
                  <input placeholder="Search table number…"/>
                </div>
              </div>
              <div className="sa-scroll">
                <div className="sa-table-section">
                  <div className="sai-table-grid">
                    {tables.map(t => (
                      <div key={t.id} onClick={()=>setSelectedTable(t)}
                        className={`sai-table-card ${t.status?'occupied':'free'}${selectedTable?.id===t.id?' selected':''}`}>
                        <div className="sai-table-num">{t.number}</div>
                        <div className="sai-table-label">Table</div>
                        <div className={`sai-table-status ${t.status?'occ':'free'}`}>{t.status?'Occupied':'Free'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="sa-footer">
                <button className="sa-btn-primary" disabled={!selectedTable} onClick={()=>setStep('items')}>
                  Continue to Items <ChevronRight size={15}/>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ITEMS */}
          {step === 'items' && (
            <div className="sa-step-body">
              <div className="sa-search-wrap">
                <div className="sa-search-box">
                  <Search size={14} color="#9aaad0"/>
                  <input placeholder="Search drinks, food…" value={search} onChange={e=>setSearch(e.target.value)} autoFocus/>
                  {search && <button className="sa-clear" onClick={()=>setSearch('')}><X size={12}/></button>}
                </div>
              </div>
              <div className="sa-cats">
                <button className={`sa-cat-btn ${selectedCategory==='all'?'active':''}`} onClick={()=>setSelectedCategory('all')}>All</button>
                {categories.map(c => (
                  <button key={c} className={`sa-cat-btn ${selectedCategory===c?'active':''}`} onClick={()=>setSelectedCategory(c)}>
                    {CAT_ICON[c]||CAT_ICON.default} {c.charAt(0).toUpperCase()+c.slice(1)}
                  </button>
                ))}
              </div>
              <div className="sa-scroll">
                <div className="sai-items-list">
                  {filteredItems.length === 0 && (
                    <div className="sa-empty"><div className="sa-empty-icon">🔍</div><div>No items found</div></div>
                  )}
                  {filteredItems.map(item => {
                    const itemQty  = qty[item.id] || 0;
                    const inCart   = itemQty > 0;
                    const hasNote  = !!notes[item.id];
                    const noteOpen = noteId === item.id;
                    return (
                      <div key={item.id}>
                        <div className={`sai-item-row ${inCart?'in-cart':''}`}>
                          {item.imageUrl
                            ? <img className="sai-item-emoji" src={item.imageUrl} alt={item.name}/>
                            : <div className="sai-item-emoji">{CAT_ICON[item.category]||CAT_ICON.default}</div>
                          }
                          <div className="sai-item-info">
                            <div className="sai-item-name">{item.name}</div>
                            <div className="sai-item-cat">{item.category}</div>
                          </div>
                          <div className="sai-item-price">{item.price.toFixed(2)} TND</div>
                          {inCart && (
                            <button className={`sa-note-btn ${hasNote?'has-note':''}`} onClick={()=>setNoteId(noteOpen?null:item.id)}>
                              <StickyNote size={13}/>
                            </button>
                          )}
                          {itemQty === 0 ? (
                            <button className="sa-add-btn" onClick={()=>changeQty(item.id,1)}><Plus size={14}/></button>
                          ) : (
                            <div className="sa-qty-ctrl">
                              <button className="sa-qty-btn" onClick={()=>changeQty(item.id,-1)}><Minus size={11}/></button>
                              <span className="sa-qty-val">{itemQty}</span>
                              <button className="sa-qty-btn" onClick={()=>changeQty(item.id,1)}><Plus size={11}/></button>
                            </div>
                          )}
                        </div>
                        {noteOpen && (
                          <div className="sa-note-inline">
                            <textarea className="sa-note-input" rows={2} autoFocus placeholder="Special instructions…"
                              value={notes[item.id]||''}
                              onChange={e=>setNotes(prev=>({...prev,[item.id]:e.target.value}))}/>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="sa-footer">
                <button className="sa-btn-primary" disabled={cartCount===0} onClick={()=>setStep('review')}>
                  <ShoppingCart size={15}/>
                  Review Order
                  <span className="sa-badge">{cartCount}</span>
                  <span className="sa-footer-total">{cartTotal.toFixed(2)} TND</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW */}
          {step === 'review' && (
            <div className="sa-step-body">
              <div className="sa-scroll">
                <div className="sa-review-inner">
                  <div className="sa-review-table-badge">🪑 Table {selectedTable?.number}</div>
                  {cartItems.map(item => (
                    <div key={item.id} className="sa-review-row">
                      <div>
                        <div className="sa-review-name">{item.name}</div>
                        <div className="sa-review-qty">× {item.quantity}</div>
                        {item.comment && <div className="sa-review-note">📝 {item.comment}</div>}
                      </div>
                      <div className="sa-review-price">{(item.price*item.quantity).toFixed(2)} TND</div>
                    </div>
                  ))}
                  <div className="sa-review-divider"/>
                  <div className="sa-review-total-row">
                    <span className="sa-review-total-label">Total</span>
                    <span className="sa-review-total-val">{cartTotal.toFixed(2)} TND</span>
                  </div>
                </div>
              </div>
              <div className="sa-footer">
                <div style={{display:'flex',gap:10}}>
                  <button className="sa-btn-ghost" onClick={()=>setStep('items')}>← Back</button>
                  <button className={`sa-btn-primary ${success?'success':''}`} disabled={submitting||success} style={{flex:1}} onClick={handleSubmit}>
                    {success ? <><Check size={14}/> Order Sent!</>
                      : submitting ? 'Sending…'
                      : <><Check size={14}/> Place Order — {cartTotal.toFixed(2)} TND</>}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}