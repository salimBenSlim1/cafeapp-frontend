import { useState, useEffect } from 'react';
import {
  Users, Search, Printer, Trash2, X, Check, Table2, ChevronDown, ChevronUp, ArrowLeft, UserPlus, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import cafeApi from '../../api/cafeApiInstance';
import WaiterReportModal from './WaiterPrint';
import axios from 'axios'
const SHIFT = {
  morning:   { label: 'Morning',   color: '#f59e0b', bg: 'rgba(245,158,11,.12)',  border: 'rgba(245,158,11,.28)'  },
  afternoon: { label: 'Afternoon', color: '#a78bfa', bg: 'rgba(167,139,250,.12)', border: 'rgba(167,139,250,.28)' },
  night:     { label: 'Night',     color: '#1bcbe0', bg: 'rgba(27,203,224,.12)',  border: 'rgba(27,203,224,.28)'  },
};
const getShift = (begin) => { const h = parseInt(begin); return h < 12 ? 'morning' : h < 20 ? 'afternoon' : 'night'; };
const initials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);

export default function ManageWaiters() {
  const [waiters, setWaiters]                 = useState([]);
  const [searchTerm, setSearchTerm]           = useState('');
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [reportWaiter, setReportWaiter]       = useState(null);
  const [selectedWaiter, setSelectedWaiter]   = useState(null);
  const [expandedWaiter, setExpandedWaiter]   = useState(null);
  const [isLoading, setIsLoading]             = useState(true);
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [newWaiter, setNewWaiter] = useState({
    name: '', password: '', begin: '', end: '', role: ''
  });
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTables, setSelectedTables]   = useState([]);
  const[id,setId]=useState(null)
  const navigate = useNavigate();
  const gettake=()=>{
    cafeApi.get('/getId')
    .then(r=>setId(r.data))
    .catch(e=>console.log(e))
  }
  useEffect(() => {
   
    const load = async () => {
    
      setIsLoading(true);
      try {
        const [wr, tr] = await Promise.all([
          cafeApi.get('/get-servers'),
          cafeApi.get('/getQRCodes'),
         
        ]);
        setWaiters(wr.data.data);
        setAvailableTables(tr.data);
        
        
      } catch(e) {
        if (e.response?.status === 401) navigate(e.response.data.redirectedTo);
      }
      setIsLoading(false);
    };
    load();
  }, []);

  const handleAddWaiter = async () => {
    if (!newWaiter.name || !newWaiter.password || !newWaiter.begin || !newWaiter.end || !newWaiter.role)
      return alert('Please fill all fields');
    try {
      const r = await cafeApi.post('/add-server', newWaiter);
      const created = r.data.data ?? r.data.server ?? r.data ?? { id: Date.now(), ...newWaiter };
      setWaiters(prev => [...prev, created]);
      setShowAddModal(false);
      setNewWaiter({ name:'', password:'', begin:'', end:'', role:'' });
    } catch { alert('Error adding server'); }
  };

  const handleDelete = async () => {
    try {
      await cafeApi.delete('/delete-servers/' + deleteTarget.id);
      setWaiters(prev => prev.filter(w => w.id !== deleteTarget.id));
      setAvailableTables(prev => prev.map(t => t.assignedTo === deleteTarget.id ? { ...t, assignedTo: null } : t));
      if (expandedWaiter === deleteTarget.id) setExpandedWaiter(null);
    } catch { alert('Error deleting'); }
    setDeleteTarget(null);
  };

  const handleUnassign = async (waiterId, tableNumber) => {
    try {
      await cafeApi.put('/clear-tables/' + waiterId, { number: tableNumber });
      setAvailableTables(prev => prev.map(t => t.number === tableNumber ? { ...t, assignedTo: null } : t));
    } catch { alert('Error unassigning table'); }
  };

  const openAssign = (waiter) => {
    setSelectedWaiter(waiter);
    setSelectedTables(availableTables.filter(t => t.assignedTo === waiter.id).map(t => t.id));
    setShowAssignModal(true);
  };

  const toggleTable = async (tableNumber) => {
    const table = availableTables.find(t => t.number === tableNumber);
    const isSel = selectedTables.includes(table.id);
    try {
      await cafeApi.put('/assign-tables/' + tableNumber, { id: selectedWaiter.id });
      if (isSel) {
        setSelectedTables(prev => prev.filter(id => id !== table.id));
        setAvailableTables(prev => prev.map(t => t.number === tableNumber ? { ...t, assignedTo: null } : t));
      } else {
        setSelectedTables(prev => [...prev, table.id]);
        setAvailableTables(prev => prev.map(t => t.number === tableNumber ? { ...t, assignedTo: selectedWaiter.id } : t));
      }
    } catch { alert('Error toggling table'); }
  };

  const filtered = waiters.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return (
    <>
      <style>{S}</style>
      <div className="mw-splash">
        <div className="mw-g1"/><div className="mw-g2"/>
        <div style={{textAlign:'center',position:'relative',zIndex:1}}>
          <div className="mw-spinner"/>
          <p style={{color:'#4a7099',marginTop:16,fontSize:'.9rem'}}>Loading servers…</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{S}</style>
      <div className="mw-root">
        <div className="mw-g1"/><div className="mw-g2"/><div className="mw-dots"/>

        <div className="mw-inner">

          {/* ── HEADER ── */}
          <header className="mw-header">
            <button className="mw-back" onClick={() => window.history.back()}><ArrowLeft size={15}/> Back</button>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div className="mw-header-icon"><Users size={18} color="#1bcbe0"/></div>
              <div>
                <h1 className="mw-title">Server Management</h1>
                <p className="mw-sub">Manage your team & table assignments</p>
              </div>
            </div>
            <button className="mw-add-btn" onClick={() => setShowAddModal(true)}>
              <UserPlus size={15}/> Add Waiter
            </button>
          </header>

          {/* ── KPI ROW ── */}
          <div className="mw-kpi-row">
            {[
              { label:'Total Servers',    value: waiters.length,                                  color:'#1bcbe0' },
              { label:'Assigned Tables',  value: availableTables.filter(t=>t.assignedTo).length,  color:'#34d399' },
              { label:'Available Tables', value: availableTables.filter(t=>!t.assignedTo).length, color:'#a78bfa' },
            ].map((k,i) => (
              <div key={i} className="mw-kpi" style={{animationDelay:`${i*.07}s`}}>
                <span className="mw-kpi-label">{k.label}</span>
                <span className="mw-kpi-val" style={{color:k.color}}>{k.value}</span>
                <div className="mw-kpi-bar" style={{background:`linear-gradient(90deg,${k.color},${k.color}44)`}}/>
              </div>
            ))}
          </div>

          {/* ── SEARCH ── */}
          <div className="mw-search-wrap">
            <Search size={14} className="mw-search-icon"/>
            <input className="mw-search" type="text" placeholder="Search servers…" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
            {searchTerm && <button className="mw-search-x" onClick={()=>setSearchTerm('')}><X size={13}/></button>}
          </div>

          {/* ── SERVER LIST ── */}
          <div className="mw-list">
            {filtered.length === 0 ? (
              <div className="mw-empty"><Users size={40} color="rgba(27,203,224,.15)"/><p style={{color:'#2a4a6a',marginTop:14}}>No servers found</p></div>
            ) : filtered.map((waiter, idx) => {
              const shift  = SHIFT[getShift(waiter.begin)];
              const tables = availableTables.filter(t => t.assignedTo === waiter.id);
              const isExp  = expandedWaiter === waiter.id;
              return (
                <div key={waiter.id} className="mw-card" style={{animationDelay:`${idx*.06}s`}}>
                  <div className="mw-card-main">
                    <div className="mw-avatar" style={{background:`linear-gradient(135deg,${shift.color}44,${shift.color}22)`,border:`1px solid ${shift.color}44`,color:shift.color}}>
                      {initials(waiter.name)}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:5,flexWrap:'wrap'}}>
                        <span className="mw-name">{waiter.name}</span>
                        <span className="mw-shift-tag" style={{background:shift.bg,borderColor:shift.border,color:shift.color}}>
                          <Clock size={10}/> {waiter.begin}h – {waiter.end}h
                        </span>
                      </div>
                      <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
                        <span className="mw-meta">🔐 {waiter.password}</span>
                        <span className="mw-meta">👤 {waiter.role || 'Waiter'}</span>
                        <span className="mw-meta" style={{color:'#1bcbe0'}}>
                          <Table2 size={11}/> {tables.length} table{tables.length!==1?'s':''}
                        </span>
                      </div>
                    </div>
                    <div className="mw-actions">
                      <button className="mw-act-btn mw-act-print"  onClick={() => setReportWaiter(waiter)} title="View report"><Printer size={15}/></button>
                      <button className="mw-act-btn mw-act-assign" onClick={() => openAssign(waiter)} title="Assign tables"><Table2 size={15}/></button>
                      <button className="mw-act-btn mw-act-expand" onClick={() => setExpandedWaiter(isExp ? null : waiter.id)}>
                        {isExp ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                      </button>
                      {/* ✅ Fixed: passes full waiter object to setDeleteTarget */}
                      <button className="mw-act-btn mw-act-del" onClick={() => setDeleteTarget(waiter)} title="Delete"><Trash2 size={15}/></button>
                    </div>
                  </div>

                  {isExp && (
                    <div className="mw-expanded">
                      <p className="mw-expanded-label">Assigned Tables</p>
                      <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>
                        {tables.length > 0 ? tables.map(t => (
                          <div key={t.id} className="mw-table-tag">
                            Table {t.number}
                            <button className="mw-table-unassign" onClick={() => handleUnassign(waiter.id, t.number)}><X size={11}/></button>
                          </div>
                        )) : <span style={{color:'#2a4a6a',fontSize:'.82rem'}}>No tables assigned</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── SERVER LINK ── */}
          <div className="mw-link-section">
            <p className="mw-link-label">Server login link</p>
            {
              id?
            <p className="mw-link-url" onClick={() => navigate('/server-login?id=' + id)}>
              https://coffai.tn/server-login?id={id}
            </p>:<h1 className='underline text-[12px] cursor-pointer' onClick={()=>gettake()}>click here</h1>
            }
          </div>

        </div>

        {/* ══ ADD MODAL ══ */}
        {showAddModal && (
          <div className="mw-shade" onClick={() => setShowAddModal(false)}>
            <div className="mw-modal" onClick={e => e.stopPropagation()}>
              <div className="mw-modal-hd">
                <h2 className="mw-modal-title">Add Waiter</h2>
                <button className="mw-modal-close" onClick={() => setShowAddModal(false)}><X size={18}/></button>
              </div>
              <div className="mw-form">
                {[
                  { label:'Full Name', key:'name',     type:'text', placeholder:'John Smith'     },
                  { label:'Password',  key:'password', type:'text', placeholder:'Enter password' },
                ].map(f => (
                  <div key={f.key} className="mw-field">
                    <label className="mw-field-label">{f.label} <span style={{color:'#f87171'}}>*</span></label>
                    <input className="mw-input" type={f.type} placeholder={f.placeholder}
                      value={newWaiter[f.key]} onChange={e => setNewWaiter({...newWaiter, [f.key]: e.target.value})}/>
                  </div>
                ))}

                {/* ✅ Fixed role selector */}
                <div className="mw-field">
                  <label className="mw-field-label">Role <span style={{color:'#f87171'}}>*</span></label>
                  <div style={{display:'flex', gap:10}}>
                    {[
                      { value:'waiter', label:'Waiter' },
                      { value:'barman', label:'Barman' },
                    ].map(({value, label}) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setNewWaiter({...newWaiter, role: value})}
                        className={`mw-role-btn ${newWaiter.role === value ? 'mw-role-active-' + value : ''}`}
                      >
                        <span className="mw-role-dot"/>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mw-field">
                  <label className="mw-field-label">Schedule <span style={{color:'#f87171'}}>*</span></label>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input className="mw-input" type="number" min={0} max={23} placeholder="Start (0–23)"
                      value={newWaiter.begin} onChange={e => setNewWaiter({...newWaiter, begin: e.target.value})} style={{flex:1}}/>
                    <span style={{color:'#4a7099',fontWeight:600}}>–</span>
                    <input className="mw-input" type="number" min={0} max={23} placeholder="End (0–23)"
                      value={newWaiter.end} onChange={e => setNewWaiter({...newWaiter, end: e.target.value})} style={{flex:1}}/>
                  </div>
                  <p style={{color:'#2a4a6a',fontSize:'.7rem',marginTop:4}}>Example: 8 → 16 for 8 am to 4 pm</p>
                </div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:20}}>
                <button className="mw-btn-ghost" style={{flex:1}} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="mw-btn-primary" style={{flex:2}} onClick={handleAddWaiter}>Add Server</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ ASSIGN TABLES MODAL ══ */}
        {showAssignModal && selectedWaiter && (
          <div className="mw-shade" onClick={() => setShowAssignModal(false)}>
            <div className="mw-modal mw-modal-wide" onClick={e => e.stopPropagation()}>
              <div className="mw-modal-hd">
                <div>
                  <h2 className="mw-modal-title">Assign Tables</h2>
                  <p style={{color:'#4a7099',fontSize:'.8rem',marginTop:3}}>{selectedWaiter.name} · {selectedTables.length} selected</p>
                </div>
                <button className="mw-modal-close" onClick={() => setShowAssignModal(false)}><X size={18}/></button>
              </div>
              <div className="mw-tables-grid">
                {availableTables.map(table => {
                  const isSel   = selectedTables.includes(table.id);
                  const isOther = table.assignedTo && table.assignedTo !== selectedWaiter.id;
                  return (
                    <button key={table.id} className={`mw-table-btn ${isSel?'mw-table-sel':''} ${isOther?'mw-table-other':''}`}
                      onClick={() => !isOther && toggleTable(table.number)} disabled={isOther}>
                      <Table2 size={16} color={isSel?'#1bcbe0':isOther?'#1a3a5a':'#4a7099'}/>
                      <span className="mw-table-num" style={{color:isSel?'#e8f4ff':isOther?'#1a3a5a':'#7a9dc0'}}>{table.number}</span>
                      {isSel   && <Check size={12} color="#1bcbe0"/>}
                      {isOther && <span style={{fontSize:'.55rem',color:'#1a3a5a',letterSpacing:'.05em'}}>TAKEN</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{display:'flex',gap:10,marginTop:20}}>
                <button className="mw-btn-ghost" style={{flex:1}} onClick={() => setShowAssignModal(false)}>Close</button>
                <button className="mw-btn-primary" style={{flex:2}} onClick={() => setShowAssignModal(false)}>Save Assignment</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ DELETE CONFIRM MODAL ══ */}
        {deleteTarget && (
          <div className="mw-shade" onClick={() => setDeleteTarget(null)}>
            <div className="mw-modal" style={{maxWidth:360}} onClick={e => e.stopPropagation()}>
              <div style={{width:52,height:52,borderRadius:14,background:'rgba(248,113,113,.1)',border:'1px solid rgba(248,113,113,.2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}>
                <Trash2 size={22} color="#f87171"/>
              </div>
              <h2 style={{textAlign:'center',fontSize:'1.05rem',fontWeight:800,color:'#e8f4ff',marginBottom:8}}>Delete server?</h2>
              <p style={{textAlign:'center',fontSize:'.82rem',color:'#4a7099',lineHeight:1.6,marginBottom:24}}>
                This will permanently remove <strong style={{color:'#e8f4ff'}}>{deleteTarget.name}</strong> and unassign all their tables. This cannot be undone.
              </p>
              <div style={{display:'flex',gap:10}}>
                <button className="mw-btn-ghost" style={{flex:1}} onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="mw-btn-danger" style={{flex:2}} onClick={handleDelete}>Yes, delete</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {reportWaiter && (
        <WaiterReportModal waiter={reportWaiter} onClose={() => setReportWaiter(null)}/>
      )}
    </>
  );
}

const S = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Plus Jakarta Sans',sans-serif; }

.mw-root { min-height:100vh; background:#0d1f3c; color:#e8f4ff; position:relative; overflow-x:hidden; font-family:'Plus Jakarta Sans',sans-serif; }
.mw-splash { min-height:100vh; background:#0d1f3c; display:flex; align-items:center; justify-content:center; position:relative; }

.mw-g1,.mw-g2 { position:fixed; border-radius:50%; filter:blur(120px); pointer-events:none; z-index:0; }
.mw-g1 { width:600px;height:600px;background:#1bcbe0;opacity:.05;top:-200px;right:-140px; }
.mw-g2 { width:500px;height:500px;background:#1a6dd4;opacity:.05;bottom:-150px;left:-110px; }
.mw-dots { position:fixed;inset:0;pointer-events:none;z-index:0;background-image:radial-gradient(rgba(27,203,224,.07) 1px,transparent 1px);background-size:40px 40px; }

.mw-spinner { width:40px;height:40px;border-radius:50%;border:2.5px solid rgba(27,203,224,.15);border-top-color:#1bcbe0;animation:mwspin .7s linear infinite;margin:0 auto; }
@keyframes mwspin { to{transform:rotate(360deg);} }

.mw-inner { position:relative;z-index:1;max-width:960px;margin:0 auto;padding:0 20px 80px; }

.mw-header { display:flex;align-items:center;justify-content:space-between;padding:24px 0 26px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:28px;gap:12px;flex-wrap:wrap; }
.mw-back { display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#4a7099;font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;flex-shrink:0; }
.mw-back:hover { border-color:rgba(27,203,224,.35);color:#1bcbe0; }
.mw-header-icon { width:40px;height:40px;border-radius:12px;background:rgba(27,203,224,.1);border:1px solid rgba(27,203,224,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.mw-title { font-size:1.35rem;font-weight:800;letter-spacing:-.02em;background:linear-gradient(135deg,#e8f4ff 30%,#7ab8d8);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
.mw-sub { font-size:.7rem;color:#4a7099;margin-top:3px;letter-spacing:.05em;text-transform:uppercase; }
.mw-add-btn { display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:12px;border:none;cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:700;color:#0d1f3c;background:linear-gradient(135deg,#1bcbe0,#1a6dd4);box-shadow:0 4px 18px rgba(27,203,224,.28);transition:all .2s;flex-shrink:0; }
.mw-add-btn:hover { transform:translateY(-1px);box-shadow:0 6px 24px rgba(27,203,224,.4); }

@keyframes mwfadein { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
.mw-kpi-row { display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px; }
@media(max-width:600px){.mw-kpi-row{grid-template-columns:1fr;}}
.mw-kpi { position:relative;overflow:hidden;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px 18px 22px;transition:border-color .3s;animation:mwfadein .5s ease-out both; }
.mw-kpi:hover { border-color:rgba(27,203,224,.2); }
.mw-kpi-label { font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#4a7099;display:block;margin-bottom:10px; }
.mw-kpi-val { font-size:2rem;font-weight:800;letter-spacing:-.03em; }
.mw-kpi-bar { position:absolute;bottom:0;left:0;right:0;height:2px;opacity:.5; }

.mw-search-wrap { position:relative;margin-bottom:20px; }
.mw-search-icon { position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#2a4a6a;pointer-events:none; }
.mw-search { width:100%;padding:12px 42px;border-radius:14px;outline:none;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);color:#e8f4ff;font-family:inherit;font-size:.88rem;transition:border-color .2s; }
.mw-search::placeholder { color:#1e3a5a; }
.mw-search:focus { border-color:rgba(27,203,224,.35);box-shadow:0 0 0 3px rgba(27,203,224,.07); }
.mw-search-x { position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,.06);border:none;color:#4a7099;width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;cursor:pointer; }

.mw-list { display:flex;flex-direction:column;gap:12px; }
.mw-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 0;text-align:center; }
.mw-card { background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;transition:border-color .3s,transform .3s;animation:mwfadein .5s ease-out both; }
.mw-card:hover { border-color:rgba(27,203,224,.18);transform:translateY(-2px); }
.mw-card-main { display:flex;align-items:center;gap:14px;padding:18px 20px;flex-wrap:wrap; }
.mw-avatar { width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:.88rem;font-weight:800;letter-spacing:.02em;flex-shrink:0; }
.mw-name { font-size:.95rem;font-weight:700;color:#e8f4ff; }
.mw-shift-tag { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;border:1px solid;font-size:.65rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase; }
.mw-meta { display:inline-flex;align-items:center;gap:4px;font-size:.75rem;color:#4a7099; }
.mw-actions { display:flex;gap:6px;align-items:center;margin-left:auto; }
.mw-act-btn { width:34px;height:34px;border-radius:10px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s; }
.mw-act-print  { background:rgba(52,211,153,.1);  color:#34d399; } .mw-act-print:hover  { background:rgba(52,211,153,.2); }
.mw-act-assign { background:rgba(27,203,224,.1);  color:#1bcbe0; } .mw-act-assign:hover { background:rgba(27,203,224,.2); }
.mw-act-expand { background:rgba(255,255,255,.06);color:#7a9dc0; } .mw-act-expand:hover { background:rgba(255,255,255,.1);color:#e8f4ff; }
.mw-act-del    { background:rgba(248,113,113,.1); color:#f87171; } .mw-act-del:hover    { background:rgba(248,113,113,.2); }

.mw-expanded { padding:16px 20px 18px;border-top:1px solid rgba(255,255,255,.06); }
.mw-expanded-label { font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#4a7099; }
.mw-table-tag { display:inline-flex;align-items:center;gap:7px;padding:5px 12px;border-radius:10px;background:rgba(27,203,224,.08);border:1px solid rgba(27,203,224,.2);color:#1bcbe0;font-size:.78rem;font-weight:600; }
.mw-table-unassign { background:none;border:none;cursor:pointer;color:#f87171;display:flex;align-items:center;transition:opacity .15s; }
.mw-table-unassign:hover { opacity:.7; }

.mw-link-section { margin-top:28px;padding:18px 20px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:16px; }
.mw-link-label { font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#4a7099;margin-bottom:8px; }
.mw-link-url { font-size:.85rem;color:#1bcbe0;cursor:pointer;word-break:break-all;font-weight:500;transition:color .2s; }
.mw-link-url:hover { color:#e8f4ff;text-decoration:underline; }

.mw-shade { position:fixed;inset:0;background:rgba(5,12,26,.88);backdrop-filter:blur(12px);z-index:60;display:flex;align-items:center;justify-content:center;padding:20px;animation:mwfadein .2s ease-out; }
@keyframes mwmodalin { from{opacity:0;transform:scale(.93) translateY(10px);} to{opacity:1;transform:scale(1) translateY(0);} }
.mw-modal { background:#0f2035;border:1px solid rgba(255,255,255,.09);border-radius:22px;padding:26px 22px;max-width:420px;width:100%;max-height:90vh;overflow-y:auto;animation:mwmodalin .3s cubic-bezier(.16,1,.3,1); }
.mw-modal-wide { max-width:640px; }
.mw-modal-hd { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px; }
.mw-modal-title { font-size:1.2rem;font-weight:800;color:#e8f4ff; }
.mw-modal-close { width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#4a7099;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;flex-shrink:0; }
.mw-modal-close:hover { background:rgba(255,255,255,.1);color:#e8f4ff; }

.mw-form { display:flex;flex-direction:column;gap:16px; }
.mw-field { display:flex;flex-direction:column;gap:6px; }
.mw-field-label { font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#4a7099; }
.mw-input { padding:11px 14px;border-radius:12px;outline:none;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);color:#e8f4ff;font-family:inherit;font-size:.88rem;transition:border-color .2s; }
.mw-input::placeholder { color:#1e3a5a; }
.mw-input:focus { border-color:rgba(27,203,224,.4);box-shadow:0 0 0 3px rgba(27,203,224,.07); }

/* ── Role toggle buttons ── */
.mw-role-btn { flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:11px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:600;color:#4a7099;transition:all .2s; }
.mw-role-btn:hover { border-color:rgba(255,255,255,.18);color:#7a9dc0;background:rgba(255,255,255,.07); }
.mw-role-active-waiter { background:rgba(52,211,153,.1) !important;border-color:rgba(52,211,153,.35) !important;color:#34d399 !important; }
.mw-role-active-barman { background:rgba(167,139,250,.1) !important;border-color:rgba(167,139,250,.35) !important;color:#a78bfa !important; }
.mw-role-dot { width:7px;height:7px;border-radius:50%;background:currentColor;flex-shrink:0; }

.mw-tables-grid { display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:4px; }
@media(max-width:500px){.mw-tables-grid{grid-template-columns:repeat(4,1fr);}}
.mw-table-btn { display:flex;flex-direction:column;align-items:center;gap:5px;padding:12px 8px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);cursor:pointer;transition:all .2s; }
.mw-table-btn:hover:not(:disabled) { border-color:rgba(27,203,224,.3);background:rgba(27,203,224,.06); }
.mw-table-btn:disabled { cursor:not-allowed;opacity:.5; }
.mw-table-sel { background:rgba(27,203,224,.1) !important;border-color:rgba(27,203,224,.4) !important; }
.mw-table-other { opacity:.35; }
.mw-table-num { font-size:.78rem;font-weight:700; }

.mw-btn-primary { padding:11px 18px;border-radius:12px;border:none;cursor:pointer;font-family:inherit;font-size:.88rem;font-weight:700;color:#0d1f3c;background:linear-gradient(135deg,#1bcbe0,#1a6dd4);box-shadow:0 4px 18px rgba(27,203,224,.25);transition:all .2s; }
.mw-btn-primary:hover { transform:translateY(-1px);box-shadow:0 6px 24px rgba(27,203,224,.38); }
.mw-btn-ghost { padding:11px 16px;border-radius:12px;cursor:pointer;font-family:inherit;font-size:.88rem;font-weight:600;color:#7a9dc0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);transition:all .2s; }
.mw-btn-ghost:hover { background:rgba(255,255,255,.08);color:#e8f4ff; }
.mw-btn-danger { padding:11px 18px;border-radius:12px;border:none;cursor:pointer;font-family:inherit;font-size:.88rem;font-weight:700;color:#fff;background:linear-gradient(135deg,#f87171,#dc2626);box-shadow:0 4px 16px rgba(248,113,113,.25);transition:all .2s; }
.mw-btn-danger:hover { transform:translateY(-1px);box-shadow:0 6px 22px rgba(248,113,113,.38); }
`;