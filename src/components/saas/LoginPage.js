import { useState } from 'react';
import { Coffee, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { setAccessToken } from '../../api/cafeApiInstance';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [loginError, setLoginError]     = useState('');
  const [errors, setErrors]             = useState({});
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });



  /* ── Handlers ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (loginError) setLoginError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Minimum 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true); setLoginError('');
    try {
      const headers  = { 'Content-Type': 'application/json' };
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/login`, formData, { headers,
  withCredentials: true
       },);
       
       localStorage.setItem('cafeId',response?.data?.data?.cafe?.id)
      setAccessToken(response.data.data.accessToken);
      setIsLoading(false); setLoginSuccess(true);
      setTimeout(() => navigate('/admin'), 2000);
    } catch (err) {
      setIsLoading(false);
      if (err.response) {
        if      (err.response.status === 403) { setLoginError('Your subscription has expired. Redirecting…'); setTimeout(() => { window.location.href = err.response.data.redirectTo || 'https://coffai.tn/login'; }, 2000); }
        else if (err.response.status === 401 || err.response.status === 400) setLoginError('Incorrect email or password. Please try again.');
        else if (err.response.status === 404) setLoginError('Account not found. Please check your email.');
        else    setLoginError('Login failed. Please try again later.');
      } else if (err.request) setLoginError('Cannot connect to server. Check your internet connection.');
      else setLoginError('An unexpected error occurred. Please try again.');
    }
  };

  /* ── Success screen ── */
  if (loginSuccess) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="lp-root">
          <div className="lp-blob lp-blob1"/><div className="lp-blob lp-blob2"/><div className="lp-blob lp-blob3"/>
          <div className="lp-grid"/>
          <div className="lp-success-wrap">
            <div className="lp-success-icon"><CheckCircle2 size={40} color="#fff"/></div>
            <h2 className="lp-success-title">Login Successful! 🎉</h2>
            <p className="lp-success-sub">Welcome back to CoffAI</p>
            <p className="lp-success-note">Redirecting to your dashboard…</p>
            <div className="lp-progress-track"><div className="lp-progress-bar"/></div>
          </div>
        </div>
      </>
    );
  }

  /* ── Main login ── */
  return (
    <>
      <style>{STYLES}</style>
      <div className="lp-root">
        {/* Background */}
        <div className="lp-blob lp-blob1"/><div className="lp-blob lp-blob2"/><div className="lp-blob lp-blob3"/>
        <div className="lp-grid"/>

        {/* Back button */}
        <button className="lp-back" onClick={() => window.history.back()}>
          <ArrowLeft size={17}/> Back
        </button>

        {/* Card */}
        <div className="lp-center">
          <div className="lp-card">

            {/* Logo */}
            <div className="lp-logo">
              <img src="/images/coffai1.png" alt="CoffAI" className="lp-logo-img"/>
              <span className="lp-logo-text">CoffAI</span>
            </div>

            <h1 className="lp-title">Welcome back</h1>
            <p className="lp-subtitle">Log in to your café dashboard</p>

            {/* Error banner */}
            {loginError && (
              <div className="lp-error-banner">
                <AlertCircle size={18} className="lp-error-icon"/>
                <div>
                  <p className="lp-error-title">Login failed</p>
                  <p className="lp-error-msg">{loginError}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="lp-field">
              <label className="lp-label">Email <span className="lp-req">*</span></label>
              <div className="lp-input-wrap">
                <Mail size={17} className="lp-input-icon"/>
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="youremail@example.com"
                  className={`lp-input lp-input-pad-l ${errors.email ? 'lp-input-err' : ''}`}
                />
              </div>
              {errors.email && <p className="lp-field-error"><AlertCircle size={13}/>{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="lp-field">
              <label className="lp-label">Password <span className="lp-req">*</span></label>
              <div className="lp-input-wrap">
                <Lock size={17} className="lp-input-icon"/>
                <input
                  type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                  onChange={handleChange} placeholder="••••••••"
                  className={`lp-input lp-input-pad-l lp-input-pad-r ${errors.password ? 'lp-input-err' : ''}`}
                />
                <button type="button" className="lp-eye" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}
                </button>
              </div>
              {errors.password && <p className="lp-field-error"><AlertCircle size={13}/>{errors.password}</p>}


            </div>

            {/* Submit */}
            <button type="button" onClick={handleSubmit} disabled={isLoading}
              className={`lp-submit ${isLoading ? 'lp-submit-loading' : ''}`}>
              {isLoading ? (
                <span className="lp-submit-inner"><span className="lp-spinner"/>Logging in…</span>
              ) : (
                <span className="lp-submit-inner">Log In →</span>
              )}
            </button>

            {/* Sign up link */}
            <p className="lp-signup-row">
              Don't have an account?{' '}
              <button className="lp-signup-link" onClick={() => navigate('/#form')}>
                Sign up free
              </button>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  .lp-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    background: #0d1f3c;
    display: flex; align-items: center; justify-content: center;
    position: relative; overflow: hidden;
    padding: 24px;
  }

  /* ── Background blobs ── */
  .lp-blob {
    position: absolute; border-radius: 50%;
    filter: blur(80px); pointer-events: none;
  }
  .lp-blob1 { width:500px;height:500px; background:#1bcbe0; opacity:.12; top:-100px;right:-80px;
    animation:lp-blob1 12s ease-in-out infinite; }
  .lp-blob2 { width:420px;height:420px; background:#1a6dd4; opacity:.12; bottom:-80px;left:-60px;
    animation:lp-blob2 15s ease-in-out infinite; }
  .lp-blob3 { width:280px;height:280px; background:#1bcbe0; opacity:.08; top:45%;left:35%;
    animation:lp-blob3 10s ease-in-out infinite; }
  @keyframes lp-blob1 { 0%,100%{transform:translate(0,0) scale(1);}  50%{transform:translate(-30px,25px) scale(1.08);} }
  @keyframes lp-blob2 { 0%,100%{transform:translate(0,0) scale(1);}  50%{transform:translate(25px,-35px) scale(1.06);} }
  @keyframes lp-blob3 { 0%,100%{transform:translate(0,0) scale(1);}  50%{transform:translate(-15px,15px) scale(.92);} }

  /* ── Dot grid ── */
  .lp-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(rgba(27,203,224,.14) 1px, transparent 1px);
    background-size: 36px 36px;
  }

  /* ── Back button ── */
  .lp-back {
    position: fixed; top: 20px; left: 20px; z-index: 50;
    display: flex; align-items: center; gap: 7px;
    font-family: inherit; font-size: .82rem; font-weight: 600;
    color: #7a9dc0; cursor: pointer;
    background: rgba(255,255,255,.05);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(27,203,224,.14);
    padding: 8px 16px; border-radius: 999px;
    transition: all .22s;
  }
  .lp-back:hover { color: #1bcbe0; border-color: rgba(27,203,224,.35); background: rgba(27,203,224,.07); }

  /* ── Center wrapper ── */
  .lp-center {
    position: relative; z-index: 2;
    width: 100%; max-width: 440px;
  }

  /* ── Card ── */
  .lp-card {
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(27,203,224,.18);
    border-radius: 28px;
    padding: 44px 40px;
    box-shadow: 0 24px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(27,203,224,.06);
  }
  @media (max-width: 480px) { .lp-card { padding: 32px 24px; } }

  /* ── Logo ── */
  .lp-logo {
    display: flex; align-items: center; gap: 10px;
    justify-content: center; margin-bottom: 28px;
  }
  .lp-logo-img { width: 42px; }
  .lp-logo-text {
    font-size: 1.5rem; font-weight: 800; letter-spacing: -.01em;
    background: linear-gradient(135deg, #1bcbe0, #1a6dd4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  /* ── Heading ── */
  .lp-title {
    font-size: 1.75rem; font-weight: 800; letter-spacing: -.02em;
    color: #fff; text-align: center; margin: 0 0 8px;
  }
  .lp-subtitle {
    font-size: .9rem; color: #4a7099; text-align: center; margin: 0 0 28px;
  }

  /* ── Error banner ── */
  .lp-error-banner {
    display: flex; align-items: flex-start; gap: 12px;
    background: rgba(248,113,113,.08);
    border: 1px solid rgba(248,113,113,.3);
    border-radius: 14px; padding: 14px 16px; margin-bottom: 20px;
  }
  .lp-error-icon { color: #f87171; flex-shrink: 0; margin-top: 1px; }
  .lp-error-title { font-size: .82rem; font-weight: 700; color: #f87171; margin-bottom: 2px; }
  .lp-error-msg   { font-size: .78rem; color: #fca5a5; }

  /* ── Field ── */
  .lp-field { margin-bottom: 18px; }
  .lp-label {
    display: block; font-size: .72rem; font-weight: 700;
    letter-spacing: .1em; text-transform: uppercase;
    color: #4a7099; margin-bottom: 8px;
  }
  .lp-req { color: #f87171; margin-left: 2px; }

  .lp-input-wrap { position: relative; }
  .lp-input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    color: #2a4a6a; pointer-events: none;
  }
  .lp-input {
    width: 100%; padding: 12px 14px; border-radius: 13px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(27,203,224,.14);
    color: #e8f4ff; font-size: .9rem; font-family: inherit;
    transition: border-color .2s, box-shadow .2s; outline: none;
    box-sizing: border-box;
  }
  .lp-input::placeholder { color: #1e3a5a; }
  .lp-input:focus { border-color: rgba(27,203,224,.5); box-shadow: 0 0 0 3px rgba(27,203,224,.08); }
  .lp-input-pad-l { padding-left: 42px; }
  .lp-input-pad-r { padding-right: 42px; }
  .lp-input-err   { border-color: rgba(248,113,113,.45) !important; }

  .lp-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: #2a4a6a;
    transition: color .2s; padding: 0;
  }
  .lp-eye:hover { color: #1bcbe0; }

  .lp-field-error {
    display: flex; align-items: center; gap: 5px;
    font-size: .76rem; color: #f87171; margin-top: 6px;
  }



  /* ── Submit ── */
  .lp-submit {
    width: 100%; padding: 14px; border-radius: 14px; border: none; cursor: pointer;
    font-family: inherit; font-size: .95rem; font-weight: 700;
    background: linear-gradient(135deg, #1bcbe0, #1a6dd4);
    color: #fff;
    box-shadow: 0 6px 28px rgba(27,203,224,.38);
    transition: all .28s; margin-bottom: 20px;
  }
  .lp-submit:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(27,203,224,.55); }
  .lp-submit:active { transform: translateY(0); }
  .lp-submit-loading { background: #1e3a5a !important; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
  .lp-submit-inner  { display: flex; align-items: center; justify-content: center; gap: 8px; }

  .lp-spinner {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.2);
    border-top-color: #fff;
    animation: lp-spin .7s linear infinite; flex-shrink: 0;
  }
  @keyframes lp-spin { to { transform: rotate(360deg); } }

  /* ── Signup link ── */
  .lp-signup-row {
    text-align: center; font-size: .85rem; color: #4a7099; margin: 0;
  }
  .lp-signup-link {
    background: none; border: none; cursor: pointer; font-family: inherit;
    font-size: .85rem; font-weight: 700;
    background: linear-gradient(135deg, #1bcbe0, #1a6dd4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    transition: opacity .2s;
  }
  .lp-signup-link:hover { opacity: .75; }

  /* ── Success screen ── */
  .lp-success-wrap {
    position: relative; z-index: 2;
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(27,203,224,.18);
    border-radius: 28px; padding: 56px 40px;
    text-align: center; max-width: 420px; width: 100%;
    box-shadow: 0 24px 80px rgba(0,0,0,.35);
  }
  .lp-success-icon {
    width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 24px;
    background: linear-gradient(135deg, #34d399, #059669);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 32px rgba(52,211,153,.4);
    animation: lp-pop .7s cubic-bezier(.16,1,.3,1);
  }
  @keyframes lp-pop { 0%{transform:scale(.4);opacity:0;} 100%{transform:scale(1);opacity:1;} }

  .lp-success-title {
    font-size: 1.6rem; font-weight: 800; margin-bottom: 10px;
    background: linear-gradient(135deg, #1bcbe0, #1a6dd4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .lp-success-sub  { font-size: 1rem; color: #c8dff0; margin-bottom: 6px; }
  .lp-success-note { font-size: .85rem; color: #4a7099; margin-bottom: 28px; }

  .lp-progress-track {
    width: 100%; height: 4px; background: rgba(255,255,255,.08);
    border-radius: 999px; overflow: hidden;
  }
  .lp-progress-bar {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg, #1bcbe0, #1a6dd4);
    animation: lp-progress 2s ease-out forwards;
  }
  @keyframes lp-progress { from{width:0%} to{width:100%} }
`;