import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, ChevronRight, Sparkles } from 'lucide-react';

const CAT_EMOJI = { coffee:'☕', food:'🍽️', drink:'🥤', dessert:'🍰', games:'🎲', smoking:'🚬' };

const QUICK_CHIPS = [
  { id: 'surprise',   text: 'Surprise me',        emoji: '✨' },
  { id: 'categories', text: 'Browse categories', emoji: '🏷️' },
];

function backChips() {
  return [
    { id: 'categories', text: 'Browse categories', emoji: '🏷️' },
    { id: 'home',       text: 'Main menu',          emoji: '🏠' },
  ];
}

/* ─── FAKE AI description — replace with real fetch when ready ── */
async function fetchAIDescription(product) {
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
  const fakes = [
    `A true crowd favourite — ${product.name} is crafted with care and served fresh every day. Rich, satisfying, and worth every dinar.`,
    `Indulge in our ${product.name}, a perfect balance of flavour and quality. One bite and you'll understand why it's a top pick.`,
    `${product.name} brings together the finest ingredients for an experience that lingers long after the last sip. Highly recommended.`,
    `Our ${product.name} is a signature offering — bold, refined, and exactly what you need right now.`,
  ];
  return fakes[Math.floor(Math.random() * fakes.length)];
}

/* ─── response engine ───────────────────────────────────────────────────────── */
function getResponse(id, products) {
  const lm    = id.toLowerCase().trim();
  const avail = products.filter(p => p.stock > 0);

  if (lm.startsWith('cat_')) {
    const cat   = lm.replace('cat_', '');
    const items = avail.filter(p => p.category === cat);
    if (!items.length) return { text: `No ${cat} items available right now.`, chips: backChips() };
    return { text: `Here are our ${CAT_EMOJI[cat] || ''} ${cat} options:`, items, chips: backChips() };
  }

  const pm = lm.match(/under\s+(\d+)/);
  if (pm) {
    const max   = parseFloat(pm[1]);
    const items = avail.filter(p => p.price <= max);
    if (!items.length) return { text: `Nothing under ${max} TND right now. Browse by category?`, chips: catChips(products) };
    return { text: `Items under ${max} TND:`, items, chips: backChips() };
  }

  if (lm === 'home' || /^(hi|hello|hey|start|menu)$/.test(lm))
    return { text: "Welcome ✦ What are you looking for today?", chips: QUICK_CHIPS };

  if (lm === 'categories' || lm === 'browse')
    return { text: "Choose a category:", chips: catChips(products) };

  if (lm === 'available')
    return { text: `We have ${avail.length} item${avail.length !== 1 ? 's' : ''} available right now:`, items: avail.slice(0, 6), chips: avail.length > 6 ? catChips(products) : backChips() };

  if (lm === 'cheap') {
    const sorted = [...avail].sort((a, b) => a.price - b.price);
    return { text: "Our most affordable picks:", items: sorted.slice(0, 5), chips: backChips() };
  }

  if (lm === 'surprise') {
    const premium = avail.filter(p => p.price > 10);
    const pool    = premium.length > 0 ? premium : avail;
    if (!pool.length) return { text: "Nothing available right now, sorry!", chips: QUICK_CHIPS };
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      aiProduct: item,
      items:     [item],
      chips: [
        { id: 'surprise', text: 'Show me another', emoji: '🎲' },
        ...backChips(),
      ],
    };
  }

  if (/\b(thank|thanks|merci|شكرا)\b/.test(lm))
    return { text: "Our pleasure ✦ Enjoy!", chips: [{ id: 'home', text: 'Back to menu', emoji: '🏠' }] };

  if (lm.length > 2) {
    const hits = avail.filter(p =>
      p.name.toLowerCase().includes(lm) ||
      (p.description && p.description.toLowerCase().includes(lm))
    );
    if (hits.length) return {
      text: `Found ${hits.length} result${hits.length > 1 ? 's' : ''} for "${lm}":`,
      items: hits.slice(0, 6),
      chips: backChips(),
    };
  }

  const fallback = avail.filter(p =>
    p.name.toLowerCase().includes(lm) ||
    (p.description && p.description.toLowerCase().includes(lm))
  );
  if (fallback.length) return { text: "Here's what I found:", items: fallback.slice(0, 5), chips: backChips() };

  return { text: "I can help you find something. Try one of these:", chips: QUICK_CHIPS };
}

function catChips(products) {
  const cats = [...new Set(products.map(p => p.category))];
  return [
    ...cats.map(c => ({
      id:    `cat_${c}`,
      text:  `${CAT_EMOJI[c] || ''} ${c.charAt(0).toUpperCase() + c.slice(1)}`,
      emoji: '',
    })),
    { id: 'home', text: 'Main menu', emoji: '🏠' },
  ];
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function ChatbotWaiter({ products = [] }) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const [hasNew, setHasNew]     = useState(false);
  const [booted, setBooted]     = useState(false);
  const bodyRef                 = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (!open && messages.length > 0 && messages.at(-1).from === 'bot') setHasNew(true);
  }, [messages, open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  /* ── Auto-surprise on first open ── */
  useEffect(() => {
    if (open && !booted && products.length > 0) {
      setBooted(true);
      // Show a brief greeting first, then immediately trigger surprise
      const greetId = `greet_${Date.now()}`;
      setMessages([{
        id:   greetId,
        from: 'bot',
        ts:   new Date(),
        text: "Hi ✦ Welcome! Let me pick something special for you…",
        chips: [],
      }]);
      setTyping(true);
      // After a short delay, fire the surprise
      setTimeout(() => {
        setTyping(false);
        _sendSurprise();
      }, 900);
    }
  }, [open, booted, products]);

  /* internal surprise trigger (no user message shown) */
  const _sendSurprise = useCallback(async () => {
    const avail   = products.filter(p => p.stock > 0);
    const premium = avail.filter(p => p.price > 10);
    const pool    = premium.length > 0 ? premium : avail;
    if (!pool.length) {
      setMessages(p => [...p, { id: Date.now()+'', from:'bot', ts:new Date(), text:"Nothing available right now, sorry!", chips:QUICK_CHIPS }]);
      return;
    }
    const item  = pool[Math.floor(Math.random() * pool.length)];
    const msgId = `ai_${Date.now()}`;
    setMessages(prev => [...prev, {
      id:      msgId,
      from:    'bot',
      ts:      new Date(),
      text:    null,
      items:   [item],
      chips: [
        { id: 'surprise', text: 'Show me another', emoji: '🎲' },
        ...backChips(),
      ],
      loading: true,
    }]);
    const desc = await fetchAIDescription(item);
    setMessages(p => p.map(m =>
      m.id === msgId ? { ...m, text: desc || `Here's a pick for you ✨`, loading: false } : m
    ));
  }, [products]);

  const send = useCallback(async (intentId, displayText) => {
    setMessages(p => [...p, { id: Date.now() + 'u', from: 'user', ts: new Date(), text: displayText }]);
    setTyping(true);

    const res = getResponse(intentId, products);

    if (res.aiProduct) {
      const product = res.aiProduct;
      delete res.aiProduct;
      const msgId = `ai_${Date.now()}`;
      setTimeout(() => {
        setMessages(p => [...p, {
          id:      msgId,
          from:    'bot',
          ts:      new Date(),
          text:    null,
          items:   res.items,
          chips:   res.chips,
          loading: true,
        }]);
        setTyping(false);
      }, 500);
      const desc = await fetchAIDescription(product);
      setMessages(p => p.map(m =>
        m.id === msgId ? { ...m, text: desc || `Here's a pick for you ✨`, loading: false } : m
      ));
      return;
    }

    setTimeout(() => {
      setMessages(p => [...p, { id: Date.now() + '', from: 'bot', ts: new Date(), ...res }]);
      setTyping(false);
    }, 650 + Math.random() * 300);

  }, [products]);

  const handleChip = (chip) => send(chip.id, chip.text);

  const handleSend = () => {
    const val = input.trim();
    if (!val) return;
    setInput('');
    send(val, val);
  };

  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isSurpriseMsg = (msg) =>
    msg.items?.length === 1 && 'loading' in msg;

  return (
    <>
      <style>{CSS}</style>

      {/* FAB */}
      <button
        className={`cw-fab${hasNew ? ' cw-fab-new' : ''}`}
        onClick={() => { setOpen(v => !v); setHasNew(false); }}
        aria-label="Chat assistant"
      >
        <div className="cw-fab-bg" />
        {open
          ? <X size={20} style={{ position: 'relative', zIndex: 1 }} />
          : <MessageCircle size={20} style={{ position: 'relative', zIndex: 1 }} />}
        {!open && hasNew && <span className="cw-notif" />}
      </button>

      {open && (
        <div className="cw-win">

          {/* header */}
          <div className="cw-head">
            <div className="cw-head-glow" />
            <div className="cw-head-av">
              <img src="/images/coffai1.png" alt="" className="cw-head-logo"
                onError={e => { e.target.style.display = 'none'; }} />
            </div>
            <div className="cw-head-info">
              <span className="cw-head-name">Menu Guide</span>
              <span className="cw-head-sub"><span className="cw-live-dot" />Online</span>
            </div>
            <button className="cw-head-close" onClick={() => setOpen(false)}><X size={15} /></button>
          </div>

          {/* body */}
          <div className="cw-body" ref={bodyRef}>
            {messages.map((msg, mi) => (
              <div
                key={msg.id}
                className={`cw-row${msg.from === 'user' ? ' cw-row-u' : ''}`}
                style={{ animationDelay: `${Math.min(mi * 0.03, 0.25)}s` }}
              >
                {msg.from === 'bot' && (
                  <div className="cw-av-bot"><Bot size={14} color="#e8b86d" /></div>
                )}

                <div className="cw-msg-col">

                  {/* ── surprise card ── */}
                  {isSurpriseMsg(msg) ? (
                    <div className="cw-surprise-card">
                      <div className="cw-surprise-badge">
                        <Sparkles size={11} />
                        <span>Featured pick · {msg.items[0].price.toFixed(2)} TND</span>
                      </div>
                      <div className="cw-surprise-img-wrap">
                        <img className="cw-surprise-img" src={msg.items[0].imageUrl} alt={msg.items[0].name} />
                        <div className="cw-surprise-img-overlay" />
                        <span className="cw-surprise-price-pill">
                          {msg.items[0].price.toFixed(2)}<small> TND</small>
                        </span>
                        {msg.items[0].category && (
                          <span className="cw-surprise-cat">
                            {CAT_EMOJI[msg.items[0].category] || '✦'}
                          </span>
                        )}
                      </div>
                      <div className="cw-surprise-info">
                        <p className="cw-surprise-name">{msg.items[0].name}</p>
                        {msg.loading ? (
                          <div className="cw-surprise-desc-loading">
                            <span className="cw-ai-dot" style={{ animationDelay: '0s' }} />
                            <span className="cw-ai-dot" style={{ animationDelay: '0.18s' }} />
                            <span className="cw-ai-dot" style={{ animationDelay: '0.36s' }} />
                            <span className="cw-ai-label">Writing description…</span>
                          </div>
                        ) : (
                          <p className="cw-surprise-desc">{msg.text}</p>
                        )}
                      </div>
                    </div>

                  ) : msg.text !== null && msg.text !== undefined ? (
                    <div className={`cw-bubble cw-bubble-${msg.from}`}>
                      <p className="cw-bubble-text">{msg.text}</p>
                    </div>
                  ) : null}

                  {/* regular product cards (not surprise) */}
                  {msg.items?.length > 0 && !isSurpriseMsg(msg) && (
                    <div className="cw-items">
                      {msg.items.map(p => (
                        <div key={p.id} className={`cw-item${!p.stock ? ' cw-item-oos' : ''}`}>
                          <div className="cw-item-img-wrap">
                            <img className="cw-item-img" src={p.imageUrl} alt={p.name} />
                            {!p.stock && <div className="cw-item-oos-veil"><span>Sold out</span></div>}
                          </div>
                          <div className="cw-item-body">
                            <span className="cw-item-name">{p.name}</span>
                            {p.description && <span className="cw-item-desc">{p.description}</span>}
                            <span className="cw-item-price">{p.price.toFixed(2)}<small> TND</small></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* chips */}
                  {msg.from === 'bot' && msg.chips?.length > 0 && (
                    <div className="cw-chips">
                      {msg.chips.map(chip => (
                        <button key={chip.id} className="cw-chip" onClick={() => handleChip(chip)}>
                          {chip.emoji && <span className="cw-chip-em">{chip.emoji}</span>}
                          <span>{chip.text}</span>
                          <ChevronRight size={11} className="cw-chip-arr" />
                        </button>
                      ))}
                    </div>
                  )}

                  <span className={`cw-ts${msg.from === 'user' ? ' cw-ts-r' : ''}`}>{fmt(msg.ts)}</span>
                </div>

                {msg.from === 'user' && (
                  <div className="cw-av-user"><User size={13} color="#1bcbe0" /></div>
                )}
              </div>
            ))}

            {typing && (
              <div className="cw-row">
                <div className="cw-av-bot"><Bot size={14} color="#e8b86d" /></div>
                <div className="cw-bubble cw-bubble-bot">
                  <div className="cw-typing">
                    {[0, 0.18, 0.36].map((d, i) => (
                      <span key={i} className="cw-td" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* input */}
          <div className="cw-input-row">
            <div className="cw-input-glow" />
            <input
              ref={inputRef}
              className="cw-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Search the menu or ask anything…"
            />
            <button className="cw-send" onClick={handleSend} disabled={!input.trim()}>
              <div className="cw-send-bg" />
              <Send size={15} style={{ position: 'relative', zIndex: 1 }} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const CSS = `
.cw-win {
  --bg:#07101e;--bg2:#0b1625;--sur:rgba(255,255,255,.04);--sur2:rgba(255,255,255,.08);
  --brd:rgba(255,255,255,.07);--cyan:#1bcbe0;--cyan2:#1a6dd4;--gold:#e8b86d;--gold2:#c9933a;
  --green:#34d399;--red:#f87171;--t:#ede7d6;--t2:#7a9ab8;--t3:#2b4460;
  --serif:'DM Serif Display',Georgia,serif;--sans:'DM Sans',system-ui,sans-serif;
  --ease:cubic-bezier(.16,1,.3,1);
}

@keyframes cw-win-in  { from{opacity:0;transform:translateY(18px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes cw-row-in  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes cw-dot     { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-5px);opacity:1} }
@keyframes cw-pulse   { 0%{box-shadow:0 6px 24px rgba(232,184,109,.28),0 0 0 0 rgba(232,184,109,.4)} 70%{box-shadow:0 6px 24px rgba(232,184,109,.28),0 0 0 13px rgba(232,184,109,0)} 100%{box-shadow:0 6px 24px rgba(232,184,109,.28),0 0 0 0 rgba(232,184,109,0)} }
@keyframes cw-live    { 0%{box-shadow:0 0 0 0 rgba(52,211,153,.5)} 70%{box-shadow:0 0 0 7px rgba(52,211,153,0)} 100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} }
@keyframes cw-notif   { 0%{box-shadow:0 0 0 0 rgba(27,203,224,.5)} 70%{box-shadow:0 0 0 6px rgba(27,203,224,0)} 100%{box-shadow:0 0 0 0 rgba(27,203,224,0)} }
@keyframes cw-shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes cw-card-in { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

.cw-fab{position:fixed;bottom:22px;right:22px;z-index:55;width:52px;height:52px;border-radius:50%;border:none;color:#07101e;display:flex;align-items:center;justify-content:center;transition:transform .2s var(--ease);overflow:hidden;}
.cw-fab-bg{position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,#e8b86d,#c9933a);box-shadow:0 6px 24px rgba(232,184,109,.28);transition:box-shadow .2s;}
.cw-fab:hover{transform:scale(1.08);}
.cw-fab:hover .cw-fab-bg{box-shadow:0 8px 32px rgba(232,184,109,.46);}
.cw-fab:active{transform:scale(.96);}
.cw-fab-new .cw-fab-bg{animation:cw-pulse 1.8s ease-out infinite;}
.cw-notif{position:absolute;top:-2px;right:-2px;width:12px;height:12px;border-radius:50%;background:var(--cyan);border:2px solid #07101e;animation:cw-notif 2.5s ease-out infinite;}

.cw-win{position:fixed;bottom:86px;right:14px;z-index:55;width:calc(100vw - 28px);max-width:360px;max-height:76svh;background:var(--bg2);border:1px solid var(--brd);border-radius:22px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 28px 70px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.04);animation:cw-win-in .3s var(--ease);font-family:var(--sans);}
@media(min-width:480px){.cw-win{right:22px;}}

.cw-head{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid var(--brd);background:rgba(232,184,109,.04);flex-shrink:0;position:relative;overflow:hidden;}
.cw-head-glow{position:absolute;top:-30px;left:50%;transform:translateX(-50%);width:180px;height:60px;background:radial-gradient(ellipse,rgba(232,184,109,.12) 0%,transparent 70%);pointer-events:none;}
.cw-head-av{width:38px;height:38px;border-radius:50%;flex-shrink:0;background:rgba(232,184,109,.08);border:1px solid rgba(232,184,109,.2);display:flex;align-items:center;justify-content:center;overflow:hidden;}
.cw-head-logo{width:28px;height:28px;object-fit:contain;}
.cw-head-info{display:flex;flex-direction:column;}
.cw-head-name{display:block;font-family:var(--serif);font-size:.98rem;background:linear-gradient(135deg,var(--gold) 0%,#f5d99a 50%,var(--gold2) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;line-height:1;}
.cw-head-sub{display:flex;align-items:center;gap:5px;font-size:.59rem;color:var(--t3);letter-spacing:.08em;text-transform:uppercase;margin-top:3px;}
.cw-live-dot{display:block;width:5px;height:5px;border-radius:50%;background:var(--green);animation:cw-live 2.5s ease-out infinite;}
.cw-head-close{width:27px;height:27px;border-radius:9px;margin-left:auto;background:var(--sur);border:1px solid var(--brd);color:var(--t3);display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.cw-head-close:hover{background:var(--sur2);color:var(--t2);}

.cw-body{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:12px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.05) transparent;}
.cw-body::-webkit-scrollbar{width:3px;}
.cw-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.06);border-radius:2px;}

.cw-row{display:flex;align-items:flex-end;gap:8px;animation:cw-row-in .32s var(--ease) both;}
.cw-row-u{flex-direction:row-reverse;}
.cw-msg-col{flex:1;max-width:90%;display:flex;flex-direction:column;gap:6px;}
.cw-av-bot{width:27px;height:27px;border-radius:50%;flex-shrink:0;background:rgba(232,184,109,.08);border:1px solid rgba(232,184,109,.18);display:flex;align-items:center;justify-content:center;}
.cw-av-user{width:25px;height:25px;border-radius:50%;flex-shrink:0;background:rgba(27,203,224,.1);border:1px solid rgba(27,203,224,.22);display:flex;align-items:center;justify-content:center;}

.cw-bubble{padding:10px 13px;border-radius:16px;}
.cw-bubble-bot{background:rgba(255,255,255,.05);border:1px solid var(--brd);color:var(--t2);border-bottom-left-radius:4px;}
.cw-bubble-user{background:linear-gradient(135deg,rgba(27,203,224,.18),rgba(26,109,212,.14));border:1px solid rgba(27,203,224,.2);color:var(--t);border-bottom-right-radius:4px;}
.cw-bubble-text{font-size:.82rem;line-height:1.65;margin:0;white-space:pre-line;}

.cw-typing{display:flex;align-items:center;gap:5px;padding:3px 2px;}
.cw-td{display:block;width:7px;height:7px;border-radius:50%;background:var(--t3);animation:cw-dot .65s ease-in-out infinite;}

.cw-surprise-card{border-radius:16px;overflow:hidden;border:1px solid rgba(232,184,109,.22);background:rgba(232,184,109,.04);animation:cw-card-in .4s var(--ease) both;}
.cw-surprise-badge{display:flex;align-items:center;gap:6px;padding:7px 12px;background:rgba(232,184,109,.1);border-bottom:1px solid rgba(232,184,109,.15);font-size:.62rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--gold);}
.cw-surprise-img-wrap{position:relative;width:100%;height:160px;overflow:hidden;}
.cw-surprise-img{width:100%;height:100%;object-fit:cover;transition:transform .5s var(--ease);}
.cw-surprise-card:hover .cw-surprise-img{transform:scale(1.05);}
.cw-surprise-img-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 40%,rgba(7,16,30,.85) 100%);pointer-events:none;}
.cw-surprise-price-pill{position:absolute;bottom:10px;left:12px;font-family:var(--serif);font-size:1.1rem;background:linear-gradient(135deg,var(--gold),var(--gold2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.cw-surprise-price-pill small{font-family:var(--sans);font-size:.58rem;-webkit-text-fill-color:rgba(232,184,109,.6);color:rgba(232,184,109,.6);}
.cw-surprise-cat{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:50%;background:rgba(7,16,30,.65);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:.82rem;backdrop-filter:blur(6px);}
.cw-surprise-info{padding:12px 13px 14px;}
.cw-surprise-name{display:block;font-family:var(--serif);font-size:1.05rem;background:linear-gradient(135deg,var(--gold) 0%,#f5d99a 60%,var(--gold2) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:7px;line-height:1.2;}
.cw-surprise-desc{font-size:.78rem;color:var(--t2);line-height:1.7;margin:0;animation:cw-row-in .3s var(--ease) both;}

.cw-surprise-desc-loading{display:flex;align-items:center;gap:7px;padding:4px 0;}
@keyframes cw-ai-dot{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
.cw-ai-dot{display:block;width:6px;height:6px;border-radius:50%;background:var(--gold);animation:cw-ai-dot .9s ease-in-out infinite;}
.cw-ai-label{font-size:.68rem;color:var(--t3);letter-spacing:.05em;background:linear-gradient(90deg,var(--t3) 0%,var(--gold2) 50%,var(--t3) 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:cw-shimmer 2s linear infinite;}

.cw-items{display:flex;flex-direction:column;gap:7px;}
.cw-item{display:flex;gap:10px;align-items:flex-start;background:rgba(255,255,255,.04);border:1px solid var(--brd);border-radius:12px;overflow:hidden;transition:border-color .2s;}
.cw-item:hover{border-color:rgba(232,184,109,.2);}
.cw-item-oos{opacity:.42;}
.cw-item-img-wrap{width:60px;height:60px;flex-shrink:0;position:relative;overflow:hidden;}
.cw-item-img{width:100%;height:100%;object-fit:cover;}
.cw-item-oos-veil{position:absolute;inset:0;background:rgba(7,16,30,.7);display:flex;align-items:center;justify-content:center;}
.cw-item-oos-veil span{font-size:.55rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--red);border:1px solid rgba(248,113,113,.3);padding:2px 6px;border-radius:999px;}
.cw-item-body{flex:1;padding:8px 10px 8px 0;display:flex;flex-direction:column;gap:3px;min-width:0;}
.cw-item-name{font-size:.79rem;font-weight:500;color:var(--t);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cw-item-desc{font-size:.7rem;color:var(--t3);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.cw-item-price{font-family:var(--serif);font-size:.95rem;background:linear-gradient(135deg,var(--gold),var(--gold2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.cw-item-price small{font-family:var(--sans);font-size:.57rem;-webkit-text-fill-color:var(--t3);color:var(--t3);}

.cw-chips{display:flex;flex-direction:column;gap:5px;}
.cw-chip{display:flex;align-items:center;gap:7px;padding:8px 11px;border-radius:10px;border:1px solid var(--brd);background:rgba(255,255,255,.035);color:var(--t2);font-size:.77rem;font-family:var(--sans);text-align:left;width:100%;transition:all .18s var(--ease);}
.cw-chip:hover{background:rgba(232,184,109,.07);border-color:rgba(232,184,109,.24);color:var(--gold);transform:translateX(3px);}
.cw-chip-em{font-size:.85rem;flex-shrink:0;}
.cw-chip-arr{margin-left:auto;flex-shrink:0;color:var(--t3);transition:transform .18s var(--ease),color .18s;}
.cw-chip:hover .cw-chip-arr{transform:translateX(2px);color:var(--gold);}

.cw-ts{font-size:.57rem;color:var(--t3);padding:0 3px;}
.cw-ts-r{text-align:right;}

.cw-input-row{display:flex;align-items:center;gap:8px;padding:10px 12px;border-top:1px solid var(--brd);background:rgba(7,16,30,.85);flex-shrink:0;position:relative;}
.cw-input-glow{position:absolute;top:0;left:50%;transform:translateX(-50%);width:200px;height:1px;background:linear-gradient(90deg,transparent,rgba(232,184,109,.18),transparent);pointer-events:none;}
.cw-input{flex:1;padding:9px 13px;border-radius:12px;border:1px solid var(--brd);background:var(--sur);color:var(--t);font-family:var(--sans);font-size:.82rem;outline:none;transition:border-color .2s,box-shadow .2s,background .2s;}
.cw-input::placeholder{color:var(--t3);}
.cw-input:focus{border-color:rgba(232,184,109,.3);box-shadow:0 0 0 3px rgba(232,184,109,.05);background:rgba(232,184,109,.02);}
.cw-send{width:36px;height:36px;border-radius:10px;border:none;color:#07101e;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;position:relative;transition:transform .18s var(--ease);}
.cw-send-bg{position:absolute;inset:0;background:linear-gradient(135deg,var(--gold),var(--gold2));transition:opacity .15s;}
.cw-send:hover:not(:disabled){transform:scale(1.07);}
.cw-send:disabled .cw-send-bg{opacity:.28;}
.cw-send:disabled{cursor:not-allowed;}
`;