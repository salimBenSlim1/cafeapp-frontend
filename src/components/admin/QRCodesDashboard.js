import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Download, QrCode, Table2, RefreshCw } from 'lucide-react';
import cafeApi from '../../api/cafeApiInstance';

export default function QRCodesDashboard() {
  const [tables, setTables]           = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [hoveredId, setHoveredId]     = useState(null);

  useEffect(() => {
    cafeApi.get('/getQRCodes')
      .then(r => { setTables(r.data); setIsLoading(false); })
      .catch(e => { console.error(e); setIsLoading(false); });
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const r = await cafeApi.get('/downloadQRCodesPDF', {
        headers: { Accept: 'application/pdf' },
        responseType: 'blob',
      });
      const blob = new Blob([r.data], { type: 'application/pdf' });
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'CoffAI_QRCodes.pdf';
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
    } catch (e) {
      console.error(e);
      alert('Error downloading PDF');
    } finally { setIsDownloading(false); }
  };

  if (isLoading) return (
    <>
      <style>{S}</style>
      <div className="qr-splash">
        <div className="qr-g1"/><div className="qr-g2"/>
        <div style={{textAlign:'center',position:'relative',zIndex:1}}>
          <div className="qr-spinner"/>
          <p style={{color:'#4a7099',marginTop:16,fontSize:'.9rem'}}>Loading QR Codes…</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{S}</style>
      <div className="qr-root">
        <div className="qr-g1"/><div className="qr-g2"/><div className="qr-dots"/>

        <div className="qr-inner">

          {/* ── HEADER ── */}
          <header className="qr-header">
            <button className="qr-back" onClick={()=>window.history.back()}><ArrowLeft size={15}/> Back</button>

            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div className="qr-header-icon"><QrCode size={18} color="#1bcbe0"/></div>
              <div>
                <h1 className="qr-title">QR Codes</h1>
                <p className="qr-sub">Table access codes</p>
              </div>
            </div>

            <button className="qr-dl-btn" onClick={handleDownload} disabled={tables.length===0||isDownloading}>
              {isDownloading
                ? <><Loader2 size={15} className="qr-spin"/> Downloading…</>
                : <><Download size={15}/> Download PDF</>
              }
            </button>
          </header>

          {/* ── KPI strip ── */}
          <div className="qr-strip">
            <div className="qr-strip-item">
              <span className="qr-strip-val">{tables.length}</span>
              <span className="qr-strip-lbl">Total Tables</span>
            </div>
            <div className="qr-strip-div"/>
            <div className="qr-strip-item">
              <span className="qr-strip-val" style={{color:'#34d399'}}>{tables.filter(t=>t.assignedTo).length}</span>
              <span className="qr-strip-lbl">Assigned</span>
            </div>
            <div className="qr-strip-div"/>
            <div className="qr-strip-item">
              <span className="qr-strip-val" style={{color:'#a78bfa'}}>{tables.filter(t=>!t.assignedTo).length}</span>
              <span className="qr-strip-lbl">Free</span>
            </div>
          </div>

          {/* ── GRID ── */}
          {tables.length === 0 ? (
            <div className="qr-empty">
              <QrCode size={48} color="rgba(27,203,224,.15)"/>
              <p style={{color:'#2a4a6a',marginTop:16}}>No tables found</p>
            </div>
          ) : (
            <div className="qr-grid">
              {tables.map((t, i) => (
                <div key={t.id} className={`qr-card ${hoveredId===t.id?'qr-card-hov':''}`}
                  style={{animationDelay:`${i*.04}s`}}
                  onMouseEnter={()=>setHoveredId(t.id)} onMouseLeave={()=>setHoveredId(null)}>

                  {/* QR image area */}
                  <div className="qr-img-wrap">
                    <div className="qr-img-bg"/>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(t.qrCodeURL)}&size=280x280&bgcolor=0d1f3c&color=1bcbe0&qzone=2`}
                      alt={`QR Table ${t.number}`}
                      className="qr-img"
                    />
                    {/* Scan overlay hint */}
                    <div className="qr-scan-hint">
                      <span>Scan to open</span>
                    </div>
                  </div>

                  {/* Card info */}
                  <div className="qr-card-body">
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                      <span className="qr-tbl-num">Table {t.number}</span>
                      {t.assignedTo
                        ? <span className="qr-badge qr-badge-assigned">Assigned</span>
                        : <span className="qr-badge qr-badge-free">Free</span>
                      }
                    </div>
                    <p className="qr-url">{t.qrCodeURL}</p>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>{/* /inner */}
      </div>
    </>
  );
}

const S = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }

.qr-root,.qr-splash { min-height:100vh; background:#0d1f3c; color:#e8f4ff; position:relative; overflow-x:hidden; font-family:'Plus Jakarta Sans',sans-serif; }

/* Splash */
.qr-splash { display:flex;align-items:center;justify-content:center; }
.qr-spinner { width:38px;height:38px;border-radius:50%;border:2.5px solid rgba(27,203,224,.15);border-top-color:#1bcbe0;animation:qrspin .7s linear infinite;margin:0 auto; }
@keyframes qrspin { to{transform:rotate(360deg);} }

/* Ambient */
.qr-g1,.qr-g2 { position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0; }
.qr-g1 { width:600px;height:600px;background:#1bcbe0;opacity:.05;top:-200px;right:-140px; }
.qr-g2 { width:500px;height:500px;background:#1a6dd4;opacity:.05;bottom:-150px;left:-110px; }
.qr-dots { position:fixed;inset:0;pointer-events:none;z-index:0;background-image:radial-gradient(rgba(27,203,224,.07) 1px,transparent 1px);background-size:40px 40px; }

/* Inner */
.qr-inner { position:relative;z-index:1;max-width:1060px;margin:0 auto;padding:0 20px 80px; }

/* Header */
.qr-header { display:flex;align-items:center;justify-content:space-between;padding:24px 0 26px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:28px;gap:12px;flex-wrap:wrap; }
.qr-back { display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:#4a7099;font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;flex-shrink:0; }
.qr-back:hover { border-color:rgba(27,203,224,.35);color:#1bcbe0; }
.qr-header-icon { width:40px;height:40px;border-radius:12px;background:rgba(27,203,224,.1);border:1px solid rgba(27,203,224,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.qr-title { font-size:1.35rem;font-weight:800;letter-spacing:-.02em;background:linear-gradient(135deg,#e8f4ff 30%,#7ab8d8);-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
.qr-sub { font-size:.7rem;color:#4a7099;margin-top:3px;letter-spacing:.05em;text-transform:uppercase; }

.qr-dl-btn { display:flex;align-items:center;gap:7px;padding:9px 18px;border-radius:12px;border:none;cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:700;color:#0d1f3c;background:linear-gradient(135deg,#1bcbe0,#1a6dd4);box-shadow:0 4px 18px rgba(27,203,224,.28);transition:all .2s;flex-shrink:0; }
.qr-dl-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 24px rgba(27,203,224,.4); }
.qr-dl-btn:disabled { opacity:.5;cursor:not-allowed; }
.qr-spin { animation:qrspin .7s linear infinite; }

/* KPI strip */
.qr-strip { display:flex;align-items:center;gap:0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:14px 24px;margin-bottom:28px; }
.qr-strip-item { display:flex;flex-direction:column;align-items:center;gap:3px;flex:1; }
.qr-strip-val { font-size:1.6rem;font-weight:800;color:#e8f4ff;letter-spacing:-.02em; }
.qr-strip-lbl { font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#4a7099; }
.qr-strip-div { width:1px;height:36px;background:rgba(255,255,255,.08);flex-shrink:0; }

/* Empty */
.qr-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px 0;text-align:center; }

/* Grid */
@keyframes qrfadein { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }

.qr-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px; }
@media(max-width:500px){.qr-grid{grid-template-columns:repeat(2,1fr);gap:12px;}}

.qr-card { background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;overflow:hidden;transition:border-color .3s,transform .3s,box-shadow .3s;animation:qrfadein .5s ease-out both; }
.qr-card-hov { border-color:rgba(27,203,224,.3);transform:translateY(-5px);box-shadow:0 16px 40px rgba(0,0,0,.35); }

/* QR image area */
.qr-img-wrap { position:relative;background:#091828;display:flex;align-items:center;justify-content:center;padding:20px;overflow:hidden; }
.qr-img-bg {
  position:absolute;inset:0;
  background: radial-gradient(ellipse at center, rgba(27,203,224,.06) 0%, transparent 70%);
}
.qr-img { width:180px;height:180px;object-fit:contain;position:relative;z-index:1;border-radius:12px;
  filter: drop-shadow(0 0 16px rgba(27,203,224,.25));
  transition:transform .35s cubic-bezier(.16,1,.3,1),filter .35s;
}
.qr-card-hov .qr-img { transform:scale(1.06); filter:drop-shadow(0 0 24px rgba(27,203,224,.5)); }

.qr-scan-hint {
  position:absolute;bottom:0;left:0;right:0;padding:8px;
  background:linear-gradient(to top,rgba(9,24,40,.95),transparent);
  display:flex;align-items:flex-end;justify-content:center;
  opacity:0;transition:opacity .25s;
}
.qr-card-hov .qr-scan-hint { opacity:1; }
.qr-scan-hint span { font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(27,203,224,.8); }

/* Card body */
.qr-card-body { padding:13px 14px 15px;border-top:1px solid rgba(255,255,255,.06); }
.qr-tbl-num { font-size:.95rem;font-weight:800;color:#e8f4ff;letter-spacing:-.01em; }
.qr-badge { font-size:.58rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:999px;border:1px solid; }
.qr-badge-assigned { background:rgba(52,211,153,.1);color:#34d399;border-color:rgba(52,211,153,.25); }
.qr-badge-free { background:rgba(167,139,250,.1);color:#a78bfa;border-color:rgba(167,139,250,.25); }
.qr-url { font-size:.65rem;color:#2a4a6a;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:400; }
`;