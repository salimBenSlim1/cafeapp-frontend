import { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function SuccessMessage({ setShowSuccess, message = 'Changes saved successfully' }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const exitTimer = setTimeout(() => dismiss(), 3000);
    return () => clearTimeout(exitTimer);
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => setShowSuccess(false), 350);
  };

  return (
    <>
      <style>{`
        @keyframes toast-in  { from { opacity:0; transform:translateY(12px) scale(.96); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes toast-out { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(8px) scale(.96); } }
        @keyframes toast-bar { from { width:100%; } to { width:0%; } }
        .toast-wrap { animation: toast-in .3s cubic-bezier(.16,1,.3,1) forwards; }
        .toast-wrap.out { animation: toast-out .35s cubic-bezier(.4,0,1,1) forwards; }
      `}</style>

      <div
        className={`toast-wrap${leaving ? ' out' : ''}`}
        style={{
          position: 'fixed',
          bottom: 28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 14px 11px 14px',
          borderRadius: 14,
          background: 'rgba(13,31,60,.92)',
          border: '1px solid rgba(52,211,153,.28)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,.35), 0 0 0 1px rgba(52,211,153,.08)',
          minWidth: 220,
          maxWidth: 340,
          overflow: 'hidden',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'rgba(52,211,153,.14)', border: '1px solid rgba(52,211,153,.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CheckCircle size={15} color="#34d399" strokeWidth={2.5} />
        </div>

        {/* Text */}
        <span style={{
          flex: 1, fontSize: '.855rem', fontWeight: 600,
          color: '#e8f4ff', fontFamily: 'Plus Jakarta Sans, sans-serif',
          letterSpacing: '.01em',
        }}>
          {message}
        </span>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 2,
            color: '#4a7099', display: 'flex', alignItems: 'center', flexShrink: 0,
            borderRadius: 6, transition: 'color .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#7a9dc0'}
          onMouseLeave={e => e.currentTarget.style.color = '#4a7099'}
        >
          <X size={14} />
        </button>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          height: 2, borderRadius: '0 0 14px 14px',
          background: 'linear-gradient(90deg, #34d399, #1bcbe0)',
          animation: 'toast-bar 3s linear forwards',
        }} />
      </div>
    </>
  );
}