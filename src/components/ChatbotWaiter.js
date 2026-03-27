import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, Coffee, Star, Tag, Zap, ChevronRight } from 'lucide-react';

/* ─── demo data (replace with real products prop) ───────────── */
const DEMO_PRODUCTS = [
  { id: 1,  name: 'Espresso Doppio',       price: 2.80,  category: 'coffee',  stock: 1, imageUrl: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=200&q=80', description: 'Double shot of our signature Ethiopian blend. Intense, syrupy, with notes of dark chocolate.', mood_tags: ['energizing'], flavor_tags: ['bitter','intense'], is_bestseller: true,  caffeine_level: 'high',   pairs_with: [3] },
  { id: 2,  name: 'Café Crème',            price: 3.50,  category: 'coffee',  stock: 1, imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200&q=80', description: 'Espresso crowned with silky microfoam. Our most ordered drink on weekend mornings.', mood_tags: ['comforting'], flavor_tags: ['creamy','smooth'], is_bestseller: true,  caffeine_level: 'medium', pairs_with: [7] },
  { id: 3,  name: 'Matcha Latte Glacé',    price: 5.90,  category: 'coffee',  stock: 1, imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=200&q=80', description: 'Ceremonial-grade Japanese matcha, oat milk, a whisper of vanilla. Vegan & lactose-free.', mood_tags: ['calming'], flavor_tags: ['earthy','sweet'], is_bestseller: false, caffeine_level: 'low',    dietary_labels: ['vegan','lactose-free'], pairs_with: [8] },
  { id: 4,  name: 'Cold Brew Reserve',     price: 4.80,  category: 'coffee',  stock: 1, imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=200&q=80', description: '18-hour slow-steeped single origin. Served over crystal ice. Smooth, never acidic.', mood_tags: ['energizing'], flavor_tags: ['smooth','bold'], is_bestseller: false, caffeine_level: 'high',   hidden_gem: true },
  { id: 5,  name: 'Cappuccino Classique',  price: 3.20,  category: 'coffee',  stock: 1, imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=200&q=80', description: 'Equal thirds espresso, steamed milk, dense foam. Exactly as it should be.', mood_tags: ['comforting'], flavor_tags: ['creamy','balanced'], is_bestseller: false, caffeine_level: 'medium' },
  { id: 6,  name: 'Smoothie Mangue',       price: 4.50,  category: 'drink',   stock: 1, imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=200&q=80', description: 'Alphonso mango, passion fruit, hint of lime. No dairy, no caffeine, pure tropics.', mood_tags: ['refreshing'], flavor_tags: ['fruity','sweet'], dietary_labels: ['vegan','caffeine-free'], caffeine_level: 'none' },
  { id: 7,  name: 'Croissant au Beurre',   price: 3.20,  category: 'food',    stock: 1, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&q=80', description: 'Flown in butter, 72-hour laminated dough. Shatters on first bite.', mood_tags: ['comforting'], flavor_tags: ['buttery','flaky'] },
  { id: 8,  name: 'Tarte Citron',          price: 4.20,  category: 'dessert', stock: 1, imageUrl: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=200&q=80', description: 'Sharp lemon curd in a crisp shortcrust shell, topped with Italian meringue.', mood_tags: ['refreshing'], flavor_tags: ['tangy','sweet'] },
  { id: 9,  name: 'Plateau Fromages',      price: 8.90,  category: 'food',    stock: 0, imageUrl: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=200&q=80', description: 'Seasonal selection of 4 cheeses, honeycomb, house-pickled grapes.', mood_tags: ['relaxing'], flavor_tags: ['savory','rich'] },
  { id: 10, name: 'Chess & Backgammon',    price: 2.00,  category: 'games',   stock: 1, imageUrl: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=200&q=80', description: 'Rent a premium wooden set for your table. Includes a complimentary mint tea.', mood_tags: ['relaxing'], flavor_tags: [] },
];

const CAT_EMOJI = { coffee:'☕', food:'🍽️', drink:'🥤', dessert:'🍰', games:'🎲', smoking:'🚬' };

/* ─── quick-reply chips shown at start ─────────────────────── */
const QUICK_CHIPS = [
  { id: 'bestsellers', text: 'What\'s popular?',    emoji: '🔥' },
  { id: 'surprise',    text: 'Surprise me',          emoji: '✨' },
  { id: 'nodairy',     text: 'No dairy options',     emoji: '🌿' },
  { id: 'deals',       text: 'Any combos / deals?',  emoji: '🎁' },
  { id: 'energy',      text: 'I need energy',        emoji: '⚡' },
  { id: 'chill',       text: 'Something relaxing',   emoji: '🌙' },
];

/* ─── response engine ───────────────────────────────────────── */
function getResponse(id, products) {
  const lm    = id.toLowerCase().trim();
  const avail = products.filter(p => p.stock > 0);

  /* category drill-down */
  if (lm.startsWith('cat_')) {
    const cat   = lm.replace('cat_', '');
    const items = avail.filter(p => p.category === cat);
    if (!items.length) return { text: `No ${cat} items available right now. Try another?`, chips: defaultChips() };
    return { text: `Here are our ${cat} options ✦`, items: items.slice(0, 5), chips: backChips() };
  }

  /* price search */
  const pm = lm.match(/under\s+(\d+)/);
  if (pm) {
    const max = parseFloat(pm[1]);
    const items = avail.filter(p => p.price <= max);
    if (!items.length) return { text: `Nothing under ${max} TND right now. Want to browse by category?`, chips: catChips(products) };
    return { text: `Great picks under ${max} TND:`, items: items.slice(0, 5), chips: backChips() };
  }

  /* name search */
  const nameMatch = avail.filter(p => p.name.toLowerCase().includes(lm));
  if (nameMatch.length && lm.length > 2)
    return { text: `Found ${nameMatch.length} result${nameMatch.length > 1 ? 's' : ''}:`, items: nameMatch.slice(0, 5), chips: backChips() };

  /* intents */
  if (lm === 'home' || lm.match(/^(hi|hello|hey|start|menu)$/))
    return { text: "Welcome back ✦ What are you in the mood for today?", chips: QUICK_CHIPS };

  if (lm === 'categories' || lm === 'browse')
    return { text: "Choose a category to explore:", chips: catChips(products) };

  if (lm === 'bestsellers' || lm.match(/\b(popular|best|top|most ordered)\b/)) {
    const items = avail.filter(p => p.is_bestseller);
    return { text: "Our most loved items right now 🔥", items: items.length ? items : avail.slice(0, 4), chips: backChips() };
  }

  if (lm === 'surprise') {
    const gems = avail.filter(p => p.hidden_gem || p.curator_pick);
    const pool = gems.length ? gems : avail;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      text: `Here's something not everyone orders — but those who do, always come back for it:`,
      items: [item],
      chips: [{ id: 'surprise', text: 'Try again ✦', emoji: '🎲' }, ...backChips()],
    };
  }

  if (lm === 'nodairy' || lm.match(/\b(dairy|lactose|vegan|plant)\b/)) {
    const items = avail.filter(p => p.dietary_labels?.some(d => ['vegan','lactose-free'].includes(d)));
    if (!items.length) return { text: "I'll check our full menu — ask our staff about dairy-free customizations too!", chips: backChips() };
    return { text: "Dairy-free options you'll love 🌿", items, chips: backChips() };
  }

  if (lm === 'energy' || lm.match(/\b(energy|wake|caffeine|kick|boost)\b/)) {
    const items = avail.filter(p => p.caffeine_level === 'high' || p.caffeine_level === 'medium');
    return { text: "These will wake you right up ⚡", items: items.slice(0, 4), chips: backChips() };
  }

  if (lm === 'chill' || lm.match(/\b(relax|calm|chill|unwind|slow)\b/)) {
    const items = avail.filter(p => p.mood_tags?.includes('calming') || p.mood_tags?.includes('relaxing') || p.caffeine_level === 'none' || p.caffeine_level === 'low');
    return { text: "Perfect for slowing down 🌙", items: items.slice(0, 4), chips: backChips() };
  }

  if (lm === 'deals' || lm.match(/\b(deal|combo|promo|offer|discount)\b/)) {
    return {
      text: "Today's offers ✦",
      promos: [
        { title: 'Morning Combo', desc: 'Café Crème + Croissant au Beurre — 5.90 TND (save 1 TND)', tag: 'Until 11:00', color: 'gold' },
        { title: 'Student Discount', desc: 'Show your student card — 15% off any cold drink, every day.', tag: 'Ongoing', color: 'cyan' },
        { title: 'Loyalty — 5th drink free', desc: 'Ask us to stamp your card. No app needed.', tag: 'Always', color: 'green' },
      ],
      chips: backChips(),
    };
  }

  if (lm.match(/\b(thank|thanks|merci|شكرا)\b/))
    return { text: "Pleasure is ours ✦ Enjoy every sip ☕", chips: [{ id: 'home', text: 'Back to menu', emoji: '🏠' }] };

  /* fallback */
  return {
    text: "I can help you find the perfect order. Try one of these:",
    chips: QUICK_CHIPS,
  };
}

function catChips(products) {
  const cats = [...new Set(products.map(p => p.category))];
  return [
    ...cats.map(c => ({ id: `cat_${c}`, text: (CAT_EMOJI[c] || '') + ' ' + c.charAt(0).toUpperCase() + c.slice(1), emoji: '' })),
    { id: 'home', text: 'Main menu', emoji: '🏠' },
  ];
}
function backChips() {
  return [
    { id: 'categories', text: 'Browse categories', emoji: '🏷️' },
    { id: 'home',       text: 'Main menu',          emoji: '🏠' },
  ];
}
function defaultChips() { return QUICK_CHIPS; }

/* ════════════════════════════════════════════════════════════ */
export default function ChatbotWaiter({ products }) {
  const [open, setOpen]         = useState(false);
  const [showWelcome, setWelcome] = useState(true);
  const [messages, setMessages] = useState([{
    id: '0', from: 'bot', ts: new Date(),
    text: "Welcome ✦ I'm Alex, your personal guide to everything on our menu. What are you in the mood for?",
    chips: QUICK_CHIPS,
  }]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const bodyRef             = useRef(null);
  const inputRef            = useRef(null);

  /* welcome splash */
  useEffect(() => {
    if (sessionStorage.getItem('coffai_alex_seen')) { setWelcome(false); return; }
    const t = setTimeout(() => { setWelcome(false); sessionStorage.setItem('coffai_alex_seen', '1'); }, 3200);
    return () => clearTimeout(t);
  }, []);

  /* scroll to bottom */
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  /* new message badge */
  useEffect(() => {
    if (!open && messages.length > 1 && messages.at(-1).from === 'bot') setHasNew(true);
  }, [messages, open]);

  /* focus input on open */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const pushBot = useCallback((res) => {
    setMessages(p => [...p, { id: Date.now() + '', from: 'bot', ts: new Date(), ...res }]);
    setTyping(false);
  }, []);

  const send = useCallback((intentId, displayText) => {
    setMessages(p => [...p, { id: Date.now() + 'u', from: 'user', ts: new Date(), text: displayText }]);
    setTyping(true);
    const delay = 650 + Math.random() * 350;
    setTimeout(() => pushBot(getResponse(intentId, products)), delay);
  }, [products, pushBot]);

  const handleChip  = (chip) => send(chip.id, chip.text);
  const handleSend  = () => {
    const val = input.trim();
    if (!val) return;
    setInput('');
    setMessages(p => [...p, { id: Date.now() + 'u', from: 'user', ts: new Date(), text: val }]);
    setTyping(true);
    setTimeout(() => pushBot(getResponse(val, products)), 750 + Math.random() * 350);
  };

  const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <style>{CSS}</style>

      {/* ── welcome splash ─────────────────────────────────────── */}
      {showWelcome && (
        <div className="cw-welcome">
          <div className="cw-welcome-orb cw-wo1" />
          <div className="cw-welcome-orb cw-wo2" />
          <div className="cw-welcome-card">
            <div className="cw-welcome-ring">
              <img src="/images/coffai1.png" alt="CoffAI" className="cw-welcome-logo" />
              <div className="cw-ring-spin" />
              <div className="cw-ring-spin cw-ring-spin2" />
            </div>
            <h2 className="cw-welcome-h">Hi, I'm Alex</h2>
            <p className="cw-welcome-p">Your personal guide to our menu — ask me anything about what we serve.</p>
            <div className="cw-welcome-dots">
              {[0, 0.2, 0.4].map((d, i) => <span key={i} className="cw-wd" style={{ animationDelay: `${d}s` }} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── FAB ────────────────────────────────────────────────── */}
      <button
        className={`cw-fab${hasNew ? ' cw-fab-new' : ''}`}
        onClick={() => { setOpen(v => !v); setHasNew(false); }}
        aria-label="Chat with Alex"
      >
        <div className="cw-fab-bg" />
        {open
          ? <X size={20} style={{ position: 'relative', zIndex: 1 }} />
          : <MessageCircle size={20} style={{ position: 'relative', zIndex: 1 }} />}
        {!open && hasNew && <span className="cw-notif" />}
      </button>

      {/* ── chat window ────────────────────────────────────────── */}
      {open && (
        <div className="cw-win">

          {/* header */}
          <div className="cw-head">
            <div className="cw-head-glow" />
            <div className="cw-head-av">
              <img src="/images/coffai1.png" alt="" className="cw-head-logo" onError={e => { e.target.style.display='none'; }} />
              <Bot size={18} color="#e8b86d" className="cw-head-bot-icon" />
            </div>
            <div className="cw-head-info">
              <span className="cw-head-name">Alex</span>
              <span className="cw-head-sub">
                <span className="cw-live-dot" />
                Menu Guide · Online
              </span>
            </div>
            <button className="cw-head-close" onClick={() => setOpen(false)}>
              <X size={15} />
            </button>
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
                  <div className="cw-av-bot">
                    <Bot size={14} color="#e8b86d" />
                  </div>
                )}

                <div className="cw-msg-col">
                  {/* text bubble */}
                  <div className={`cw-bubble cw-bubble-${msg.from}`}>
                    <p className="cw-bubble-text">{msg.text}</p>
                  </div>

                  {/* product cards */}
                  {msg.items?.length > 0 && (
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
                            <div className="cw-item-foot">
                              <span className="cw-item-price">{p.price.toFixed(2)}<small> TND</small></span>
                              {p.is_bestseller && <span className="cw-item-badge cw-item-badge-hot">🔥 Popular</span>}
                              {p.hidden_gem && <span className="cw-item-badge cw-item-badge-gem">✦ Hidden gem</span>}
                            </div>
                            {p.flavor_tags?.length > 0 && (
                              <div className="cw-item-tags">
                                {p.flavor_tags.map(t => <span key={t} className="cw-ftag">{t}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* promo cards */}
                  {msg.promos?.length > 0 && (
                    <div className="cw-promos">
                      {msg.promos.map((pr, pi) => (
                        <div key={pi} className={`cw-promo cw-promo-${pr.color}`}>
                          <div className="cw-promo-title">{pr.title}</div>
                          <div className="cw-promo-desc">{pr.desc}</div>
                          <div className="cw-promo-tag">{pr.tag}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* quick-reply chips */}
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
                  <div className="cw-av-user">
                    <User size={13} color="#1bcbe0" />
                  </div>
                )}
              </div>
            ))}

            {/* typing indicator */}
            {typing && (
              <div className="cw-row">
                <div className="cw-av-bot"><Bot size={14} color="#e8b86d" /></div>
                <div className="cw-bubble cw-bubble-bot">
                  <div className="cw-typing">
                    {[0, 0.18, 0.36].map((d, i) => <span key={i} className="cw-td" style={{ animationDelay: `${d}s` }} />)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* input bar */}
          <div className="cw-input-row">
            <div className="cw-input-glow" />
            <input
              ref={inputRef}
              className="cw-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask anything about our menu…"
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

/* ─── CSS ─────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

/* ── CSS tokens matching UserOrderPage ── */
.cw-win,
.cw-welcome {
  --bg:   #07101e;
  --bg2:  #0b1625;
  --bg3:  #0e1d30;
  --sur:  rgba(255,255,255,.04);
  --sur2: rgba(255,255,255,.08);
  --brd:  rgba(255,255,255,.07);
  --brd2: rgba(255,255,255,.13);
  --cyan: #1bcbe0;
  --cyan2:#1a6dd4;
  --gold: #e8b86d;
  --gold2:#c9933a;
  --green:#34d399;
  --red:  #f87171;
  --t:    #ede7d6;
  --t2:   #7a9ab8;
  --t3:   #2b4460;
  --serif:'DM Serif Display', Georgia, serif;
  --sans: 'DM Sans', system-ui, sans-serif;
  --ease: cubic-bezier(.16,1,.3,1);
  --r:    14px;
}

/* ══ WELCOME SPLASH ══════════════════════════════════════════ */
.cw-welcome {
  position:fixed; inset:0; z-index:200;
  background:rgba(7,16,30,.96);
  backdrop-filter:blur(20px);
  display:flex; align-items:center; justify-content:center; padding:28px;
  animation:cw-fadein .4s ease;
  overflow:hidden;
  font-family:var(--sans);
}
.cw-welcome-orb {
  position:absolute; border-radius:50%; filter:blur(110px); pointer-events:none;
}
.cw-wo1 { width:500px;height:500px;background:var(--cyan);opacity:.055;top:-160px;right:-100px; }
.cw-wo2 { width:440px;height:440px;background:var(--gold);opacity:.04;bottom:-120px;left:-80px; }

.cw-welcome-card { position:relative;z-index:1;text-align:center;max-width:300px; }
.cw-welcome-ring {
  width:112px;height:112px;border-radius:50%;margin:0 auto 26px;
  background:rgba(232,184,109,.07);
  border:1px solid rgba(232,184,109,.18);
  display:flex;align-items:center;justify-content:center;
  position:relative;
}
.cw-welcome-logo { width:56px;height:56px;object-fit:contain;position:relative;z-index:2; }
.cw-ring-spin {
  position:absolute; inset:-14px; border-radius:50%;
  border:1px dashed rgba(232,184,109,.22);
  animation:cw-spin 14s linear infinite;
}
.cw-ring-spin2 {
  inset:-24px;
  border-color:rgba(27,203,224,.12);
  animation-duration:22s; animation-direction:reverse;
}
@keyframes cw-spin { to { transform:rotate(360deg); } }
@keyframes cw-fadein { from{opacity:0} to{opacity:1} }
@keyframes cw-bouncein {
  0%{transform:scale(.3);opacity:0}
  70%{transform:scale(1.06)}
  100%{transform:scale(1);opacity:1}
}
@keyframes cw-win-in {
  from{opacity:0;transform:translateY(18px) scale(.96)}
  to{opacity:1;transform:translateY(0) scale(1)}
}
@keyframes cw-row-in {
  from{opacity:0;transform:translateY(10px)}
  to{opacity:1;transform:translateY(0)}
}
@keyframes cw-dot {
  0%,100%{transform:translateY(0);opacity:.4}
  50%{transform:translateY(-5px);opacity:1}
}
@keyframes cw-pulse {
  0%{box-shadow:0 6px 24px rgba(232,184,109,.28),0 0 0 0 rgba(232,184,109,.4)}
  70%{box-shadow:0 6px 24px rgba(232,184,109,.28),0 0 0 13px rgba(232,184,109,0)}
  100%{box-shadow:0 6px 24px rgba(232,184,109,.28),0 0 0 0 rgba(232,184,109,0)}
}
@keyframes cw-live {
  0%{box-shadow:0 0 0 0 rgba(52,211,153,.5)}
  70%{box-shadow:0 0 0 7px rgba(52,211,153,0)}
  100%{box-shadow:0 0 0 0 rgba(52,211,153,0)}
}
@keyframes cw-notif {
  0%{box-shadow:0 0 0 0 rgba(27,203,224,.5)}
  70%{box-shadow:0 0 0 6px rgba(27,203,224,0)}
  100%{box-shadow:0 0 0 0 rgba(27,203,224,0)}
}

.cw-welcome-h {
  font-family:var(--serif);font-size:2.1rem;
  color:var(--t);margin-bottom:10px;line-height:1.1;
}
.cw-welcome-p {
  font-size:.87rem;color:var(--t2);line-height:1.75;margin-bottom:24px;
}
.cw-welcome-dots { display:flex;gap:7px;justify-content:center; }
.cw-wd {
  display:block;width:8px;height:8px;border-radius:50%;
  background:var(--gold);
  animation:cw-dot 1s ease-in-out infinite;
}

/* ══ FAB ═════════════════════════════════════════════════════ */
.cw-fab {
  position:fixed;bottom:22px;right:22px;z-index:55;
  width:52px;height:52px;border-radius:50%;border:none;
  color:#07101e;
  display:flex;align-items:center;justify-content:center;
  transition:transform .2s var(--ease);
  overflow:hidden;
}
.cw-fab-bg {
  position:absolute;inset:0;border-radius:50%;
  background:linear-gradient(135deg,#e8b86d,#c9933a);
  box-shadow:0 6px 24px rgba(232,184,109,.28);
  transition:box-shadow .2s;
}
.cw-fab:hover { transform:scale(1.08); }
.cw-fab:hover .cw-fab-bg { box-shadow:0 8px 32px rgba(232,184,109,.46); }
.cw-fab:active { transform:scale(.96); }
.cw-fab-new .cw-fab-bg { animation:cw-pulse 1.8s ease-out infinite; }
.cw-notif {
  position:absolute;top:-2px;right:-2px;
  width:12px;height:12px;border-radius:50%;
  background:var(--cyan);border:2px solid var(--bg);
  animation:cw-notif 2.5s ease-out infinite;
}

/* ══ WINDOW ══════════════════════════════════════════════════ */
.cw-win {
  position:fixed;bottom:86px;right:14px;z-index:55;
  width:calc(100vw - 28px);max-width:360px;
  max-height:76svh;
  background:var(--bg2);
  border:1px solid var(--brd);
  border-radius:22px;
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 28px 70px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.04);
  animation:cw-win-in .3s var(--ease);
  font-family:var(--sans);
}
@media(min-width:480px){.cw-win{right:22px;}}

/* ══ HEADER ══════════════════════════════════════════════════ */
.cw-head {
  display:flex;align-items:center;gap:10px;padding:12px 14px;
  border-bottom:1px solid var(--brd);
  background:rgba(232,184,109,.04);
  flex-shrink:0;position:relative;overflow:hidden;
}
.cw-head-glow {
  position:absolute;top:-30px;left:50%;transform:translateX(-50%);
  width:180px;height:60px;
  background:radial-gradient(ellipse,rgba(232,184,109,.12) 0%,transparent 70%);
  pointer-events:none;
}
.cw-head-av {
  width:38px;height:38px;border-radius:50%;flex-shrink:0;
  background:rgba(232,184,109,.08);
  border:1px solid rgba(232,184,109,.2);
  display:flex;align-items:center;justify-content:center;
  position:relative;overflow:hidden;
}
.cw-head-logo {
  width:28px;height:28px;object-fit:contain;position:relative;z-index:1;
}
.cw-head-bot-icon { display:none; }
.cw-head-logo[style*="none"] + .cw-head-bot-icon { display:flex; }

.cw-head-name {
  display:block;
  font-family:var(--serif);font-size:.98rem;
  background:linear-gradient(135deg,var(--gold) 0%,#f5d99a 50%,var(--gold2) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  line-height:1;
}
.cw-head-sub {
  display:flex;align-items:center;gap:5px;
  font-size:.59rem;color:var(--t3);letter-spacing:.08em;text-transform:uppercase;margin-top:3px;
}
.cw-live-dot {
  display:block;width:5px;height:5px;border-radius:50%;
  background:var(--green);animation:cw-live 2.5s ease-out infinite;
}
.cw-head-close {
  width:27px;height:27px;border-radius:9px;margin-left:auto;
  background:var(--sur);border:1px solid var(--brd);
  color:var(--t3);display:flex;align-items:center;justify-content:center;
  flex-shrink:0;transition:all .15s;
}
.cw-head-close:hover { background:var(--sur2);color:var(--t2); }

/* ══ BODY ════════════════════════════════════════════════════ */
.cw-body {
  flex:1;overflow-y:auto;padding:14px 12px;
  display:flex;flex-direction:column;gap:12px;
  scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.05) transparent;
}
.cw-body::-webkit-scrollbar { width:3px; }
.cw-body::-webkit-scrollbar-track { background:transparent; }
.cw-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,.06);border-radius:2px; }

/* ══ ROWS ════════════════════════════════════════════════════ */
.cw-row {
  display:flex;align-items:flex-end;gap:8px;
  animation:cw-row-in .32s var(--ease) both;
}
.cw-row-u { flex-direction:row-reverse; }
.cw-msg-col { flex:1;max-width:90%;display:flex;flex-direction:column;gap:6px; }

.cw-av-bot {
  width:27px;height:27px;border-radius:50%;flex-shrink:0;
  background:rgba(232,184,109,.08);border:1px solid rgba(232,184,109,.18);
  display:flex;align-items:center;justify-content:center;
}
.cw-av-user {
  width:25px;height:25px;border-radius:50%;flex-shrink:0;
  background:rgba(27,203,224,.1);border:1px solid rgba(27,203,224,.22);
  display:flex;align-items:center;justify-content:center;
}

/* ══ BUBBLES ═════════════════════════════════════════════════ */
.cw-bubble {
  padding:10px 13px;border-radius:16px;
}
.cw-bubble-bot {
  background:rgba(255,255,255,.05);
  border:1px solid var(--brd);
  color:var(--t2);
  border-bottom-left-radius:4px;
}
.cw-bubble-user {
  background:linear-gradient(135deg,rgba(27,203,224,.18),rgba(26,109,212,.14));
  border:1px solid rgba(27,203,224,.2);
  color:var(--t);
  border-bottom-right-radius:4px;
}
.cw-bubble-text {
  font-size:.82rem;line-height:1.65;margin:0;white-space:pre-line;
}

/* ══ TYPING ══════════════════════════════════════════════════ */
.cw-typing { display:flex;align-items:center;gap:5px;padding:3px 2px; }
.cw-td {
  display:block;width:7px;height:7px;border-radius:50%;
  background:var(--t3);
  animation:cw-dot .65s ease-in-out infinite;
}

/* ══ PRODUCT CARDS ═══════════════════════════════════════════ */
.cw-items { display:flex;flex-direction:column;gap:7px; }
.cw-item {
  display:flex;gap:10px;align-items:flex-start;
  background:rgba(255,255,255,.04);
  border:1px solid var(--brd);
  border-radius:12px;overflow:hidden;
  transition:border-color .2s;
}
.cw-item:hover { border-color:rgba(232,184,109,.2); }
.cw-item-oos { opacity:.42; }

.cw-item-img-wrap {
  width:60px;height:60px;flex-shrink:0;position:relative;overflow:hidden;
}
.cw-item-img { width:100%;height:100%;object-fit:cover; }
.cw-item-oos-veil {
  position:absolute;inset:0;background:rgba(7,16,30,.7);
  display:flex;align-items:center;justify-content:center;
}
.cw-item-oos-veil span {
  font-size:.55rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;
  color:var(--red);border:1px solid rgba(248,113,113,.3);
  padding:2px 6px;border-radius:999px;
}
.cw-item-body {
  flex:1;padding:8px 10px 8px 0;display:flex;flex-direction:column;gap:3px;min-width:0;
}
.cw-item-name {
  font-size:.79rem;font-weight:500;color:var(--t);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.cw-item-desc {
  font-size:.7rem;color:var(--t3);line-height:1.5;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
}
.cw-item-foot { display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:2px; }
.cw-item-price {
  font-family:var(--serif);font-size:.95rem;
  background:linear-gradient(135deg,var(--gold),var(--gold2));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.cw-item-price small {
  font-family:var(--sans);font-size:.57rem;
  -webkit-text-fill-color:var(--t3);color:var(--t3);
}
.cw-item-badge {
  font-size:.58rem;padding:2px 7px;border-radius:999px;font-weight:600;
  letter-spacing:.04em;
}
.cw-item-badge-hot {
  background:rgba(232,184,109,.1);color:var(--gold);
  border:1px solid rgba(232,184,109,.2);
}
.cw-item-badge-gem {
  background:rgba(27,203,224,.08);color:var(--cyan);
  border:1px solid rgba(27,203,224,.2);
}
.cw-item-tags { display:flex;gap:4px;flex-wrap:wrap; }
.cw-ftag {
  font-size:.59rem;padding:2px 6px;border-radius:999px;
  background:rgba(255,255,255,.05);color:var(--t3);
  border:1px solid var(--brd);
}

/* ══ PROMO CARDS ═════════════════════════════════════════════ */
.cw-promos { display:flex;flex-direction:column;gap:6px; }
.cw-promo {
  border-radius:12px;padding:10px 12px;
  border:1px solid transparent;
}
.cw-promo-gold {
  background:rgba(232,184,109,.07);border-color:rgba(232,184,109,.18);
}
.cw-promo-cyan {
  background:rgba(27,203,224,.06);border-color:rgba(27,203,224,.18);
}
.cw-promo-green {
  background:rgba(52,211,153,.06);border-color:rgba(52,211,153,.18);
}
.cw-promo-title {
  font-size:.78rem;font-weight:600;color:var(--t);margin-bottom:3px;
}
.cw-promo-desc {
  font-size:.71rem;color:var(--t2);line-height:1.5;
}
.cw-promo-tag {
  font-size:.58rem;color:var(--t3);margin-top:5px;
  letter-spacing:.06em;text-transform:uppercase;
}

/* ══ CHIPS ═══════════════════════════════════════════════════ */
.cw-chips { display:flex;flex-direction:column;gap:5px; }
.cw-chip {
  display:flex;align-items:center;gap:7px;padding:8px 11px;
  border-radius:10px;border:1px solid var(--brd);
  background:rgba(255,255,255,.035);
  color:var(--t2);font-size:.77rem;font-family:var(--sans);
  text-align:left;width:100%;
  transition:all .18s var(--ease);
}
.cw-chip:hover {
  background:rgba(232,184,109,.07);
  border-color:rgba(232,184,109,.24);
  color:var(--gold);
  transform:translateX(3px);
}
.cw-chip:active { transform:translateX(1px); }
.cw-chip-em { font-size:.85rem;flex-shrink:0; }
.cw-chip-arr {
  margin-left:auto;flex-shrink:0;color:var(--t3);
  transition:transform .18s var(--ease),color .18s;
}
.cw-chip:hover .cw-chip-arr { transform:translateX(2px);color:var(--gold); }

/* ══ TIMESTAMP ═══════════════════════════════════════════════ */
.cw-ts { font-size:.57rem;color:var(--t3);padding:0 3px; }
.cw-ts-r { text-align:right; }

/* ══ INPUT BAR ═══════════════════════════════════════════════ */
.cw-input-row {
  display:flex;align-items:center;gap:8px;padding:10px 12px;
  border-top:1px solid var(--brd);
  background:rgba(7,16,30,.85);
  flex-shrink:0;position:relative;
}
.cw-input-glow {
  position:absolute;top:0;left:50%;transform:translateX(-50%);
  width:200px;height:1px;
  background:linear-gradient(90deg,transparent,rgba(232,184,109,.18),transparent);
  pointer-events:none;
}
.cw-input {
  flex:1;padding:9px 13px;border-radius:12px;
  border:1px solid var(--brd);background:var(--sur);
  color:var(--t);font-family:var(--sans);font-size:.82rem;outline:none;
  transition:border-color .2s,box-shadow .2s,background .2s;
}
.cw-input::placeholder { color:var(--t3); }
.cw-input:focus {
  border-color:rgba(232,184,109,.3);
  box-shadow:0 0 0 3px rgba(232,184,109,.05);
  background:rgba(232,184,109,.02);
}
.cw-send {
  width:36px;height:36px;border-radius:10px;border:none;
  color:#07101e;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;overflow:hidden;position:relative;
  transition:transform .18s var(--ease);
}
.cw-send-bg {
  position:absolute;inset:0;
  background:linear-gradient(135deg,var(--gold),var(--gold2));
  transition:opacity .15s;
}
.cw-send:hover:not(:disabled) { transform:scale(1.07); }
.cw-send:disabled .cw-send-bg { opacity:.28; }
.cw-send:disabled { cursor:not-allowed; }
`;