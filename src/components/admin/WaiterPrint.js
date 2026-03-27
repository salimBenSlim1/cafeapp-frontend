import { useState, useEffect, useRef } from 'react';
import { X, Printer, Calendar, TrendingUp, Package, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import cafeApi from '../../api/cafeApiInstance';

/* ─── tiny helpers ─────────────────────────────────────────── */
const fmt  = (n) => parseFloat(n).toFixed(2);
const fmtDate = (s) => new Date(s).toLocaleDateString('fr-TN', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
const isoToday = () => new Date().toISOString().slice(0, 10);
const shiftDate = (iso, days) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/* ─── category colour map ──────────────────────────────────── */
const CAT_COLORS = [
  '#1bcbe0','#a78bfa','#f59e0b','#34d399','#f472b6','#fb923c','#60a5fa',
];
const catColor = (() => {
  const map = {};
  let i = 0;
  return (cat) => { if (!map[cat]) map[cat] = CAT_COLORS[i++ % CAT_COLORS.length]; return map[cat]; };
})();

/* ═══════════════════════════════════════════════════════════════
   WaiterReportModal
   Props: waiter { id, name } | onClose()
═══════════════════════════════════════════════════════════════ */
export default function WaiterReportModal({ waiter, onClose }) {
  const [date,    setDate]    = useState(isoToday());
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const printRef = useRef(null);

  /* fetch whenever date changes */
  useEffect(() => {
    if (!waiter?.id) return;
    setLoading(true); setError(null);
    cafeApi.get(`/waiter-report/${waiter.id}?date=${date}`)
      .then(r  => { setReport(r.data); setLoading(false); })
      .catch(() => { setError('Failed to load report'); setLoading(false); });
  }, [date, waiter?.id]);

  /* thermal-style print */
  const handlePrint = () => {
    if (!report) return;
    const w = window.open('', '', 'width=340,height=700');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <style>
      @page{size:80mm auto;margin:0}
      *{margin:0;padding:0;box-sizing:border-box}
      body{width:80mm;font-family:'Courier New',monospace;font-size:12px;padding:5mm;background:#fff;color:#000}
      .c{text-align:center} .b{font-weight:bold}
      .hd{border-bottom:2px dashed #000;padding-bottom:8px;margin-bottom:10px}
      .dv{border-bottom:1px dashed #aaa;margin:6px 0}
      .row{display:flex;justify-content:space-between;margin-bottom:3px}
      .cat{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#555;margin:8px 0 4px;font-weight:bold}
      .tt{border-top:2px dashed #000;padding-top:8px;margin-top:8px}
      .ft{margin-top:12px;border-top:1px dashed #000;padding-top:8px;font-size:10px}
    </style></head><body>
    <div class="hd c">
      <div class="b" style="font-size:15px">RAPPORT SERVEUR</div>
      <div class="b" style="font-size:13px;margin:4px 0">${report.waiterName.toUpperCase()}</div>
      <div style="font-size:11px">${fmtDate(date)}</div>
    </div>

    ${Object.entries(
      report.items.reduce((acc, it) => {
        const cat = it.itemCategory || 'Autres';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(it);
        return acc;
      }, {})
    ).map(([cat, items]) => `
      <div class="cat">${cat}</div>
      ${items.map(it => `
        <div class="row">
          <div>${it.totalSold}× ${it.itemName}</div>
          <div>${fmt(it.totalRevenue)} TND</div>
        </div>
      `).join('')}
      <div class="dv"></div>
    `).join('')}

    <div class="tt">
      <div class="row b"><div>TOTAL ARTICLES</div><div>${report.summary.totalItems}</div></div>
      <div class="row b" style="font-size:14px"><div>TOTAL JOURNÉE</div><div>${fmt(report.summary.totalRevenue)} TND</div></div>
    </div>
    <div class="ft c">
      <div>Généré le ${new Date().toLocaleString('fr-TN')}</div>
      <div style="margin-top:4px">★ CoffAI ★</div>
    </div>
    <script>window.onload=function(){window.print();setTimeout(()=>window.close(),200)}</script>
    </body></html>`);
    w.document.close();
  };

  /* group items by category for display */
  const grouped = report?.items.reduce((acc, it) => {
    const cat = it.itemCategory || 'Autres';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(it);
    return acc;
  }, {}) ?? {};

  return (
    <>
      <style>{CSS}</style>
      {/* backdrop */}
      <div className="wr-shade" onClick={onClose}>
        <div className="wr-modal" onClick={e => e.stopPropagation()}>

          {/* ── MODAL HEADER ── */}
          <div className="wr-modal-hd">
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div className="wr-avatar">
                {waiter.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
              </div>
              <div>
                <h2 className="wr-modal-title">{waiter.name}</h2>
                <p className="wr-modal-sub">Daily Sales Report</p>
              </div>
            </div>
            <button className="wr-close" onClick={onClose}><X size={18}/></button>
          </div>

          {/* ── DATE NAVIGATOR ── */}
          <div className="wr-date-bar">
            <button className="wr-date-nav" onClick={() => setDate(d => shiftDate(d, -1))}>
              <ChevronLeft size={15}/>
            </button>
            <div className="wr-date-center">
              <Calendar size={13} color="#4a7099"/>
              <input
                type="date"
                className="wr-date-input"
                value={date}
                max={isoToday()}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <button
              className="wr-date-nav"
              onClick={() => setDate(d => shiftDate(d, 1))}
              disabled={date >= isoToday()}
            >
              <ChevronRight size={15}/>
            </button>
          </div>

          {/* ── CONTENT ── */}
          <div className="wr-body">
            {loading && (
              <div className="wr-state">
                <div className="wr-spinner"/>
                <p style={{ color:'#4a7099', marginTop:14, fontSize:'.85rem' }}>Loading report…</p>
              </div>
            )}

            {error && !loading && (
              <div className="wr-state">
                <p style={{ color:'#f87171', fontSize:'.85rem' }}>{error}</p>
              </div>
            )}

            {report && !loading && (
              <>
                {/* KPI strip */}
                <div className="wr-kpi-strip">
                  {[
                    { icon: Package,    label: 'Items Sold',    value: report.summary.totalItems,                 color:'#1bcbe0' },
                    { icon: DollarSign, label: 'Total Revenue',  value: `${fmt(report.summary.totalRevenue)} TND`, color:'#34d399' },
                    { icon: TrendingUp, label: 'Products',       value: report.items.length,                       color:'#a78bfa' },
                  ].map((k, i) => (
                    <div key={i} className="wr-kpi">
                      <div className="wr-kpi-icon" style={{ background: k.color+'18', border:`1px solid ${k.color}28` }}>
                        <k.icon size={14} color={k.color}/>
                      </div>
                      <div>
                        <div className="wr-kpi-val" style={{ color: k.color }}>{k.value}</div>
                        <div className="wr-kpi-label">{k.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Items table or empty */}
                {report.items.length === 0 ? (
                  <div className="wr-state" style={{ padding:'40px 0' }}>
                    <Package size={36} color="rgba(27,203,224,.15)"/>
                    <p style={{ color:'#2a4a6a', marginTop:12, fontSize:'.85rem' }}>No sales recorded on this day</p>
                  </div>
                ) : (
                  <div ref={printRef} className="wr-table-wrap">
                    <table className="wr-table">
                      <thead>
                        <tr>
                          <th className="wr-th wr-th-left">Item</th>
                          <th className="wr-th">Category</th>
                          <th className="wr-th">Qty</th>
                          <th className="wr-th wr-th-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(grouped).map(([cat, items]) => (
                          <>
                            {/* category separator row */}
                            <tr key={`cat-${cat}`} className="wr-cat-row">
                              <td colSpan={4} className="wr-cat-cell">
                                <span className="wr-cat-dot" style={{ background: catColor(cat) }}/>
                                {cat}
                              </td>
                            </tr>
                            {items.map((it, i) => {
                              const pct = report.summary.totalRevenue > 0
                                ? (it.totalRevenue / report.summary.totalRevenue * 100)
                                : 0;
                              return (
                                <tr key={i} className="wr-row">
                                  <td className="wr-td wr-td-name">
                                    <div className="wr-item-name">{it.itemName}</div>
                                    {/* mini revenue bar */}
                                    <div className="wr-bar-track">
                                      <div className="wr-bar-fill" style={{ width:`${pct}%`, background: catColor(cat) }}/>
                                    </div>
                                  </td>
                                  <td className="wr-td wr-td-center">
                                    <span className="wr-cat-badge" style={{ background: catColor(cat)+'18', color: catColor(cat), borderColor: catColor(cat)+'33' }}>
                                      {it.itemCategory || '—'}
                                    </span>
                                  </td>
                                  <td className="wr-td wr-td-center">
                                    <span className="wr-qty">{it.totalSold}</span>
                                  </td>
                                  <td className="wr-td wr-td-rev">
                                    {fmt(it.totalRevenue)} <span className="wr-tnd">TND</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="wr-total-row">
                          <td className="wr-td wr-total-label" colSpan={2}>Total</td>
                          <td className="wr-td wr-td-center wr-total-val">{report.summary.totalItems}</td>
                          <td className="wr-td wr-td-rev wr-total-val">{fmt(report.summary.totalRevenue)} <span className="wr-tnd">TND</span></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── FOOTER ── */}
          <div className="wr-footer">
            <button className="wr-btn-ghost" onClick={onClose}>Close</button>
            <button
              className="wr-btn-print"
              onClick={handlePrint}
              disabled={!report || report.items.length === 0}
            >
              <Printer size={15}/> Print Report
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

/* ─── CSS ────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.wr-shade {
  position:fixed;inset:0;background:rgba(5,12,26,.92);
  backdrop-filter:blur(14px);z-index:80;
  display:flex;align-items:center;justify-content:center;padding:16px;
  animation:wrFadeIn .2s ease-out;
}
@keyframes wrFadeIn  { from{opacity:0} to{opacity:1} }
@keyframes wrSlideIn { from{opacity:0;transform:scale(.94) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes wrSpin    { to{transform:rotate(360deg)} }

.wr-modal {
  background:#0b1a30;
  border:1px solid rgba(255,255,255,.09);
  border-radius:24px;
  width:100%;max-width:560px;
  max-height:92vh;
  display:flex;flex-direction:column;
  overflow:hidden;
  animation:wrSlideIn .3s cubic-bezier(.16,1,.3,1);
  box-shadow:0 32px 80px rgba(0,0,0,.6);
  font-family:'Plus Jakarta Sans',sans-serif;
}

/* header */
.wr-modal-hd {
  display:flex;align-items:center;justify-content:space-between;
  padding:22px 22px 18px;
  border-bottom:1px solid rgba(255,255,255,.06);
  flex-shrink:0;
}
.wr-avatar {
  width:42px;height:42px;border-radius:13px;flex-shrink:0;
  background:linear-gradient(135deg,rgba(27,203,224,.25),rgba(26,109,212,.25));
  border:1px solid rgba(27,203,224,.3);
  display:flex;align-items:center;justify-content:center;
  font-size:.82rem;font-weight:800;color:#1bcbe0;letter-spacing:.04em;
}
.wr-modal-title { font-size:1.1rem;font-weight:800;color:#e8f4ff;line-height:1; }
.wr-modal-sub   { font-size:.68rem;color:#4a7099;margin-top:3px;letter-spacing:.06em;text-transform:uppercase; }
.wr-close {
  width:32px;height:32px;border-radius:10px;flex-shrink:0;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);
  color:#4a7099;display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .2s;
}
.wr-close:hover { background:rgba(255,255,255,.1);color:#e8f4ff; }

/* date bar */
.wr-date-bar {
  display:flex;align-items:center;gap:10px;
  padding:14px 22px;border-bottom:1px solid rgba(255,255,255,.06);
  flex-shrink:0;
}
.wr-date-nav {
  width:32px;height:32px;border-radius:10px;flex-shrink:0;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  color:#4a7099;display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .2s;
}
.wr-date-nav:hover:not(:disabled) { border-color:rgba(27,203,224,.35);color:#1bcbe0; }
.wr-date-nav:disabled { opacity:.3;cursor:default; }
.wr-date-center {
  flex:1;display:flex;align-items:center;gap:8px;
  padding:8px 14px;border-radius:12px;
  background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
}
.wr-date-input {
  flex:1;border:none;background:transparent;
  color:#e8f4ff;font-family:'Plus Jakarta Sans',sans-serif;
  font-size:.85rem;font-weight:600;outline:none;cursor:pointer;
}
.wr-date-input::-webkit-calendar-picker-indicator { filter:invert(.4); cursor:pointer; }

/* scrollable body */
.wr-body { flex:1;overflow-y:auto;padding:18px 22px;scrollbar-width:thin;scrollbar-color:rgba(27,203,224,.2) transparent; }
.wr-body::-webkit-scrollbar { width:4px; }
.wr-body::-webkit-scrollbar-thumb { background:rgba(27,203,224,.2);border-radius:4px; }

/* loading / empty state */
.wr-state { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 0;text-align:center; }
.wr-spinner {
  width:36px;height:36px;border-radius:50%;
  border:2.5px solid rgba(27,203,224,.15);border-top-color:#1bcbe0;
  animation:wrSpin .7s linear infinite;
}

/* KPI strip */
.wr-kpi-strip { display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px; }
.wr-kpi {
  display:flex;align-items:center;gap:10px;
  padding:12px 14px;border-radius:14px;
  background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);
}
.wr-kpi-icon { width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.wr-kpi-val   { font-size:.95rem;font-weight:800;color:#e8f4ff;line-height:1; }
.wr-kpi-label { font-size:.6rem;color:#4a7099;margin-top:2px;font-weight:600;letter-spacing:.06em;text-transform:uppercase; }

/* table */
.wr-table-wrap {
  border-radius:16px;overflow:hidden;
  border:1px solid rgba(255,255,255,.08);
}
.wr-table { width:100%;border-collapse:collapse; }

.wr-th {
  padding:11px 14px;font-size:.63rem;font-weight:700;
  letter-spacing:.1em;text-transform:uppercase;color:#4a7099;
  background:rgba(255,255,255,.04);text-align:center;
  border-bottom:1px solid rgba(255,255,255,.07);
}
.wr-th-left  { text-align:left; }
.wr-th-right { text-align:right; }

/* category separator */
.wr-cat-row { }
.wr-cat-cell {
  padding:10px 14px 5px;
  font-size:.62rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;
  color:#4a7099;background:rgba(255,255,255,.02);
  display:flex;align-items:center;gap:7px;
}
.wr-cat-dot { width:6px;height:6px;border-radius:50%;flex-shrink:0; }

/* data rows */
.wr-row { border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s; }
.wr-row:hover { background:rgba(255,255,255,.03); }
.wr-td { padding:11px 14px;font-size:.82rem;color:#c8dff0; }
.wr-td-name   { width:40%; }
.wr-td-center { text-align:center; }
.wr-td-rev    { text-align:right;font-weight:700;color:#e8f4ff; }

.wr-item-name { font-weight:600;color:#d8eeff;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px; }
.wr-bar-track { height:3px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden; }
.wr-bar-fill  { height:100%;border-radius:999px;transition:width .4s ease; }

.wr-cat-badge {
  display:inline-block;padding:2px 8px;border-radius:999px;
  border:1px solid;font-size:.62rem;font-weight:700;
  letter-spacing:.05em;white-space:nowrap;
}
.wr-qty {
  display:inline-flex;align-items:center;justify-content:center;
  width:28px;height:28px;border-radius:8px;
  background:rgba(27,203,224,.08);border:1px solid rgba(27,203,224,.15);
  color:#1bcbe0;font-size:.82rem;font-weight:700;
}
.wr-tnd { font-size:.65rem;color:#4a7099;font-weight:500;margin-left:2px; }

/* total row */
.wr-total-row { background:rgba(27,203,224,.06);border-top:1px solid rgba(27,203,224,.15); }
.wr-total-label { font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#4a7099;padding:12px 14px; }
.wr-total-val   { font-weight:800;color:#1bcbe0;font-size:.9rem; }

/* footer */
.wr-footer {
  display:flex;gap:10px;padding:16px 22px;
  border-top:1px solid rgba(255,255,255,.06);flex-shrink:0;
}
.wr-btn-ghost {
  flex:1;padding:10px;border-radius:12px;cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;font-size:.85rem;font-weight:600;
  color:#7a9dc0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);
  transition:all .2s;
}
.wr-btn-ghost:hover { background:rgba(255,255,255,.08);color:#e8f4ff; }
.wr-btn-print {
  flex:2;padding:10px 18px;border-radius:12px;border:none;cursor:pointer;
  font-family:'Plus Jakarta Sans',sans-serif;font-size:.85rem;font-weight:700;
  color:#0d1f3c;background:linear-gradient(135deg,#1bcbe0,#1a6dd4);
  box-shadow:0 4px 18px rgba(27,203,224,.25);
  display:flex;align-items:center;justify-content:center;gap:7px;
  transition:all .2s;
}
.wr-btn-print:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 24px rgba(27,203,224,.38); }
.wr-btn-print:disabled { opacity:.4;cursor:default;transform:none; }
`;