import { useState } from 'react';
import { Users, Lock, Eye, EyeOff, LogIn, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

export default function ServerLogin() {
  const [name, setName]           = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const id = new URLSearchParams(useLocation().search).get('id');

  const handleLogin = async () => {
    if (!name || !password) { setError('Please fill in all fields'); return; }
    setIsLoading(true); setError(''); setSuccess('');
    try {
      const r = await axios.post(`${process.env.REACT_APP_API_URL}/server-login/${id}`, { name, password });
      localStorage.setItem('id', r.data.id);
      localStorage.setItem('name', r.data.name);
      localStorage.setItem('cafeId', id);
      if (r.data?.serverToken) {
        localStorage.setItem('serverToken', r.data.serverToken);
        setSuccess('Login successful! Redirecting…');
        setTimeout(() => { window.location.href = '/server-dashboard'; }, 1000);
      }
    } catch (e) { setError(e.response?.data?.message || 'Incorrect name or password'); }
    finally { setIsLoading(false); }
  };

  return (
    <>
      <style>{S}</style>
      <div className="sl-root">
        <div className="sl-g1"/><div className="sl-g2"/><div className="sl-dots"/>
        <div className="sl-card">
          <div className="sl-top">
            <div className="sl-ring"><img src="/images/coffai1.png" alt="CoffAI" style={{width:56,height:56,objectFit:'contain'}}/></div>
            <h1 className="sl-title">Server Portal</h1>
            <p className="sl-sub">Sign in to manage your tables</p>
          </div>
          {error   && <div className="sl-msg sl-err"><AlertCircle size={15}/>{error}</div>}
          {success && <div className="sl-msg sl-ok"><CheckCircle size={15}/>{success}</div>}
          <div className="sl-form">
            <div className="sl-field">
              <label className="sl-lbl">Full Name</label>
              <div className="sl-iw"><Users size={14} className="sl-ii"/>
                <input className="sl-inp" type="text" placeholder="John Doe" value={name}
                  onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()} disabled={isLoading}/>
              </div>
            </div>
            <div className="sl-field">
              <label className="sl-lbl">Password</label>
              <div className="sl-iw"><Lock size={14} className="sl-ii"/>
                <input className="sl-inp" type={showPass?'text':'password'} placeholder="••••••••" value={password}
                  onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleLogin()}
                  disabled={isLoading} style={{paddingRight:42}}/>
                <button className="sl-eye" onClick={()=>setShowPass(v=>!v)} tabIndex={-1}>
                  {showPass?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>
            <button className="sl-btn" onClick={handleLogin} disabled={isLoading}>
              {isLoading?<><Loader2 size={15} className="sl-spin"/>Signing in…</>:<><LogIn size={15}/>Sign In</>}
            </button>
          </div>
          <p className="sl-foot">Contact your manager if you forgot your credentials</p>
        </div>
        <p style={{color:'rgba(27,203,224,.2)',fontSize:'.7rem',marginTop:20,position:'relative',zIndex:1}}>© 2025 CoffAI</p>
      </div>
    </>
  );
}

const S = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
.sl-root { min-height:100svh;background:#0d1f3c;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;position:relative;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif; }
.sl-g1,.sl-g2 { position:fixed;border-radius:50%;filter:blur(120px);pointer-events:none;z-index:0; }
.sl-g1 { width:500px;height:500px;background:#1bcbe0;opacity:.07;top:-170px;right:-110px; }
.sl-g2 { width:420px;height:420px;background:#1a6dd4;opacity:.07;bottom:-120px;left:-90px; }
.sl-dots { position:fixed;inset:0;pointer-events:none;z-index:0;background-image:radial-gradient(rgba(27,203,224,.07) 1px,transparent 1px);background-size:40px 40px; }
@keyframes slup { from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);} }
.sl-card { position:relative;z-index:1;width:100%;max-width:390px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:24px;padding:34px 30px;animation:slup .5s cubic-bezier(.16,1,.3,1);backdrop-filter:blur(16px); }
.sl-top { text-align:center;margin-bottom:26px; }
.sl-ring { width:84px;height:84px;border-radius:50%;margin:0 auto 16px;background:rgba(232,184,109,.08);border:1px solid rgba(232,184,109,.22);display:flex;align-items:center;justify-content:center;box-shadow:0 0 50px rgba(27,203,224,.14); }
.sl-title { font-size:1.65rem;font-weight:800;letter-spacing:-.02em;background:linear-gradient(135deg,#e8f4ff 30%,#7ab8d8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:6px; }
.sl-sub { font-size:.78rem;color:#4a7099; }
.sl-msg { display:flex;align-items:center;gap:8px;padding:10px 13px;border-radius:11px;border:1px solid;font-size:.8rem;font-weight:500;margin-bottom:14px; }
.sl-err { background:rgba(248,113,113,.08);border-color:rgba(248,113,113,.25);color:#f87171; }
.sl-ok  { background:rgba(52,211,153,.08);border-color:rgba(52,211,153,.25);color:#34d399; }
.sl-form { display:flex;flex-direction:column;gap:14px; }
.sl-field { display:flex;flex-direction:column;gap:5px; }
.sl-lbl { font-size:.68rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#4a7099; }
.sl-iw { position:relative; }
.sl-ii { position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#2a4a6a;pointer-events:none; }
.sl-inp { width:100%;padding:11px 13px 11px 40px;border-radius:12px;outline:none;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#e8f4ff;font-family:inherit;font-size:.88rem;transition:border-color .2s,box-shadow .2s; }
.sl-inp::placeholder { color:#1e3a5a; }
.sl-inp:focus { border-color:rgba(27,203,224,.45);box-shadow:0 0 0 3px rgba(27,203,224,.08); }
.sl-inp:disabled { opacity:.5; }
.sl-eye { position:absolute;right:11px;top:50%;transform:translateY(-50%);background:none;border:none;color:#4a7099;cursor:pointer;display:flex;align-items:center;transition:color .15s; }
.sl-eye:hover { color:#e8f4ff; }
.sl-btn { margin-top:4px;width:100%;padding:13px;border-radius:13px;border:none;cursor:pointer;font-family:inherit;font-size:.9rem;font-weight:700;color:#0d1f3c;background:linear-gradient(135deg,#1bcbe0,#1a6dd4);box-shadow:0 4px 18px rgba(27,203,224,.28);display:flex;align-items:center;justify-content:center;gap:7px;transition:all .2s; }
.sl-btn:hover:not(:disabled) { transform:translateY(-1px);box-shadow:0 6px 26px rgba(27,203,224,.42); }
.sl-btn:disabled { opacity:.5;cursor:not-allowed;transform:none; }
.sl-spin { animation:spin .7s linear infinite; }
@keyframes spin { to{transform:rotate(360deg);} }
.sl-foot { font-size:.7rem;color:#2a4a6a;text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,.07); }
`;