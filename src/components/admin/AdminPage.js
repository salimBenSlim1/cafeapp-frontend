import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, QrCode, TrendingUp,
  Lock, CreditCard, Check, Star, AlertCircle, Loader2, Users,
  LogOut, ChevronRight, Wifi
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import cafeApi from '../../api/cafeApiInstance';
import axios from 'axios';

export default function ProtectedAdminDashboard() {
  const [isPaid, setIsPaid]                     = useState(true);
  const [isLoading, setIsLoading]               = useState(false);
  const [userPlan, setUserPlan]                 = useState('VIP');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [hoveredCard, setHoveredCard]           = useState(null);
  const navigate = useNavigate();




  const handlePayment = async (planName, price) => {
    setProcessingPayment(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      alert('Payment simulation — would redirect to payment gateway');
    } catch (err) {
      alert('Payment error. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCardClick = (item) => {
    if (item.id === 5 && userPlan === 'basic') {
      alert('⭐ AI Agent is a Pro feature! Upgrade to unlock.');
      return;
    }
    navigate(item.path);
  };

  const isFeatureLocked = (item) => item.requiredPlan === 'VIP' && userPlan === 'Basic';

  const menuItems = [
    { id:1, title:'Items',          description:'Manage menu items & inventory',       path:'/admin/items',   icon:Package,     color:'#1a6dd4', light:'rgba(26,109,212,0.12)',  requiredPlan:'Basic' },
    { id:2, title:'Dashboard',      description:'Analytics & performance insights',    path:'/admin/charts',  icon:TrendingUp,  color:'#0ab9d0', light:'rgba(10,185,208,0.12)',  requiredPlan:'Basic' },
    { id:3, title:'Orders',         description:'View & manage live orders',           path:'/admin/orders',  icon:ShoppingCart,color:'#6366f1', light:'rgba(99,102,241,0.12)', requiredPlan:'Basic' },
    { id:4, title:'Manage Waiters', description:'Staff management & scheduling',       path:'/admin/waiters', icon:Users,       color:'#f59e0b', light:'rgba(245,158,11,0.12)', requiredPlan:'Basic' },
    { id:6, title:'QR Codes',       description:'Generate & print table QR codes',     path:'/admin/qrcode',  icon:QrCode,      color:'#10b981', light:'rgba(16,185,129,0.12)', requiredPlan:'Basic' },
  ];

  const pricingPlans = [
    { name:'Basic', price:69, features:['Up to 20 tables','QR code menus','Simple dashboard','Email support'], popular:false },
    { name:'Pro + AI', price:89, features:['Up to 50 tables','Custom QR codes','AI Analytics Agent','Advanced insights','Priority support 24/7'], popular:true },
  ];

  /* ══════════════════════════════
     LOADING
  ══════════════════════════════ */
  if (isLoading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="ad-root ad-center">
          <div className="ad-blob ad-blob1"/><div className="ad-blob ad-blob2"/>
          <div className="ad-grid"/>
          <div className="ad-loading-wrap">
            <div className="ad-loading-spinner"/>
            <p className="ad-loading-text">Checking your account…</p>
          </div>
        </div>
      </>
    );
  }

  /* ══════════════════════════════
     PAYMENT REQUIRED
  ══════════════════════════════ */
  if (!isPaid) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="ad-root">
          <div className="ad-blob ad-blob1"/><div className="ad-blob ad-blob2"/><div className="ad-blob ad-blob3"/>
          <div className="ad-grid"/>
          <div className="ad-inner" style={{position:'relative',zIndex:2}}>

            {/* Header */}
            <div className="ad-pay-header">
              <div className="ad-pay-icon-wrap">
                <Lock size={32} color="#fff"/>
              </div>
              <h1 className="ad-pay-title">Subscription <span className="ad-grad-text">Required</span></h1>
              <p className="ad-pay-sub">Choose a plan to activate your café dashboard and start accepting orders.</p>
            </div>

            {/* Alert */}
            <div className="ad-alert">
              <AlertCircle size={18} color="#fbbf24" style={{flexShrink:0,marginTop:2}}/>
              <div>
                <p className="ad-alert-title">Monthly Subscription</p>
                <p className="ad-alert-body">Your account activates immediately after payment. Renew monthly to maintain full access.</p>
              </div>
            </div>

            {/* Plans */}
            <div className="ad-plans-grid">
              {pricingPlans.map((plan, i) => (
                <div key={i} className={`ad-plan-card ${plan.popular ? 'ad-plan-popular' : ''}`}>
                  {plan.popular && <span className="ad-plan-badge">Most Popular</span>}
                  <p className="ad-plan-tier">{plan.name}</p>
                  <div className="ad-plan-price">
                    {plan.price}<span className="ad-plan-per"> TND / month</span>
                  </div>
                  <div className="ad-plan-divider"/>
                  <div className="ad-plan-features">
                    {plan.features.map((f,j) => (
                      <div key={j} className="ad-plan-feat">
                        <Check size={14} color="#1bcbe0" style={{flexShrink:0}}/>
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePayment(plan.name, plan.price)}
                    disabled={processingPayment}
                    className={`ad-plan-btn ${plan.popular ? 'ad-plan-btn-main' : 'ad-plan-btn-ghost'}`}
                  >
                    {processingPayment
                      ? <><span className="ad-spinner"/>&nbsp;Processing…</>
                      : <><CreditCard size={16}/>&nbsp;Pay now</>}
                  </button>
                </div>
              ))}
            </div>

            {/* Preview */}
            <h2 className="ad-preview-title">What you'll unlock</h2>
            <div className="ad-preview-grid">
              {menuItems.slice(0,3).map(item => (
                <div key={item.id} className="ad-preview-card">
                  <div className="ad-preview-icon" style={{background:item.light, border:`1px solid ${item.color}30`}}>
                    <item.icon size={22} color={item.color}/>
                  </div>
                  <p className="ad-preview-name">{item.title}</p>
                  <p className="ad-preview-desc">{item.description}</p>
                  <div className="ad-preview-lock"><Lock size={14} color="#2a4a6a"/></div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </>
    );
  }

  /* ══════════════════════════════
     MAIN DASHBOARD
  ══════════════════════════════ */
  return (
    <>
      <style>{STYLES}</style>
      <div className="ad-root">
        <div className="ad-blob ad-blob1"/><div className="ad-blob ad-blob2"/><div className="ad-blob ad-blob3"/>
        <div className="ad-grid"/>

        <div className="ad-inner" style={{position:'relative',zIndex:2}}>

          {/* ── Top bar ── */}
          <div className="ad-topbar">
            <div className="ad-topbar-left">
              {/* Logo */}
              <div className="ad-logo">
                <img src="/images/coffai1.png" alt="CoffAI" className="ad-logo-img"/>
                <span className="ad-logo-text">CoffAI</span>
              </div>
              {/* Status badges */}
              <div className="ad-badges">
                <span className="ad-badge-online">
                  <span className="ad-online-dot"/>Online
                </span>
                <span className={`ad-badge-plan ${userPlan === 'VIP' || userPlan === 'pro' ? 'ad-badge-plan-pro' : ''}`}>
                  <Star size={11} fill="currentColor"/>
                  {userPlan} Plan
                </span>
              </div>
            </div>

            <button
              className="ad-logout"
              onClick={() => {
                axios.post(process.env.REACT_APP_API_URL + '/logout',{},{withCredentials:true});
                localStorage.clear();
                navigate('/login');
              }}
            >
              <LogOut size={15}/> Disconnect
            </button>
          </div>

          {/* ── Page title ── */}
          <div className="ad-page-title-wrap">
            <h1 className="ad-page-title">Admin <span className="ad-grad-text">Dashboard</span></h1>
            <p className="ad-page-sub">Manage your café operations from one central hub.</p>
          </div>

          {/* ── Cards grid ── */}
          <div className="ad-cards-grid">
            {menuItems.map((item, index) => {
              const locked = isFeatureLocked(item);
              return (
                <div
                  key={item.id}
                  className={`ad-card ${hoveredCard === item.id && !locked ? 'ad-card-hovered' : ''} ${locked ? 'ad-card-locked' : ''}`}
                  style={{ animationDelay: `${index * 0.08}s` }}
                  onClick={() => !locked && handleCardClick(item)}
                  onMouseEnter={() => !locked && setHoveredCard(item.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Glow */}
                  <div className="ad-card-glow" style={{ background: item.color, opacity: hoveredCard === item.id ? 0.18 : 0 }}/>

                  {/* Lock badge */}
                  {locked && (
                    <div className="ad-lock-badge"><Lock size={11}/>VIP Only</div>
                  )}

                  {/* Icon */}
                  <div className="ad-card-icon" style={{ background: item.light, border: `1px solid ${item.color}30` }}>
                    <item.icon size={26} color={item.color}/>
                  </div>

                  <h3 className="ad-card-title">{item.title}</h3>
                  <p className="ad-card-desc">{item.description}</p>

                  <div className="ad-card-cta" style={{ color: locked ? '#f59e0b' : item.color }}>
                    <span>{locked ? 'Upgrade to access' : 'Open'}</span>
                    <ChevronRight size={15}/>
                  </div>

                  {/* Corner decoration */}
                  <div className="ad-card-deco" style={{ background: item.color }}/>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}

/* ─── Styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  .ad-root {
    font-family: 'Plus Jakarta Sans', sans-serif;
    min-height: 100vh;
    background: #0d1f3c;
    color: #e8f4ff;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 60px;
  }
  .ad-center {
    display: flex; align-items: center; justify-content: center;
  }

  /* ── Background ── */
  .ad-blob {
    position: fixed; border-radius: 50%;
    filter: blur(90px); pointer-events: none; z-index: 0;
  }
  .ad-blob1 { width:550px;height:550px; background:#1bcbe0; opacity:.1; top:-120px;right:-100px;
    animation:adb1 13s ease-in-out infinite; }
  .ad-blob2 { width:450px;height:450px; background:#1a6dd4; opacity:.1; bottom:-100px;left:-80px;
    animation:adb2 16s ease-in-out infinite; }
  .ad-blob3 { width:300px;height:300px; background:#1bcbe0; opacity:.06; top:45%;left:30%;
    animation:adb3 11s ease-in-out infinite; }
  @keyframes adb1{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-35px,28px) scale(1.08);}}
  @keyframes adb2{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(28px,-38px) scale(1.06);}}
  @keyframes adb3{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-15px,18px) scale(.91);}}

  .ad-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: radial-gradient(rgba(27,203,224,.12) 1px, transparent 1px);
    background-size: 38px 38px;
  }

  /* ── Inner ── */
  .ad-inner {
    max-width: 1200px; margin: 0 auto; padding: 0 24px;
  }

  /* ── Loading ── */
  .ad-loading-wrap {
    position: relative; z-index: 2; text-align: center;
  }
  .ad-loading-spinner {
    width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 20px;
    border: 3px solid rgba(27,203,224,.15);
    border-top-color: #1bcbe0;
    animation: ad-spin .8s linear infinite;
  }
  @keyframes ad-spin { to { transform:rotate(360deg); } }
  .ad-loading-text { color: #4a7099; font-size: .95rem; }

  /* ── Grad text ── */
  .ad-grad-text {
    background: linear-gradient(135deg, #1bcbe0, #1a6dd4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  /* ══════════════ TOP BAR ══════════════ */
  .ad-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 28px 0 0;
    border-bottom: 1px solid rgba(27,203,224,.1);
    padding-bottom: 20px;
    margin-bottom: 40px;
  }
  .ad-topbar-left { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }

  .ad-logo { display: flex; align-items: center; gap: 9px; }
  .ad-logo-img { width: 38px; }
  .ad-logo-text {
    font-size: 1.3rem; font-weight: 800; letter-spacing: -.01em;
    background: linear-gradient(135deg, #1bcbe0, #1a6dd4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  .ad-badges { display: flex; align-items: center; gap: 8px; }
  .ad-badge-online {
    display: flex; align-items: center; gap: 6px;
    font-size: .72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    color: #34d399;
    background: rgba(52,211,153,.08); border: 1px solid rgba(52,211,153,.2);
    padding: 5px 12px; border-radius: 999px;
  }
  .ad-online-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #34d399;
    animation: ad-blink 1.3s ease-in-out infinite;
  }
  @keyframes ad-blink { 0%,100%{opacity:1;} 50%{opacity:.2;} }

  .ad-badge-plan {
    display: flex; align-items: center; gap: 6px;
    font-size: .72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    color: #1bcbe0;
    background: rgba(27,203,224,.08); border: 1px solid rgba(27,203,224,.2);
    padding: 5px 12px; border-radius: 999px;
  }
  .ad-badge-plan-pro { color: #a78bfa; background: rgba(167,139,250,.08); border-color: rgba(167,139,250,.22); }

  .ad-logout {
    display: flex; align-items: center; gap: 7px;
    font-family: inherit; font-size: .82rem; font-weight: 700;
    color: #f87171; cursor: pointer;
    background: rgba(248,113,113,.07);
    border: 1px solid rgba(248,113,113,.22);
    padding: 9px 18px; border-radius: 999px;
    transition: all .22s;
  }
  .ad-logout:hover { background: rgba(248,113,113,.14); border-color: rgba(248,113,113,.45); }

  /* ══════════════ PAGE TITLE ══════════════ */
  .ad-page-title-wrap { margin-bottom: 36px; }
  .ad-page-title {
    font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 800;
    letter-spacing: -.02em; margin: 0 0 8px;
  }
  .ad-page-sub { font-size: .92rem; color: #4a7099; margin: 0; }

  /* ══════════════ CARDS ══════════════ */
  .ad-cards-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  @media (max-width: 900px) { .ad-cards-grid { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 560px) { .ad-cards-grid { grid-template-columns: 1fr; } }

  .ad-card {
    position: relative; overflow: hidden;
    background: rgba(255,255,255,.04);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(27,203,224,.12);
    border-radius: 22px; padding: 28px 24px;
    cursor: pointer;
    transition: all .35s cubic-bezier(.16,1,.3,1);
    animation: ad-slideup .6s ease-out both;
  }
  @keyframes ad-slideup { from{opacity:0;transform:translateY(28px);} to{opacity:1;transform:translateY(0);} }

  .ad-card-hovered {
    transform: translateY(-7px);
    border-color: rgba(27,203,224,.3);
    box-shadow: 0 20px 50px rgba(0,0,0,.35), 0 0 0 1px rgba(27,203,224,.1);
  }
  .ad-card-locked {
    cursor: not-allowed; opacity: .6;
  }
  .ad-card-locked:hover { transform: none !important; }

  /* Glow overlay */
  .ad-card-glow {
    position: absolute; inset: -2px; border-radius: 24px;
    filter: blur(20px); pointer-events: none;
    transition: opacity .3s;
    z-index: 0;
  }

  /* Lock badge */
  .ad-lock-badge {
    position: absolute; top: 16px; right: 16px;
    display: flex; align-items: center; gap: 5px;
    font-size: .65rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    color: #f59e0b;
    background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.25);
    padding: 4px 10px; border-radius: 999px;
  }

  /* Icon */
  .ad-card-icon {
    width: 54px; height: 54px; border-radius: 16px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px; position: relative; z-index: 1;
    transition: transform .3s;
  }
  .ad-card-hovered .ad-card-icon { transform: scale(1.1) rotate(4deg); }

  .ad-card-title {
    font-size: 1.15rem; font-weight: 800; margin: 0 0 6px;
    color: #e8f4ff; position: relative; z-index: 1;
  }
  .ad-card-desc {
    font-size: .82rem; color: #4a7099; line-height: 1.55;
    margin: 0 0 18px; position: relative; z-index: 1;
  }
  .ad-card-cta {
    display: flex; align-items: center; gap: 4px;
    font-size: .8rem; font-weight: 700;
    position: relative; z-index: 1;
    transition: gap .2s;
  }
  .ad-card-hovered .ad-card-cta { gap: 8px; }

  /* Corner deco */
  .ad-card-deco {
    position: absolute; bottom: -24px; right: -24px;
    width: 80px; height: 80px; border-radius: 50%;
    opacity: .06; pointer-events: none;
    transition: opacity .3s;
  }
  .ad-card-hovered .ad-card-deco { opacity: .14; }

  /* ══════════════ PAYMENT REQUIRED ══════════════ */
  .ad-pay-header {
    text-align: center; padding: 52px 0 36px;
    animation: ad-fadein .7s ease-out;
  }
  @keyframes ad-fadein { from{opacity:0;transform:translateY(-18px);} to{opacity:1;transform:translateY(0);} }

  .ad-pay-icon-wrap {
    width: 76px; height: 76px; border-radius: 50%; margin: 0 auto 22px;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 32px rgba(245,158,11,.35);
  }
  .ad-pay-title {
    font-size: clamp(2rem, 5vw, 3rem); font-weight: 800;
    letter-spacing: -.02em; margin: 0 0 12px;
  }
  .ad-pay-sub {
    font-size: 1rem; color: #4a7099; max-width: 500px; margin: 0 auto; line-height: 1.65;
  }

  /* Alert */
  .ad-alert {
    display: flex; gap: 14px; align-items: flex-start;
    background: rgba(251,191,36,.07); border: 1px solid rgba(251,191,36,.22);
    border-radius: 16px; padding: 18px 20px; margin-bottom: 40px;
  }
  .ad-alert-title { font-size: .88rem; font-weight: 700; color: #fbbf24; margin-bottom: 4px; }
  .ad-alert-body  { font-size: .82rem; color: #7a9dc0; line-height: 1.55; }

  /* Plans */
  .ad-plans-grid {
    display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; margin-bottom: 52px;
  }
  @media (max-width: 640px) { .ad-plans-grid { grid-template-columns: 1fr; } }

  .ad-plan-card {
    background: rgba(255,255,255,.04); backdrop-filter: blur(16px);
    border: 1px solid rgba(27,203,224,.14);
    border-radius: 22px; padding: 32px 28px;
    position: relative; overflow: hidden;
    transition: all .3s cubic-bezier(.16,1,.3,1);
  }
  .ad-plan-card:hover { transform: translateY(-5px); border-color: rgba(27,203,224,.3); box-shadow: 0 18px 50px rgba(0,0,0,.3); }
  .ad-plan-popular {
    border-color: #1bcbe0 !important;
    box-shadow: 0 0 0 1px rgba(27,203,224,.2), 0 20px 50px rgba(27,203,224,.12);
  }

  .ad-plan-badge {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    font-size: .65rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
    padding: 4px 14px; border-radius: 999px; white-space: nowrap;
    background: linear-gradient(135deg,#1bcbe0,#1a6dd4); color: #fff;
  }

  .ad-plan-tier {
    font-size: .7rem; font-weight: 700; letter-spacing: .2em; text-transform: uppercase;
    color: #1bcbe0; margin-bottom: 10px; margin-top: 8px;
  }
  .ad-plan-price {
    font-size: 2.8rem; font-weight: 800; line-height: 1;
    background: linear-gradient(135deg,#1bcbe0,#1a6dd4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 20px;
  }
  .ad-plan-per { font-size: .88rem; font-weight: 500; color: #4a7099; -webkit-text-fill-color: #4a7099; }

  .ad-plan-divider { height: 1px; background: rgba(27,203,224,.1); margin-bottom: 18px; }

  .ad-plan-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }
  .ad-plan-feat {
    display: flex; align-items: center; gap: 10px;
    font-size: .85rem; color: #7a9dc0;
  }

  .ad-plan-btn {
    width: 100%; padding: 13px; border-radius: 12px; border: none; cursor: pointer;
    font-family: inherit; font-size: .9rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: all .25s;
  }
  .ad-plan-btn-main {
    background: linear-gradient(135deg,#1bcbe0,#1a6dd4); color: #fff;
    box-shadow: 0 6px 24px rgba(27,203,224,.35);
  }
  .ad-plan-btn-main:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(27,203,224,.5); }
  .ad-plan-btn-ghost {
    background: rgba(255,255,255,.04); color: #7a9dc0;
    border: 1px solid rgba(27,203,224,.16);
  }
  .ad-plan-btn-ghost:hover { border-color: rgba(27,203,224,.4); color: #1bcbe0; background: rgba(27,203,224,.06); }

  .ad-spinner {
    width: 16px; height: 16px; border-radius: 50%; display: inline-block;
    border: 2px solid rgba(255,255,255,.2); border-top-color: #fff;
    animation: ad-spin .7s linear infinite;
  }

  /* Preview */
  .ad-preview-title {
    font-size: 1.2rem; font-weight: 800; text-align: center; margin-bottom: 20px; color: #7a9dc0;
  }
  .ad-preview-grid {
    display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; opacity: .45;
  }
  @media (max-width:640px) { .ad-preview-grid { grid-template-columns: 1fr; } }

  .ad-preview-card {
    background: rgba(255,255,255,.03); border: 1px solid rgba(27,203,224,.1);
    border-radius: 16px; padding: 20px 18px; position: relative;
  }
  .ad-preview-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
  }
  .ad-preview-name  { font-size: .9rem; font-weight: 700; color: #c8dff0; margin-bottom: 5px; }
  .ad-preview-desc  { font-size: .76rem; color: #4a7099; line-height: 1.5; }
  .ad-preview-lock  {
    position: absolute; top: 12px; right: 14px;
    background: rgba(42,74,106,.5); border-radius: 8px; padding: 5px;
  }
`;