import React, { useEffect, useRef, useState } from 'react';
import {
  Coffee, Zap, TrendingUp, QrCode, Check, Star, Menu, X, Play,
  CreditCard, UserPlus, ArrowRight, BarChart2, Bell, Monitor,
  ChefHat, Smartphone, Shield, Clock, Users,
} from 'lucide-react';
import RegistrationForm from './RegistrationForm';
import { useNavigate } from 'react-router-dom';

export default function CafeAppLanding() {
  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [isVideoOpen,   setIsVideoOpen]   = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [billingAnnual, setBillingAnnual] = useState(false);
  const featuresRef = useRef(null);
  const pricingRef  = useRef(null);
  const navigate    = useNavigate();

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo     = ref => { ref.current?.scrollIntoView({ behavior: 'smooth' }); setIsMenuOpen(false); };
  const scrollToForm = ()  => document.getElementById('form')?.scrollIntoView({ behavior: 'smooth' });

  const features = [
    {
      icon: QrCode,
      title: 'Smart QR Menus',
      desc: 'Dynamic digital menus your customers scan in seconds — no app download, no paper. Update items, prices, and photos instantly from your dashboard. Every table gets its own unique QR code.',
      metrics: [['Menu update speed','100%'], ['Customer adoption','94%'], ['Paper cost saved','100%'], ['Order accuracy','98%']],
    },
    {
      icon: Monitor,
      title: 'Kitchen Display (KDS)',
      desc: 'Orders appear on your barman screen the instant a customer taps. No shouting, no paper tickets, no missed items. Items turn green as they\'re served — every station stays in sync.',
      metrics: [['Order speed','87%'], ['Missed items reduced','96%'], ['Kitchen efficiency','82%'], ['Staff confusion','−94%']],
    },
    {
      icon: BarChart2,
      title: 'Sales Analytics',
      desc: 'Daily and weekly snapshots of what\'s selling, which waiter is performing, and where your revenue comes from. Filter by day, week or month — everything grouped cleanly.',
      metrics: [['Revenue visibility','100%'], ['Best-seller tracking','100%'], ['Waiter performance','95%'], ['Decision speed','78%']],
    },
    {
      icon: Bell,
      title: 'Live Notifications',
      desc: 'Stay on top of every table in real time. New orders, low-stock alerts, and status changes all push to your dashboard instantly — no polling, no refresh.',
      metrics: [['Alert latency','< 1s'], ['Low-stock catch rate','99%'], ['Admin response time','−70%'], ['Missed orders','0%']],
    },
  ];

  // Prices: [monthly, annual-monthly-equiv]
  const plans = [
    {
      tier: 'Starter',
      price: [49, 41],
      desc: 'Perfect for small cafés just getting started with digital ordering.',
      features: [
        'Admin dashboard',
        'QR code menus (up to 20 tables)',
        'Real-time order management',
        'Waiter & table management',
        'Kitchen display screen (KDS)',
        'Basic daily analytics',
        'WhatsApp support',
      ],
      cta: 'Get started',
      btnClass: 'btn-price-outline',
      popular: false,
    },
    {
      tier: 'Pro',
      price: [99, 82],
      desc: 'Full analytics, waiter reports, and advanced management for growing cafés.',
      features: [
        { t: 'Everything in Starter, plus:', bold: true },
        'Unlimited tables',
        'Advanced analytics (daily / weekly / monthly)',
        'Per-waiter sales reports',
        'Item performance tracking',
        'Revenue share & top performers',
        'Priority WhatsApp support',
      ],
      cta: 'Start with Pro →',
      btnClass: 'btn-price-main',
      popular: true,
    },
    {
      tier: 'Premium',
      price: [179, 149],
      desc: 'Multi-location, custom branding, and dedicated support for serious operators.',
      features: [
        { t: 'Everything in Pro, plus:', bold: true },
        'Multi-location support',
        'Custom menu branding & themes',
        'Photo galleries per item',
        'Visual menu builder',
        'Dedicated account manager',
        'Custom onboarding',
      ],
      cta: 'Contact us',
      btnClass: 'btn-price-outline',
      popular: false,
    },
  ];

  return (
    <div className="coffai-root">
      <style>{CSS}</style>

      {/* ══ NAV ══ */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <img src="/images/coffai1.png" alt="CoffAI"/>
            <span className="nav-logo-text grad-text">CoffAI</span>
          </div>
          <div className="nav-links">
            <button className="nav-link" onClick={() => scrollTo(featuresRef)}>Features</button>
            <button className="nav-link" onClick={() => scrollTo(pricingRef)}>Pricing</button>
            <button className="nav-cta" onClick={() => navigate('/login')}>Log in →</button>
          </div>
          <button className="hamburger" onClick={() => setIsMenuOpen(v => !v)} aria-label="Menu">
            {isMenuOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
        {isMenuOpen && (
          <div className="mobile-menu">
            <button className="nav-link" onClick={() => scrollTo(featuresRef)}>Features</button>
            <button className="nav-link" onClick={() => scrollTo(pricingRef)}>Pricing</button>
            <button className="nav-cta" style={{ width:'100%' }} onClick={() => navigate('/login')}>Log in →</button>
          </div>
        )}
      </nav>

      {/* ══ HERO ══ */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob blob1"/>
          <div className="hero-blob blob2"/>
          <div className="hero-blob blob3"/>
        </div>
        <div className="hero-grid"/>
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <span className="hero-badge-dot"/>
              Made in Tunisia · Built for cafés
            </div>
            <h1 className="hero-h1">
              Your café,<br/>
              <span className="grad-text">smarter than ever.</span>
            </h1>
            <p className="hero-sub">
              QR ordering, real-time kitchen display, and deep analytics —
              all in one platform built specifically for Tunisian cafés.
              No hardware required. Live in under 60 seconds.
            </p>
            <div className="hero-btns">
              <button className="btn-main" onClick={scrollToForm}>
                Start free trial <ArrowRight size={18}/>
              </button>
              <button className="btn-outline" onClick={() => setIsVideoOpen(true)}>
                <span className="play-circle">
                  <Play size={11} style={{ color:'#1bcbe0', marginLeft:2 }}/>
                </span>
                Watch demo
              </button>
            </div>
            <div className="hero-stats">
              {[
                ['49 TND', '/month to start'],
                ['< 60 s',  'Setup time'],
                ['0',       'Hardware needed'],
                ['24/7',    'WhatsApp support'],
              ].map(([n, l], i) => (
                <div key={i}>
                  <div className="hero-stat-num grad-text">{n}</div>
                  <div className="hero-stat-label">{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="hero-visual">
            <div className="float-card float-card-a">
              <div className="fc-label">Revenue today</div>
              <div className="fc-val">840 TND <span>↑12%</span></div>
              <div className="fc-sub">vs yesterday</div>
            </div>
            <div className="mock-main">
              <div className="mock-header">
                <span className="mock-title">Kitchen Display</span>
                <span className="mock-badge-live"><span className="live-dot"/>Live</span>
              </div>
              <div className="mock-bars">
                {[['Espresso', 88], ['Cappuccino', 72], ['Cold Brew', 61], ['Narguilé', 45]].map(([name, w]) => (
                  <div className="mock-bar-row" key={name}>
                    <span className="mock-bar-label">{name}</span>
                    <div className="mock-bar-track"><div className="mock-bar-fill" style={{ width:`${w}%` }}/></div>
                    <span className="mock-bar-val">{w}%</span>
                  </div>
                ))}
              </div>
              <div className="mock-orders">
                {[
                  { icon:'☕', name:'Espresso ×2',  table:'Table 4', s:'new',   label:'New'     },
                  { icon:'🥛', name:'Cappuccino ×1', table:'Table 7', s:'ready', label:'Serving' },
                  { icon:'🧊', name:'Cold Brew ×3',  table:'Table 2', s:'done',  label:'Done'    },
                ].map((o, i) => (
                  <div className="mock-order" key={i}>
                    <div className="mock-order-info">
                      <div className="mock-order-icon">{o.icon}</div>
                      <div>
                        <div className="mock-order-name">{o.name}</div>
                        <div className="mock-order-table">{o.table}</div>
                      </div>
                    </div>
                    <span className={`mock-order-status status-${o.s}`}>{o.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="float-card float-card-b">
              <div className="fc-label">Active tables</div>
              <div className="fc-val">14 <span style={{ color:'#1bcbe0' }}>/ 20</span></div>
              <div className="fc-sub">70% occupied</div>
            </div>
            <div className="qr-card">
              <div style={{ marginBottom:6, fontSize:'.6rem', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'#607898' }}>Your QR</div>
              <div className="qr-grid">
                {Array.from({ length:36 }, (_, i) => {
                  const p = [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,0,1,0,0,1,0,1,0,1,1,0,1,1,0,0,1,1,1,0,1,0];
                  return <div key={i} className="qr-cell" style={{ background:p[i]?'#0d1f3c':'transparent', aspectRatio:'1' }}/>;
                })}
              </div>
              <div style={{ marginTop:6, fontSize:'.58rem', color:'#aac', textAlign:'center' }}>Scan to order</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section className="section how-bg" ref={featuresRef}>
        <div className="section-inner">
          <div className="section-label reveal">How It Works</div>
          <h2 className="section-h2 reveal">Live in <span className="grad-text">three steps.</span></h2>
          <p className="section-sub reveal">No IT team. No hardware installation. No training sessions. Just sign up, print QR codes, and go.</p>

          <div className="steps">
            {[
              { icon: CreditCard, n:'01', title:'Choose a plan',     desc:'Pick Starter, Pro or Premium. All plans include the full ordering system, KDS, and waiter management. Upgrade anytime.' },
              { icon: UserPlus,   n:'02', title:'Set up your café',  desc:'Add your menu items, create waiter accounts, and assign tables — everything is live in your dashboard within minutes.' },
              { icon: QrCode,     n:'03', title:'Print & go live',   desc:'Download your QR codes, place them on tables. Guests scan, order, and your barman screen lights up instantly — zero paper, zero delays.' },
            ].map((item, i) => (
              <div className="step-card reveal" key={i}>
                <span className="step-num">{item.n}</span>
                <div className="step-icon"><item.icon size={24} color="#fff"/></div>
                <div className="step-title">{item.title}</div>
                <p className="step-desc">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Feature explorer */}
          <div className="feature-grid reveal">
            <div className="feature-tabs">
              <h4>Platform Features</h4>
              {features.map((f, i) => (
                <button key={i} className={`ftab ${activeFeature === i ? 'active' : ''}`} onClick={() => setActiveFeature(i)}>
                  <f.icon size={17} className="ftab-icon"/>
                  <span className="ftab-label">{f.title}</span>
                </button>
              ))}
            </div>
            <div className="feature-content">
              <div className="fc-icon-wrap">
                {React.createElement(features[activeFeature].icon, { size:26, color:'#1a6dd4' })}
              </div>
              <h3>{features[activeFeature].title}</h3>
              <p>{features[activeFeature].desc}</p>
              <div className="feat-bars">
                {features[activeFeature].metrics.map(([label, val]) => {
                  const isPercent = String(val).endsWith('%');
                  const pct = isPercent ? parseInt(val) : null;
                  return (
                    <div className="feat-bar-row" key={label}>
                      <span className="feat-bar-label">{label}</span>
                      {pct !== null ? (
                        <div className="feat-bar-track">
                          <div className="feat-bar-fill" style={{ width:`${pct}%` }}/>
                        </div>
                      ) : (
                        <div className="feat-bar-track">
                          <div className="feat-bar-fill" style={{ width:'100%' }}/>
                        </div>
                      )}
                      <span style={{ fontSize:'.72rem', color:'var(--muted)', width:46, textAlign:'right', flexShrink:0 }}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHY COFFAI ══ */}
      <section className="section why-bg">
        <div className="section-inner">
          <div className="section-label reveal" style={{ color:'#1bcbe0' }}>
            <span className="grad-text">Why CoffAI</span>
          </div>
          <h2 className="section-h2 reveal" style={{ color:'#fff' }}>Built for <span className="grad-text">café culture.</span></h2>
          <p className="section-sub reveal" style={{ color:'#4a7099' }}>
            Local competitors sell expensive hardware with annual maintenance. CoffAI is pure software —
            cheaper, faster, and a decade ahead.
          </p>

          {/* Comparison table */}
          <div className="compare-wrap reveal">
            <div className="compare-table">
              <div className="compare-header">
                <div/>
                <div className="compare-col-head">Traditional POS</div>
                <div className="compare-col-head coffai-col"><span className="grad-text">CoffAI</span></div>
              </div>
              {[
                ['Setup cost',         '2,000–5,000 TND hardware',  '0 TND — software only'],
                ['Setup time',         '1–3 days + technician',     'Under 60 seconds'],
                ['QR ordering',        '❌ Not included',            '✅ Built-in'],
                ['Kitchen display',    '❌ Extra hardware required', '✅ Any screen or tablet'],
                ['Analytics',          '❌ Basic or none',           '✅ Daily / weekly / waiter'],
                ['Updates',            'Manual, technician visit',  'Automatic, instant'],
                ['Monthly cost',       '300–600 TND/year maintenance','From 49 TND/month'],
              ].map(([feature, old, neo], i) => (
                <div key={i} className={`compare-row ${i % 2 === 0 ? 'compare-row-alt' : ''}`}>
                  <div className="compare-feature">{feature}</div>
                  <div className="compare-old">{old}</div>
                  <div className="compare-new">{neo}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="why-cards" style={{ marginTop:48 }}>
            {[
              { icon:Zap,       stat:'< 60s',  label:'Setup Time',    desc:'From sign-up to live QR codes on your tables — timed.' },
              { icon:Monitor,   stat:'0 TND',  label:'Hardware Cost', desc:'Works on any smartphone, tablet, or PC your staff already has.' },
              { icon:Shield,    stat:'99.9%',  label:'Uptime',        desc:'Cloud-hosted, auto-backed-up. Your orders never stop.' },
              { icon:Users,     stat:'5+',     label:'Roles Covered', desc:'Admin, waiter, barman — each with their own dedicated view.' },
            ].map((item, i) => (
              <div className="why-card reveal" key={i}>
                <div className="why-icon"><item.icon size={22} color="#1bcbe0"/></div>
                <div className="why-stat grad-text">{item.stat}</div>
                <div className="why-label">{item.label}</div>
                <p className="why-desc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section className="section price-bg" ref={pricingRef}>
        <div className="section-inner">
          <div className="section-label reveal">Pricing</div>
          <h2 className="section-h2 reveal">Simple, <span className="grad-text">transparent pricing.</span></h2>
          <p className="section-sub reveal">No hidden fees. No hardware. Cancel anytime.</p>

          {/* Annual toggle */}
          <div className="billing-toggle reveal">
            <span style={{ color: !billingAnnual ? 'var(--navy)' : 'var(--muted)', fontWeight:700, fontSize:'.88rem' }}>Monthly</span>
            <button
              className="toggle-track"
              onClick={() => setBillingAnnual(v => !v)}
              style={{ background: billingAnnual ? 'linear-gradient(135deg,#1bcbe0,#1a6dd4)' : 'rgba(26,109,212,.15)' }}
            >
              <span className="toggle-thumb" style={{ transform: billingAnnual ? 'translateX(20px)' : 'translateX(0)' }}/>
            </button>
            <span style={{ color: billingAnnual ? 'var(--navy)' : 'var(--muted)', fontWeight:700, fontSize:'.88rem' }}>
              Annual <span className="save-badge">Save 2 months</span>
            </span>
          </div>

          <div className="price-grid">
            {plans.map((plan, pi) => (
              <div key={pi} className={`price-card reveal ${plan.popular ? 'popular' : ''}`}>
                {plan.popular && <span className="popular-badge">Most Popular</span>}
                <div className="price-tier" style={plan.popular ? { marginTop:12 } : {}}>{plan.tier}</div>
                <div className="price-amount" style={plan.popular ? { color:'#fff' } : {}}>
                  {billingAnnual ? plan.price[1] : plan.price[0]}
                  <span style={{ fontSize:'1.1rem', fontWeight:500, color: plan.popular ? '#4a7099' : 'var(--muted)' }}> TND</span>
                </div>
                <div className="price-period">
                  {billingAnnual ? 'per month, billed annually' : 'per month'}
                </div>
                {billingAnnual && (
                  <div style={{ fontSize:'.72rem', color:'#34d399', fontWeight:700, marginBottom:4 }}>
                    = {plan.price[1] * 12} TND/year — saves {(plan.price[0] - plan.price[1]) * 12} TND
                  </div>
                )}
                <p className="price-desc" style={plan.popular ? { color:'#4a7099' } : {}}>{plan.desc}</p>

                {/* Setup fee note */}
                <div style={{ fontSize:'.72rem', color: plan.popular ? 'rgba(27,203,224,.6)' : 'rgba(26,109,212,.6)', marginBottom:16, fontWeight:600 }}>
                  + One-time setup: 250 TND
                </div>

                <div className="price-divider" style={plan.popular ? { background:'rgba(255,255,255,.08)' } : {}}/>
                <div className="price-features">
                  {plan.features.map((f, fi) => {
                    const item = typeof f === 'string' ? { t: f } : f;
                    return (
                      <div className="price-feat" key={fi} style={plan.popular ? { color:'#7a9dc0' } : {}}>
                        {item.bold
                          ? <Star size={13} style={{ color:'#1bcbe0', flexShrink:0, marginTop:2 }}/>
                          : <Check size={13} style={{ color:'#1bcbe0', flexShrink:0, marginTop:2 }}/>
                        }
                        <span style={item.bold ? { color: plan.popular ? '#1bcbe0' : 'var(--blue)', fontWeight:700 } : {}}>{item.t}</span>
                      </div>
                    );
                  })}
                </div>
                <button className={plan.btnClass} onClick={scrollToForm}>{plan.cta}</button>
              </div>
            ))}
          </div>

          {/* Fine print */}
          <p className="reveal" style={{ textAlign:'center', color:'var(--muted)', fontSize:'.78rem', marginTop:28, lineHeight:1.6 }}>
            All plans include a <strong style={{ color:'var(--navy)' }}>14-day free trial</strong> — no credit card required.
            Setup fee covers installation, configuration, and a training session at your location.
          </p>
        </div>
      </section>

      {/* ══ REGISTER ══ */}
      <section className="section reg-bg" id="form">
        <div className="reg-blob1"/><div className="reg-blob2"/>
        <div className="reg-inner">
          <div className="section-label reveal" style={{ justifyContent:'center' }}>Get Started</div>
          <h2 className="section-h2 reveal" style={{ color:'#fff' }}>Open your <span className="grad-text">digital café today.</span></h2>
          <p className="section-sub reveal" style={{ color:'#4a7099' }}>
            14-day free trial. Setup takes less than a minute.
          </p>
          <div className="reg-card reveal">
            <RegistrationForm/>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <img src="/images/coffai1.png" alt="CoffAI"/>
            <span className="footer-logo-text grad-text">CoffAI</span>
          </div>
          <p className="footer-copy">The digital ordering platform for modern Tunisian cafés.</p>
          <p className="footer-copy">© 2026 CoffAI · Made in Tunisia 🇹🇳</p>
        </div>
      </footer>

      {/* ══ VIDEO MODAL ══ */}
      {isVideoOpen && (
        <div className="modal-overlay" onClick={() => setIsVideoOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">CoffAI — Product Demo</span>
              <button className="modal-close" onClick={() => setIsVideoOpen(false)}><X size={24}/></button>
            </div>
            <div className="modal-video">
              <div className="modal-play-btn"><Play size={30} color="#1bcbe0" style={{ marginLeft:3 }}/></div>
              <p className="modal-coming">Demo video coming soon — <a href="https://wa.me/" style={{ color:'#1bcbe0', fontWeight:700 }}>contact us on WhatsApp</a> for a live walkthrough</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── CSS ─────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

.coffai-root {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #f0f6ff;
  color: #0d1f3c;
  overflow-x: hidden;
  min-height: 100vh;
}
:root {
  --navy: #0d1f3c; --navy2: #132040; --blue: #1a6dd4; --cyan: #1bcbe0;
  --grad: linear-gradient(135deg,#1bcbe0 0%,#1a6dd4 100%);
  --bg: #f0f6ff; --bg2: #e6f0fb; --white: #ffffff;
  --text: #0d1f3c; --muted: #607898; --border: rgba(26,109,212,.14);
}
.grad-text { background:var(--grad); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

/* Reveal */
.reveal { opacity:0; transform:translateY(28px); transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1); }
.reveal.in-view { opacity:1; transform:translateY(0); }
.reveal:nth-child(2){transition-delay:.1s}
.reveal:nth-child(3){transition-delay:.18s}
.reveal:nth-child(4){transition-delay:.26s}

/* Nav */
.nav { position:fixed;top:0;width:100%;z-index:100;background:rgba(255,255,255,.9);backdrop-filter:blur(18px);border-bottom:1px solid var(--border); }
.nav-inner { max-width:1200px;margin:0 auto;padding:0 24px;height:68px;display:flex;align-items:center;justify-content:space-between; }
.nav-logo { display:flex;align-items:center;gap:10px; }
.nav-logo img { width:44px; }
.nav-logo-text { font-size:1.35rem;font-weight:800;letter-spacing:-.02em; }
.nav-links { display:flex;align-items:center;gap:36px; }
.nav-link { font-size:.82rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);cursor:pointer;transition:color .2s;background:none;border:none;font-family:inherit; }
.nav-link:hover { color:var(--blue); }
.nav-cta { background:var(--grad);color:#fff;font-weight:700;font-size:.88rem;padding:10px 24px;border-radius:999px;border:none;cursor:pointer;transition:all .25s;box-shadow:0 4px 20px rgba(27,203,224,.3);font-family:inherit; }
.nav-cta:hover { transform:translateY(-1px);box-shadow:0 8px 28px rgba(27,203,224,.45); }
.hamburger { background:none;border:none;cursor:pointer;color:var(--navy);display:none; }
.mobile-menu { background:#fff;border-top:1px solid var(--border);padding:20px 24px;display:flex;flex-direction:column;gap:16px; }
.mobile-menu .nav-link { text-align:left;font-size:.9rem;padding:4px 0; }
@media(max-width:768px){ .nav-links{display:none;} .hamburger{display:flex;} }

/* Hero */
.hero { min-height:100vh;background:var(--navy);display:flex;align-items:center;position:relative;overflow:hidden;padding-top:68px; }
.hero-bg { position:absolute;inset:0;pointer-events:none; }
.hero-blob { position:absolute;border-radius:50%;filter:blur(80px);opacity:.18; }
.blob1 { width:600px;height:600px;background:#1bcbe0;top:-100px;right:-80px;animation:blob-move1 12s ease-in-out infinite; }
.blob2 { width:500px;height:500px;background:#1a6dd4;bottom:-80px;left:-60px;animation:blob-move2 15s ease-in-out infinite; }
.blob3 { width:320px;height:320px;background:#1bcbe0;top:40%;left:30%;animation:blob-move3 10s ease-in-out infinite; }
@keyframes blob-move1{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-40px,30px) scale(1.1);}}
@keyframes blob-move2{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(30px,-40px) scale(1.08);}}
@keyframes blob-move3{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-20px,20px) scale(.9);}}
.hero-grid { position:absolute;inset:0;background-image:radial-gradient(rgba(27,203,224,.18) 1px,transparent 1px);background-size:36px 36px;pointer-events:none; }
.hero-inner { max-width:1200px;margin:0 auto;padding:60px 24px;display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:48px;position:relative;z-index:2; }
@media(max-width:768px){ .hero-inner{grid-template-columns:1fr;padding:40px 24px;} .hero-visual{display:none;} }
.hero-badge { display:inline-flex;align-items:center;gap:8px;background:rgba(27,203,224,.12);border:1px solid rgba(27,203,224,.28);color:#1bcbe0;font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:6px 14px;border-radius:999px;margin-bottom:24px; }
.hero-badge-dot { width:6px;height:6px;border-radius:50%;background:#1bcbe0;animation:blink 1.4s ease-in-out infinite; }
@keyframes blink{0%,100%{opacity:1;}50%{opacity:.2;}}
.hero-h1 { font-size:clamp(2.6rem,5vw,4rem);font-weight:800;line-height:1.1;letter-spacing:-.03em;color:#fff;margin:0 0 20px; }
.hero-sub { font-size:1.02rem;line-height:1.72;color:#7a9dc0;margin:0 0 36px;max-width:440px; }
.hero-btns { display:flex;gap:14px;flex-wrap:wrap;margin-bottom:48px; }
.btn-main { background:var(--grad);color:#fff;font-weight:700;font-size:.95rem;padding:14px 32px;border-radius:999px;border:none;cursor:pointer;transition:all .28s;box-shadow:0 6px 30px rgba(27,203,224,.38);display:flex;align-items:center;gap:8px;font-family:inherit; }
.btn-main:hover { transform:translateY(-2px);box-shadow:0 10px 40px rgba(27,203,224,.55); }
.btn-outline { background:transparent;color:#7a9dc0;font-weight:600;font-size:.95rem;padding:14px 28px;border-radius:999px;border:1px solid rgba(122,157,192,.3);cursor:pointer;transition:all .25s;display:flex;align-items:center;gap:8px;font-family:inherit; }
.btn-outline:hover { border-color:#1bcbe0;color:#1bcbe0;background:rgba(27,203,224,.06); }
.play-circle { width:26px;height:26px;border-radius:50%;border:1.5px solid rgba(27,203,224,.4);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.hero-stats { display:flex;gap:32px;flex-wrap:wrap;padding-top:24px;border-top:1px solid rgba(255,255,255,.08); }
.hero-stat-num { font-size:1.5rem;font-weight:800;line-height:1;margin-bottom:4px; }
.hero-stat-label { font-size:.7rem;color:#4a7099;font-weight:500;text-transform:uppercase;letter-spacing:.1em; }

/* Hero visual */
.hero-visual { position:relative;display:flex;align-items:center;justify-content:center; }
@keyframes float-a{0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);}}
@keyframes float-b{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
@keyframes float-c{0%,100%{transform:translateY(0) translateX(0);}50%{transform:translateY(-6px) translateX(4px);}}
.mock-main { background:rgba(255,255,255,.06);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:24px;width:340px;animation:float-a 6s ease-in-out infinite; }
.mock-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:20px; }
.mock-title { color:#fff;font-weight:700;font-size:.95rem; }
.mock-badge-live { background:rgba(27,203,224,.18);border:1px solid rgba(27,203,224,.35);color:#1bcbe0;font-size:.65rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:3px 10px;border-radius:999px;display:flex;align-items:center;gap:5px; }
.live-dot { width:5px;height:5px;border-radius:50%;background:#1bcbe0;animation:blink 1.2s ease-in-out infinite; }
.mock-bars { display:flex;flex-direction:column;gap:10px;margin-bottom:20px; }
.mock-bar-row { display:flex;align-items:center;gap:10px; }
.mock-bar-label { color:#7a9dc0;font-size:.72rem;width:72px;flex-shrink:0; }
.mock-bar-track { flex:1;height:7px;background:rgba(255,255,255,.07);border-radius:999px;overflow:hidden; }
.mock-bar-fill { height:100%;border-radius:999px;background:var(--grad); }
.mock-bar-val { color:#fff;font-size:.72rem;font-weight:700;width:28px;text-align:right; }
.mock-orders { display:flex;flex-direction:column;gap:8px; }
.mock-order { display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:10px 14px; }
.mock-order-info { display:flex;align-items:center;gap:10px; }
.mock-order-icon { width:30px;height:30px;border-radius:8px;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:.8rem; }
.mock-order-name { color:#c8dff0;font-size:.78rem;font-weight:600; }
.mock-order-table { color:#4a7099;font-size:.68rem;margin-top:1px; }
.mock-order-status { font-size:.65rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 9px;border-radius:999px; }
.status-new { background:rgba(27,203,224,.18);color:#1bcbe0; }
.status-ready { background:rgba(245,158,11,.18);color:#f59e0b; }
.status-done { background:rgba(52,211,153,.18);color:#34d399; }
.float-card { position:absolute;background:rgba(255,255,255,.08);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.14);border-radius:16px;padding:14px 18px; }
.float-card-a { top:-20px;right:-30px;min-width:150px;animation:float-b 5s ease-in-out infinite; }
.float-card-b { bottom:30px;left:-40px;min-width:140px;animation:float-c 7s ease-in-out infinite; }
.fc-label { color:#7a9dc0;font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px; }
.fc-val { color:#fff;font-size:1.3rem;font-weight:800;line-height:1; }
.fc-val span { font-size:.75rem;font-weight:500;color:#34d399;margin-left:4px; }
.fc-sub { color:#4a7099;font-size:.65rem;margin-top:3px; }
.qr-card { position:absolute;bottom:-10px;right:-20px;background:#fff;border-radius:14px;padding:12px;animation:float-b 8s ease-in-out infinite 1s;box-shadow:0 8px 32px rgba(0,0,0,.2); }
.qr-grid { width:60px;height:60px;display:grid;grid-template-columns:repeat(6,1fr);gap:2px; }
.qr-cell { border-radius:1px; }

/* Section shared */
.section { padding:100px 24px; }
.section-inner { max-width:1200px;margin:0 auto; }
.section-label { font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--blue);display:flex;align-items:center;gap:8px;margin-bottom:14px;justify-content:center; }
.section-label::before,.section-label::after { content:'';display:block;height:1px;width:28px;background:var(--grad); }
.section-h2 { font-size:clamp(2rem,4vw,2.9rem);font-weight:800;line-height:1.18;letter-spacing:-.02em;text-align:center;margin:0 0 14px;color:var(--navy); }
.section-sub { text-align:center;color:var(--muted);font-size:1.02rem;line-height:1.65;max-width:540px;margin:0 auto 56px; }

/* How it works */
.how-bg { background:var(--white); }
.steps { display:grid;grid-template-columns:repeat(3,1fr);gap:24px; }
@media(max-width:768px){ .steps{grid-template-columns:1fr;} }
.step-card { background:var(--bg);border:1px solid var(--border);border-radius:20px;padding:32px 28px;transition:all .35s cubic-bezier(.16,1,.3,1);position:relative;overflow:hidden; }
.step-card:hover { transform:translateY(-6px);border-color:rgba(27,203,224,.35);box-shadow:0 20px 50px rgba(26,109,212,.1); }
.step-num { position:absolute;top:20px;right:22px;font-size:4rem;font-weight:800;line-height:1;color:rgba(26,109,212,.07);letter-spacing:-.04em; }
.step-icon { width:52px;height:52px;border-radius:14px;background:var(--grad);display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 6px 20px rgba(27,203,224,.3); }
.step-title { font-size:1.1rem;font-weight:700;margin-bottom:10px;color:var(--navy); }
.step-desc { font-size:.88rem;line-height:1.65;color:var(--muted); }
.feature-grid { display:grid;grid-template-columns:1fr 1.4fr;background:var(--white);border:1px solid var(--border);border-radius:24px;overflow:hidden;box-shadow:0 12px 60px rgba(26,109,212,.07);margin-top:60px; }
@media(max-width:768px){ .feature-grid{grid-template-columns:1fr;} }
.feature-tabs { padding:28px;border-right:1px solid var(--border);background:var(--bg); }
.feature-tabs h4 { font-size:.7rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:16px; }
.ftab { width:100%;text-align:left;padding:13px 14px;border-radius:12px;margin-bottom:6px;border:1px solid transparent;cursor:pointer;background:none;display:flex;align-items:center;gap:12px;transition:all .2s;font-family:inherit; }
.ftab:hover { background:rgba(26,109,212,.05); }
.ftab.active { background:rgba(26,109,212,.08);border-color:rgba(26,109,212,.2); }
.ftab-icon { color:#b0c8e8;transition:color .2s; }
.ftab.active .ftab-icon { color:var(--blue); }
.ftab-label { font-size:.88rem;font-weight:600;color:var(--muted);transition:color .2s; }
.ftab.active .ftab-label { color:var(--navy); }
.feature-content { padding:40px;display:flex;flex-direction:column;justify-content:center; }
.fc-icon-wrap { width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,rgba(27,203,224,.15),rgba(26,109,212,.15));border:1px solid rgba(26,109,212,.2);display:flex;align-items:center;justify-content:center;margin-bottom:20px; }
.feature-content h3 { font-size:1.4rem;font-weight:800;margin-bottom:12px;color:var(--navy); }
.feature-content p { font-size:.92rem;line-height:1.72;color:var(--muted);margin-bottom:24px; }
.feat-bars { display:flex;flex-direction:column;gap:10px; }
.feat-bar-row { display:flex;align-items:center;gap:12px; }
.feat-bar-label { font-size:.75rem;color:var(--muted);width:130px;flex-shrink:0; }
.feat-bar-track { flex:1;height:6px;background:var(--bg2);border-radius:999px;overflow:hidden; }
.feat-bar-fill { height:100%;border-radius:999px;background:var(--grad);transition:width .6s ease; }

/* Why / Compare */
.why-bg { background:var(--navy); }
.compare-wrap { overflow-x:auto; }
.compare-table { min-width:560px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08); }
.compare-header { display:grid;grid-template-columns:1.4fr 1fr 1fr;background:rgba(255,255,255,.04);padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.08); }
.compare-col-head { font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#4a7099;text-align:center; }
.coffai-col { color:#1bcbe0 !important; }
.compare-row { display:grid;grid-template-columns:1.4fr 1fr 1fr;padding:12px 16px;align-items:center;gap:8px; }
.compare-row-alt { background:rgba(255,255,255,.02); }
.compare-feature { font-size:.82rem;font-weight:600;color:#c8dff0; }
.compare-old { font-size:.78rem;color:#4a7099;text-align:center; }
.compare-new { font-size:.78rem;color:#34d399;font-weight:600;text-align:center; }
.why-cards { display:grid;grid-template-columns:repeat(4,1fr);gap:20px; }
@media(max-width:900px){ .why-cards{grid-template-columns:repeat(2,1fr);} }
@media(max-width:500px){ .why-cards{grid-template-columns:1fr;} }
.why-card { background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:28px 24px;text-align:center;transition:all .35s cubic-bezier(.16,1,.3,1); }
.why-card:hover { transform:translateY(-6px);background:rgba(27,203,224,.06);border-color:rgba(27,203,224,.22); }
.why-icon { width:52px;height:52px;border-radius:14px;background:rgba(27,203,224,.12);border:1px solid rgba(27,203,224,.2);display:flex;align-items:center;justify-content:center;margin:0 auto 14px; }
.why-stat { font-size:2.4rem;font-weight:800;line-height:1;margin-bottom:6px; }
.why-label { font-size:.82rem;font-weight:700;color:#c8dff0;margin-bottom:8px; }
.why-desc { font-size:.78rem;color:#4a7099;line-height:1.6; }

/* Pricing */
.price-bg { background:var(--white); }
.billing-toggle { display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:40px; }
.toggle-track { width:44px;height:24px;border-radius:999px;border:none;cursor:pointer;position:relative;transition:background .3s;flex-shrink:0; }
.toggle-thumb { position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .25s cubic-bezier(.16,1,.3,1);display:block; }
.save-badge { display:inline-block;background:rgba(52,211,153,.15);color:#34d399;border:1px solid rgba(52,211,153,.3);font-size:.65rem;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:6px;letter-spacing:.06em; }
.price-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:24px;align-items:start; }
@media(max-width:900px){ .price-grid{grid-template-columns:1fr;max-width:420px;margin:0 auto;} }
.price-card { border:1px solid var(--border);border-radius:24px;padding:32px 28px;background:var(--bg);transition:all .35s cubic-bezier(.16,1,.3,1); }
.price-card:hover { transform:translateY(-6px);box-shadow:0 20px 50px rgba(26,109,212,.1); }
.price-card.popular { background:var(--navy);border-color:transparent;box-shadow:0 0 0 2.5px #1bcbe0,0 20px 60px rgba(27,203,224,.2);position:relative; }
.popular-badge { position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--grad);color:#fff;font-size:.68rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:5px 16px;border-radius:999px;white-space:nowrap; }
.price-tier { font-size:.7rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);margin-bottom:10px; }
.price-card.popular .price-tier { color:#1bcbe0; }
.price-amount { font-size:3rem;font-weight:800;line-height:1;margin-bottom:4px;color:var(--navy); }
.price-period { font-size:.82rem;color:var(--muted);margin-bottom:4px; }
.price-desc { font-size:.84rem;color:var(--muted);margin-bottom:16px;line-height:1.5; }
.price-divider { height:1px;background:var(--border);margin-bottom:20px; }
.price-features { display:flex;flex-direction:column;gap:10px;margin-bottom:28px; }
.price-feat { display:flex;align-items:flex-start;gap:9px;font-size:.84rem;color:var(--muted);line-height:1.4; }
.btn-price-main { width:100%;background:var(--grad);color:#fff;font-weight:700;font-size:.9rem;padding:13px;border-radius:999px;border:none;cursor:pointer;transition:all .25s;box-shadow:0 4px 20px rgba(27,203,224,.35);font-family:inherit; }
.btn-price-main:hover { transform:translateY(-1px);box-shadow:0 8px 30px rgba(27,203,224,.5); }
.btn-price-outline { width:100%;background:transparent;color:var(--blue);font-weight:700;font-size:.9rem;padding:13px;border-radius:999px;border:1.5px solid rgba(26,109,212,.3);cursor:pointer;transition:all .25s;font-family:inherit; }
.btn-price-outline:hover { border-color:var(--blue);background:rgba(26,109,212,.05); }

/* Register */
.reg-bg { background:var(--navy);position:relative;overflow:hidden; }
.reg-blob1 { position:absolute;width:400px;height:400px;border-radius:50%;background:#1bcbe0;opacity:.07;filter:blur(80px);top:-80px;right:-80px;pointer-events:none; }
.reg-blob2 { position:absolute;width:300px;height:300px;border-radius:50%;background:#1a6dd4;opacity:.07;filter:blur(70px);bottom:-60px;left:-60px;pointer-events:none; }
.reg-inner { max-width:600px;margin:0 auto;position:relative;z-index:2;text-align:center; }
.reg-card { background:rgba(255,255,255,.04);border:1px solid rgba(27,203,224,.2);border-radius:28px;padding:40px;box-shadow:0 0 0 1px rgba(27,203,224,.05),0 24px 60px rgba(0,0,0,.3);text-align:left; }

/* Footer */
.footer { background:#080f1e;border-top:1px solid rgba(27,203,224,.1);padding:32px 24px; }
.footer-inner { max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px; }
.footer-logo { display:flex;align-items:center;gap:10px; }
.footer-logo img { width:36px; }
.footer-logo-text { font-size:1.1rem;font-weight:800; }
.footer-copy { font-size:.78rem;color:#2a4a6a; }

/* Modal */
.modal-overlay { position:fixed;inset:0;z-index:200;background:rgba(8,15,30,.88);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:24px; }
.modal-box { background:#111d35;border:1px solid rgba(27,203,224,.2);border-radius:24px;padding:32px;max-width:720px;width:100%; }
.modal-header { display:flex;align-items:center;justify-content:space-between;margin-bottom:20px; }
.modal-title { font-size:1.2rem;font-weight:700;color:#fff; }
.modal-close { background:none;border:none;cursor:pointer;color:#4a7099; }
.modal-video { aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#0d1f3c;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px; }
.modal-play-btn { width:72px;height:72px;border-radius:50%;border:2px solid rgba(27,203,224,.3);display:flex;align-items:center;justify-content:center; }
.modal-coming { font-size:.84rem;color:#4a7099;text-align:center;padding:0 24px; }

@media(max-width:768px){
  .section { padding:72px 20px; }
  .compare-table { font-size:.78rem; }
}
`;