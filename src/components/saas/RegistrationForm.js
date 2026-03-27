import { useEffect, useState } from 'react';
import { ChevronRight, AlertCircle, CheckCircle2, Shield, RefreshCw, Check, Zap, Star, Crown } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    nomCafe: '',
    nomPerson: '',
    email: '',
    phone: '',
    plan: 'starter',
    domaine: '',
  });
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    }
  }, [hash]);

  const [errors,           setErrors]           = useState({});
  const [captchaVerified,  setCaptchaVerified]  = useState(false);
  const [isSubmitting,     setIsSubmitting]     = useState(false);
  const [submitSuccess,    setSubmitSuccess]    = useState(false);
  const [captchaChallenge, setCaptchaChallenge] = useState({ num1: 0, num2: 0 });
  const [captchaAnswer,    setCaptchaAnswer]    = useState('');

  useEffect(() => { generateCaptcha(); }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaChallenge({ num1, num2 });
    setCaptchaAnswer('');
    setCaptchaVerified(false);
  };

  const verifyCaptcha = (answer) => {
    setCaptchaAnswer(answer);
    setCaptchaVerified(parseInt(answer) === captchaChallenge.num1 + captchaChallenge.num2);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData?.nomCafe?.trim())   newErrors.nomCafe   = 'Café name is required';
    if (!formData?.nomPerson?.trim()) newErrors.nomPerson = 'Owner name is required';
    if (!formData?.email?.trim())     newErrors.email     = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (formData?.phone && !/^[\d\s+()-]{8,}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number';
    if (!captchaVerified) newErrors.captcha = 'Please complete the verification';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    axios.post(`${process.env.REACT_APP_API_URL}/add-new-form`, formData)
      .then(() => { setIsSubmitting(false); setSubmitSuccess(true); })
      .catch(err => { console.log(err); setIsSubmitting(false); });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const plans = [
    {
      value:   'starter',
      name:    'Starter',
      price:   '49 TND',
      sub:     'Up to 20 tables',
      badge:   null,
      Icon:    Zap,
      accent:  'rgba(27,203,224,.8)',
      grad:    'linear-gradient(135deg,#1bcbe0,#1a6dd4)',
    },
    {
      value:   'pro',
      name:    'Pro',
      price:   '99 TND',
      sub:     'Unlimited tables + analytics',
      badge:   'Most Popular',
      Icon:    Star,
      accent:  '#1bcbe0',
      grad:    'linear-gradient(135deg,#1bcbe0,#1a6dd4)',
    },
    {
      value:   'premium',
      name:    'Premium',
      price:   '179 TND',
      sub:     'Multi-location + branding',
      badge:   'Premium',
      Icon:    Crown,
      accent:  '#a78bfa',
      grad:    'linear-gradient(135deg,#a78bfa,#7c3aed)',
      purple:  true,
    },
  ];

  /* ── Success screen ── */
  if (submitSuccess) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="rf-success">
          <div className="rf-success-icon">
            <CheckCircle2 size={40} color="#fff" />
          </div>
          <h3 className="rf-success-title">Registration Successful! 🎉</h3>
          <p className="rf-success-sub">Welcome to CoffAI, <strong>{formData.nomPerson}</strong>!</p>
          <p className="rf-success-note">
            We'll reach out at <span className="rf-success-email">{formData.email}</span> very soon.
          </p>
        </div>
      </>
    );
  }

  /* ── Form ── */
  return (
    <>
      <style>{STYLES}</style>
      <div className="rf-wrap">

        {/* Row 1 */}
        <div className="rf-row">
          <div className="rf-field">
            <label className="rf-label">Café name <span className="rf-req">*</span></label>
            <input
              type="text" name="nomCafe" value={formData.nomCafe}
              onChange={handleChange} placeholder="Ex: Arts Café"
              className={`rf-input ${errors.nomCafe ? 'rf-input-err' : ''}`}
            />
            {errors.nomCafe && <p className="rf-error"><AlertCircle size={13}/>{errors.nomCafe}</p>}
          </div>
          <div className="rf-field">
            <label className="rf-label">Owner name <span className="rf-req">*</span></label>
            <input
              type="text" name="nomPerson" value={formData.nomPerson}
              onChange={handleChange} placeholder="Ex: John Smith"
              className={`rf-input ${errors.nomPerson ? 'rf-input-err' : ''}`}
            />
            {errors.nomPerson && <p className="rf-error"><AlertCircle size={13}/>{errors.nomPerson}</p>}
          </div>
        </div>

        {/* Row 2 */}
        <div className="rf-row">
          <div className="rf-field">
            <label className="rf-label">Email <span className="rf-req">*</span></label>
            <input
              type="email" name="email" value={formData.email}
              onChange={handleChange} placeholder="contact@yourcafe.com"
              className={`rf-input ${errors.email ? 'rf-input-err' : ''}`}
            />
            {errors.email && <p className="rf-error"><AlertCircle size={13}/>{errors.email}</p>}
          </div>
          <div className="rf-field">
            <label className="rf-label">Phone <span className="rf-opt">(optional)</span></label>
            <input
              type="tel" name="phone" value={formData.phone}
              onChange={handleChange} placeholder="+216 XX XXX XXX"
              className={`rf-input ${errors.phone ? 'rf-input-err' : ''}`}
            />
            {errors.phone && <p className="rf-error"><AlertCircle size={13}/>{errors.phone}</p>}
          </div>
        </div>

        {/* Plan selector */}
        <div className="rf-field rf-field-full">
          <label className="rf-label">Choose your plan <span className="rf-req">*</span></label>
          <div className="rf-plans">
            {plans.map(plan => {
              const active = formData.plan === plan.value;
              return (
                <label
                  key={plan.value}
                  className={`rf-plan ${active ? (plan.purple ? 'rf-plan-active-prem' : 'rf-plan-active') : ''}`}
                  style={active ? { '--plan-glow': plan.purple ? 'rgba(124,58,237,.25)' : 'rgba(27,203,224,.2)' } : {}}
                >
                  <input
                    type="radio" name="plan" value={plan.value}
                    checked={active} onChange={handleChange}
                    className="rf-plan-radio"
                  />

                  {plan.badge && (
                    <span className={`rf-plan-badge ${plan.purple ? 'rf-plan-badge-prem' : ''}`}>
                      {plan.badge}
                    </span>
                  )}

                  {/* Icon */}
                  <div className="rf-plan-icon-wrap" style={{ background: plan.purple ? 'rgba(124,58,237,.15)' : 'rgba(27,203,224,.1)', borderColor: plan.purple ? 'rgba(167,139,250,.2)' : 'rgba(27,203,224,.2)' }}>
                    <plan.Icon size={16} style={{ color: plan.accent }}/>
                  </div>

                  <div className="rf-plan-top">
                    <span className="rf-plan-name">{plan.name}</span>
                    {active && (
                      <span className="rf-plan-check" style={{ background: plan.grad }}>
                        <Check size={11} color="#fff"/>
                      </span>
                    )}
                  </div>

                  <span className="rf-plan-price" style={{ backgroundImage: plan.grad }}>
                    {plan.price}
                    <span className="rf-plan-mo">/mo</span>
                  </span>
                  <span className="rf-plan-sub">{plan.sub}</span>

                  {/* Setup note */}
                  <span className="rf-plan-setup">+ 250 TND setup</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Captcha */}
        <div className="rf-field rf-field-full">
          <label className="rf-label">Anti-robot verification <span className="rf-req">*</span></label>
          <div className="rf-captcha">
            <div className="rf-captcha-box">
              <Shield size={18} color="#1a6dd4"/>
              <span className="rf-captcha-sum">{captchaChallenge.num1} + {captchaChallenge.num2} = ?</span>
            </div>
            <input
              type="number" value={captchaAnswer}
              onChange={e => verifyCaptcha(e.target.value)}
              placeholder="?"
              className={`rf-captcha-input ${captchaAnswer && !captchaVerified ? 'rf-input-err' : captchaVerified ? 'rf-input-ok' : ''}`}
            />
            <button type="button" onClick={generateCaptcha} className="rf-captcha-refresh" title="New challenge">
              <RefreshCw size={16}/>
            </button>
            {captchaVerified && (
              <div className="rf-captcha-verified"><CheckCircle2 size={16}/> Verified</div>
            )}
          </div>
          {errors.captcha && <p className="rf-error"><AlertCircle size={13}/>{errors.captcha}</p>}
        </div>

        {/* Trial note */}
        <p className="rf-trial-note">
          ✦ 14-day free trial — no credit card required
        </p>

        {/* Submit */}
        <button type="button" onClick={handleSubmit} disabled={isSubmitting} className={`rf-submit ${isSubmitting ? 'rf-submit-loading' : ''}`}>
          {isSubmitting ? (
            <span className="rf-submit-inner"><span className="rf-spinner"/>Registering…</span>
          ) : (
            <span className="rf-submit-inner">Create my digital café <ChevronRight size={18}/></span>
          )}
        </button>

      </div>
    </>
  );
}

/* ─── Styles ─── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  .rf-wrap {
    font-family: 'Plus Jakarta Sans', sans-serif;
    display: flex; flex-direction: column; gap: 20px;
  }

  .rf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 640px) { .rf-row { grid-template-columns: 1fr; } }

  .rf-field { display: flex; flex-direction: column; gap: 6px; }
  .rf-field-full { width: 100%; }

  .rf-label {
    font-size: .72rem; font-weight: 700; letter-spacing: .1em;
    text-transform: uppercase; color: #4a7099;
  }
  .rf-req { color: #f87171; margin-left: 2px; }
  .rf-opt { color: #2a4a6a; font-weight: 400; text-transform: none; letter-spacing: 0; font-size: .8rem; }

  .rf-input {
    width: 100%; padding: 11px 14px; border-radius: 12px;
    background: rgba(255,255,255,.04);
    border: 1px solid rgba(27,203,224,.14);
    color: #e8f4ff; font-size: .9rem; font-family: inherit;
    transition: border-color .2s, box-shadow .2s;
    outline: none; box-sizing: border-box;
  }
  .rf-input::placeholder { color: #2a4a6a; }
  .rf-input:focus { border-color: rgba(27,203,224,.5); box-shadow: 0 0 0 3px rgba(27,203,224,.08); }
  .rf-input-err { border-color: rgba(248,113,113,.5) !important; }
  .rf-input-ok  { border-color: rgba(52,211,153,.5)  !important; }

  .rf-error {
    display: flex; align-items: center; gap: 5px;
    font-size: .76rem; color: #f87171; margin-top: 2px;
  }

  /* ── Plans ── */
  .rf-plans { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-top: 4px; }
  @media (max-width: 600px) { .rf-plans { grid-template-columns: 1fr; } }

  .rf-plan {
    position: relative; display: flex; flex-direction: column;
    padding: 18px 16px 14px; border-radius: 16px; cursor: pointer;
    border: 1.5px solid rgba(27,203,224,.12);
    background: rgba(255,255,255,.03);
    transition: all .25s;
  }
  .rf-plan:hover { border-color: rgba(27,203,224,.3); background: rgba(27,203,224,.04); }

  .rf-plan-active {
    border-color: #1a6dd4 !important;
    background: rgba(26,109,212,.1) !important;
    box-shadow: 0 0 0 1px rgba(27,203,224,.15), 0 8px 24px var(--plan-glow, rgba(27,203,224,.2));
  }
  .rf-plan-active-prem {
    border-color: #7c3aed !important;
    background: rgba(124,58,237,.1) !important;
    box-shadow: 0 0 0 1px rgba(167,139,250,.15), 0 8px 24px var(--plan-glow, rgba(124,58,237,.2));
  }
  .rf-plan-radio { position: absolute; opacity: 0; width: 0; height: 0; }

  .rf-plan-badge {
    position: absolute; top: -11px; left: 50%; transform: translateX(-50%);
    font-size: .62rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase;
    padding: 3px 12px; border-radius: 999px; white-space: nowrap;
    background: linear-gradient(135deg,#1bcbe0,#1a6dd4); color: #fff;
  }
  .rf-plan-badge-prem { background: linear-gradient(135deg,#a78bfa,#7c3aed); }

  .rf-plan-icon-wrap {
    width: 34px; height: 34px; border-radius: 10px; border: 1px solid;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 10px; flex-shrink: 0;
  }

  .rf-plan-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
  .rf-plan-name { font-size: .9rem; font-weight: 700; color: #c8dff0; }
  .rf-plan-check {
    width: 20px; height: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  .rf-plan-price {
    font-size: 1.25rem; font-weight: 800; line-height: 1; margin-bottom: 4px;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .rf-plan-mo { font-size: .7rem; font-weight: 500; opacity: .75; }
  .rf-plan-sub  { font-size: .74rem; color: #4a7099; margin-bottom: 6px; line-height: 1.4; }
  .rf-plan-setup {
    font-size: .65rem; color: rgba(27,203,224,.45); font-weight: 600;
    border-top: 1px solid rgba(255,255,255,.05); padding-top: 6px; margin-top: 2px;
  }

  /* ── Captcha ── */
  .rf-captcha { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .rf-captcha-box {
    display: flex; align-items: center; gap: 10px;
    background: rgba(26,109,212,.08); border: 1px solid rgba(27,203,224,.2);
    padding: 10px 16px; border-radius: 12px;
    font-family: 'Courier New', monospace; font-size: 1rem; color: #c8dff0;
  }
  .rf-captcha-sum { font-weight: 700; letter-spacing: .06em; }
  .rf-captcha-input {
    width: 72px; padding: 10px; border-radius: 12px; text-align: center;
    background: rgba(255,255,255,.04); border: 1px solid rgba(27,203,224,.14);
    color: #e8f4ff; font-size: 1rem; font-family: inherit; outline: none;
    transition: border-color .2s;
  }
  .rf-captcha-input:focus { border-color: rgba(27,203,224,.5); }
  .rf-captcha-refresh {
    width: 40px; height: 40px; border-radius: 10px;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
    color: #4a7099; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all .2s; flex-shrink: 0;
  }
  .rf-captcha-refresh:hover { background: rgba(27,203,224,.1); color: #1bcbe0; border-color: rgba(27,203,224,.25); }
  .rf-captcha-verified {
    display: flex; align-items: center; gap: 6px;
    font-size: .78rem; font-weight: 600; color: #34d399;
  }

  /* Trial note */
  .rf-trial-note {
    text-align: center; font-size: .75rem; color: #2a4a6a; font-weight: 600;
    letter-spacing: .04em; margin: -4px 0;
  }

  /* ── Submit ── */
  .rf-submit {
    width: 100%; padding: 15px; border-radius: 14px; border: none; cursor: pointer;
    font-family: inherit; font-size: .95rem; font-weight: 700;
    background: linear-gradient(135deg,#1bcbe0,#1a6dd4);
    color: #fff; box-shadow: 0 6px 28px rgba(27,203,224,.35);
    transition: all .28s; margin-top: 4px;
  }
  .rf-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(27,203,224,.5); }
  .rf-submit:active:not(:disabled) { transform: translateY(0); }
  .rf-submit-loading { background: #1e3a5a !important; cursor: not-allowed; }
  .rf-submit-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }

  .rf-spinner {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.2); border-top-color: #fff;
    animation: rf-spin .7s linear infinite; flex-shrink: 0;
  }
  @keyframes rf-spin { to { transform: rotate(360deg); } }

  /* ── Success ── */
  .rf-success { font-family: 'Plus Jakarta Sans', sans-serif; text-align: center; padding: 48px 24px; }
  .rf-success-icon {
    width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 24px;
    background: linear-gradient(135deg,#34d399,#059669);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 32px rgba(52,211,153,.35);
    animation: rf-bounce .8s ease-out;
  }
  @keyframes rf-bounce {
    0%  { transform: scale(.5); opacity: 0; }
    70% { transform: scale(1.1); }
    100%{ transform: scale(1);  opacity: 1; }
  }
  .rf-success-title {
    font-size: 1.6rem; font-weight: 800; margin-bottom: 12px;
    background: linear-gradient(135deg,#1bcbe0,#1a6dd4);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .rf-success-sub   { font-size: 1.05rem; color: #c8dff0; margin-bottom: 8px; }
  .rf-success-note  { font-size: .88rem; color: #4a7099; }
  .rf-success-email { color: #1bcbe0; font-weight: 600; }
`;