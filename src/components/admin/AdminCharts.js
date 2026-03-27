import { useEffect, useState, useCallback, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import {
  ArrowLeft, TrendingUp, TrendingDown, ShoppingBag,
  Package, Wallet, BarChart2, Activity, PieChart as PieIcon,
  Calendar, RefreshCw,
} from "lucide-react";
import cafeApi from "../../api/cafeApiInstance";

const C = {
  bg:      "#0d1f3c",
  surface: "rgba(255,255,255,.04)",
  border:  "rgba(255,255,255,.07)",
  cyan:    "#1bcbe0",
  blue:    "#1a6dd4",
  green:   "#34d399",
  amber:   "#f59e0b",
  violet:  "#a78bfa",
  rose:    "#f472b6",
  text:    "#e8f4ff",
  muted:   "#4a7099",
};
const SLICE = [C.cyan, C.blue, C.violet, C.amber, C.green, C.rose, "#fb923c"];

const PRESETS = [
  { key: "today",     label: "Today"      },
  { key: "yesterday", label: "Yesterday"  },
  { key: "7d",        label: "7 days"     },
  { key: "30d",       label: "30 days"    },
  { key: "90d",       label: "90 days"    },
  { key: "mtd",       label: "This month" },
  { key: "custom",    label: "Custom"     },
];

/* ── Tooltip ─────────────────────────────────────────────────── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const isRev = ["revenue", "totalRevenue"].includes(payload[0]?.dataKey);
  return (
    <div style={{
      background: "rgba(10,22,45,.97)", border: `1px solid ${C.border}`,
      borderRadius: 12, padding: "10px 14px",
      fontFamily: "'Plus Jakarta Sans',sans-serif",
      boxShadow: "0 8px 32px rgba(0,0,0,.5)",
    }}>
      <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.muted, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: "1.05rem", fontWeight: 800, color: C.cyan, margin: 0 }}>
        {typeof payload[0].value === "number"
          ? isRev ? payload[0].value.toFixed(2) : Math.round(payload[0].value)
          : payload[0].value}
        <span style={{ fontSize: ".7rem", color: C.muted, fontWeight: 600, marginLeft: 4 }}>
          {isRev ? "TND" : "units"}
        </span>
      </p>
    </div>
  );
};

/* ── KPI card ─────────────────────────────────────────────────── */
function KPI({ label, value, unit, icon: Icon, accent, pct, delay }) {
  const up = pct !== null && parseFloat(pct) >= 0;
  return (
    <div className="ac-kpi" style={{ animationDelay: delay + "s" }}>
      <div className="ac-kpi-top">
        <span className="ac-kpi-label">{label}</span>
        <div className="ac-kpi-icon" style={{ background: accent + "18", border: `1px solid ${accent}30` }}>
          <Icon size={16} color={accent} />
        </div>
      </div>
      <div className="ac-kpi-value">{value}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
        <div className="ac-kpi-unit">{unit}</div>
        {pct !== null && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: ".65rem", fontWeight: 700, color: up ? C.green : "#f87171" }}>
            {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(pct)}% vs prev
          </span>
        )}
      </div>
      <div className="ac-kpi-bar" style={{ background: `linear-gradient(90deg,${accent},${accent}44)` }} />
    </div>
  );
}

/* ── Section card ─────────────────────────────────────────────── */
function Card({ title, sub, icon: Icon, accent, children, style, delay }) {
  return (
    <div className="ac-card" style={{ animationDelay: (delay || 0) + "s", ...style }}>
      <div className="ac-card-hd">
        <div className="ac-card-icon" style={{ background: accent + "14", border: `1px solid ${accent}28` }}>
          <Icon size={15} color={accent} />
        </div>
        <div>
          <div className="ac-card-title">{title}</div>
          {sub && <div className="ac-card-sub">{sub}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

const Skeleton = ({ h = 220 }) => (
  <div style={{
    height: h, borderRadius: 12,
    background: "rgba(255,255,255,.04)",
    animation: "ac-pulse 1.4s ease-in-out infinite",
  }} />
);

/* ── Period label formatter ───────────────────────────────────── */
function fmtPeriod(p, grouping) {
  if (!p) return "";
  // Week labels from controller are already "Week 1", "Week 2", etc.
  if (grouping === "week") return p;
  if (grouping === "month") return p.slice(0, 7);
  // day grouping: "2026-01-15" → "15 Jan"
  try {
    return new Date(p).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
  } catch {
    return p;
  }
}

/* ── Empty state ─────────────────────────────────────────────── */
const Empty = ({ msg = "No data for this period" }) => (
  <p style={{ color: C.muted, fontSize: ".85rem", textAlign: "center", padding: "32px 0", margin: 0 }}>
    {msg}
  </p>
);

/* ═══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
export default function AdminCharts() {
  const [preset,  setPreset]  = useState("30d");
  const [from,    setFrom]    = useState("");
  const [to,      setTo]      = useState("");
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ preset });
    if (preset === "custom" && from && to) {
      params.set("from", from);
      params.set("to", to);
    }
    cafeApi.get(`/stats?${params}`)
      .then(r  => { setData(r.data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [preset, from, to]);

  useEffect(() => {
    if (preset === "custom" && (!from || !to)) return;
    load();
  }, [load]);

  const s        = data?.summary ?? {};
  const revenue  = data?.revenue ?? [];
  const sales    = data?.sales   ?? [];
  const grouping = data?.meta?.grouping ?? "day";
  const top5     = [...sales].sort((a, b) => b.totalSold - a.totalSold).slice(0, 5);
  const maxSold  = top5[0]?.totalSold || 1;

  const fmt = (p) => fmtPeriod(p, grouping);

  // Subtitle that accurately describes the grouping
  const groupingLabel = {
    day:   "Daily breakdown",
    week:  preset === "7d" ? "1-week summary" : "4-week breakdown",
    month: "Monthly breakdown",
  }[grouping] ?? "";

  return (
    <>
      <style>{CSS}</style>
      <div className="ac-root">
        <div className="ac-glow ac-g1" /><div className="ac-glow ac-g2" />
        <div className="ac-grid-overlay" />
        <div className="ac-inner">

          {/* ── HEADER ───────────────────────────────────────────── */}
          <header className="ac-header">
            <button className="ac-back" onClick={() => window.history.back()}>
              <ArrowLeft size={15} /> Back
            </button>
            <div className="ac-header-center">
              <img src="/images/coffai1.png" alt="CoffAI" style={{ width: 32, height: 32, objectFit: "contain" }} />
              <div>
                <h1 className="ac-title">Analytics</h1>
                <p className="ac-subtitle">Sales performance overview</p>
              </div>
            </div>
            <div className="ac-live"><span className="ac-live-dot" />Live</div>
          </header>

          {/* ── DATE RANGE BAR ───────────────────────────────────── */}
          <div className="ac-range-bar">
            <div className="ac-presets">
              <Calendar size={14} color={C.muted} style={{ flexShrink: 0 }} />
              {PRESETS.map(p => (
                <button
                  key={p.key}
                  className={`ac-preset${preset === p.key ? " ac-preset-on" : ""}`}
                  onClick={() => setPreset(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {preset === "custom" && (
              <div className="ac-custom-dates">
                <input
                  type="date" className="ac-date-input"
                  value={from} onChange={e => setFrom(e.target.value)}
                  max={to || undefined}
                />
                <span style={{ color: C.muted, fontSize: ".75rem" }}>→</span>
                <input
                  type="date" className="ac-date-input"
                  value={to} onChange={e => setTo(e.target.value)}
                  min={from || undefined}
                />
              </div>
            )}
            <button
              className="ac-refresh" onClick={load} title="Refresh"
              disabled={loading}
            >
              <RefreshCw size={14} style={{ animation: loading ? "ac-spin .7s linear infinite" : "" }} />
            </button>
          </div>

          {/* ── ERROR ────────────────────────────────────────────── */}
          {error && (
            <div style={{
              padding: "14px 18px", borderRadius: 12,
              background: "rgba(248,113,113,.1)", border: "1px solid rgba(248,113,113,.25)",
              color: "#f87171", fontSize: ".82rem", marginBottom: 20,
            }}>
              ⚠ Failed to load stats: {error}
            </div>
          )}

          {/* ── KPIs ─────────────────────────────────────────────── */}
          <div className="ac-kpi-grid">
            <KPI label="Total Revenue"   icon={Wallet}      accent={C.cyan}   delay={0}    value={(s.totalRevenue   ?? 0).toFixed(2)} unit="Tunisian Dinar"    pct={s.pctRev    ?? null} />
            <KPI label="Orders"          icon={ShoppingBag} accent={C.green}  delay={.06}  value={s.totalOrders     ?? 0}             unit="Completed orders" pct={s.pctOrders ?? null} />
            <KPI label="Items Sold"      icon={Package}     accent={C.amber}  delay={.12}  value={s.totalSold       ?? 0}             unit="Total units"      pct={null} />
            <KPI label="Avg Order Value" icon={TrendingUp}  accent={C.violet} delay={.18}  value={(s.avgOrderValue  ?? 0).toFixed(2)} unit="TND / order"      pct={null} />
          </div>

          {/* ── ROW 1: Revenue trend + Order volume ──────────────── */}
          <div className="ac-row2">
            <Card title="Revenue Trend" sub={groupingLabel} icon={Activity} accent={C.cyan} delay={.1}>
              {loading ? <Skeleton /> : revenue.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenue} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={C.cyan} stopOpacity={.25} />
                        <stop offset="100%" stopColor={C.cyan} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,.05)" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tickFormatter={fmt}
                      tick={{ fill: C.muted, fontSize: 10, fontFamily: "Plus Jakarta Sans" }}
                      axisLine={false} tickLine={false}
                      interval={grouping === "week" ? 0 : "auto"}
                    />
                    <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} labelFormatter={fmt} />
                    <Area
                      type="monotone" dataKey="revenue"
                      stroke={C.cyan} strokeWidth={2} fill="url(#gArea)"
                      dot={{ r: 3, fill: C.cyan, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#fff", stroke: C.cyan, strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card title="Order Volume" sub="Number of orders per period" icon={BarChart2} accent={C.blue} delay={.16}>
              {loading ? <Skeleton /> : revenue.length === 0 ? <Empty /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenue} margin={{ top: 8, right: 4, bottom: 0, left: -16 }} barCategoryGap="38%">
                    <defs>
                      <linearGradient id="gBar2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={C.cyan} stopOpacity={.9} />
                        <stop offset="100%" stopColor={C.blue} stopOpacity={.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,.05)" vertical={false} />
                    <XAxis
                      dataKey="period"
                      tickFormatter={fmt}
                      tick={{ fill: C.muted, fontSize: 10, fontFamily: "Plus Jakarta Sans" }}
                      axisLine={false} tickLine={false}
                      interval={grouping === "week" ? 0 : "auto"}
                    />
                    <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} labelFormatter={fmt} />
                    <Bar dataKey="orders" fill="url(#gBar2)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* ── ROW 2: Sales by item + Pie ───────────────────────── */}
          <div className="ac-row2">
            {/* ── Bar chart: top 10 + "show all" scrollable list ── */}
            <SalesByProductCard sales={sales} loading={loading} />

            {/* ── Pie: top 6 + "Others" bucket ─────────────────── */}
            <RevenueShareCard sales={sales} loading={loading} />
          </div>

          {/* ── TOP PERFORMERS ───────────────────────────────────── */}
          <Card title="Top Performers" sub="Best-selling items in selected period" icon={TrendingUp} accent={C.amber} delay={.3}>
            {loading ? <Skeleton h={180} /> : top5.length === 0 ? <Empty msg="No sales in this period" /> : (
              <div className="ac-ranks">
                {top5.map((item, i) => (
                  <div key={i} className="ac-rank-row">
                    <span
                      className="ac-rank-num"
                      style={{
                        background: i === 0
                          ? `linear-gradient(135deg,${C.cyan},${C.blue})`
                          : "rgba(255,255,255,.06)",
                        color: i === 0 ? "#fff" : C.muted,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span className="ac-rank-name">{item.name}</span>
                        <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
                          <span style={{ fontSize: ".75rem", fontWeight: 700, color: C.muted }}>{item.totalSold} units</span>
                          <span className="ac-rank-rev">{item.totalRevenue.toFixed(0)} TND</span>
                        </div>
                      </div>
                      <div className="ac-rank-track">
                        <div
                          className="ac-rank-fill"
                          style={{
                            width: `${(item.totalSold / maxSold) * 100}%`,
                            background: `linear-gradient(90deg,${C.cyan},${C.blue})`,
                            opacity: 1 - i * 0.12,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SalesByProductCard — top-10 bar chart + "Show all" scrollable list
═══════════════════════════════════════════════════════════════ */
function SalesByProductCard({ sales, loading }) {
  const [showAll, setShowAll] = useState(false);
  const TOP = 10;
  const sorted  = [...sales].sort((a, b) => b.totalSold - a.totalSold);
  const chartData = sorted.slice(0, TOP);
  const maxVal    = chartData[0]?.totalSold || 1;

  return (
    <Card title="Sales by Product" sub={`Top ${Math.min(TOP, sales.length)} items · ${sales.length} total`} icon={BarChart2} accent={C.violet} delay={.2}>
      {loading ? <Skeleton /> : sales.length === 0 ? <Empty /> : (
        <>
          {!showAll ? (
            /* ── Recharts bar — only top 10 ── */
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 32, left: -16 }} barCategoryGap="32%">
                <defs>
                  <linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={C.violet} stopOpacity={.9} />
                    <stop offset="100%" stopColor={C.blue}   stopOpacity={.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: C.muted, fontSize: 9.5, fontFamily: "Plus Jakarta Sans" }}
                  axisLine={false} tickLine={false}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                  height={52}
                />
                <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: "Plus Jakarta Sans" }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="totalSold" fill="url(#gBar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            /* ── Scrollable ranked list — all items ── */
            <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }} className="ac-scroll">
              {sorted.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: ".58rem", fontWeight: 800,
                    background: i < 3 ? `linear-gradient(135deg,${C.violet},${C.blue})` : "rgba(255,255,255,.06)",
                    color: i < 3 ? "#fff" : C.muted,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: ".78rem", fontWeight: 600, color: "#c8dff0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{item.name}</span>
                      <span style={{ fontSize: ".72rem", fontWeight: 700, color: C.violet, flexShrink: 0, marginLeft: 8 }}>{item.totalSold} units</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 999, width: `${(item.totalSold / maxVal) * 100}%`, background: `linear-gradient(90deg,${C.violet},${C.blue})`, opacity: Math.max(0.3, 1 - i * 0.025) }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Toggle button ── */}
          {sales.length > TOP && (
            <button
              onClick={() => setShowAll(v => !v)}
              style={{
                marginTop: 12, width: "100%", padding: "7px 0",
                borderRadius: 10, border: `1px solid rgba(167,139,250,.2)`,
                background: "rgba(167,139,250,.07)", color: C.violet,
                fontFamily: "inherit", fontSize: ".72rem", fontWeight: 700,
                cursor: "pointer", transition: "all .2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(167,139,250,.15)"; e.currentTarget.style.borderColor = "rgba(167,139,250,.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(167,139,250,.07)"; e.currentTarget.style.borderColor = "rgba(167,139,250,.2)"; }}
            >
              {showAll ? `↑ Show top ${TOP} chart` : `↓ Show all ${sales.length} items`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RevenueShareCard — top-6 slices + "Others" bucket, clean legend
═══════════════════════════════════════════════════════════════ */
const PIE_COLORS = [C.cyan, C.violet, C.amber, C.green, C.rose, C.blue, "#fb923c"];
const PIE_LIMIT  = 6;

function RevenueShareCard({ sales, loading }) {
  const sorted = [...sales].sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Build pie data: top PIE_LIMIT + "Others"
  const pieData = (() => {
    if (sorted.length <= PIE_LIMIT) return sorted.map(s => ({ name: s.name, totalRevenue: s.totalRevenue }));
    const top    = sorted.slice(0, PIE_LIMIT);
    const others = sorted.slice(PIE_LIMIT).reduce((acc, s) => acc + s.totalRevenue, 0);
    return [...top.map(s => ({ name: s.name, totalRevenue: s.totalRevenue })), { name: "Others", totalRevenue: others }];
  })();

  const PieTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const total = pieData.reduce((s, d) => s + d.totalRevenue, 0);
    const pct   = total > 0 ? ((payload[0].value / total) * 100).toFixed(1) : "0";
    return (
      <div style={{ background: "rgba(10,22,45,.97)", border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 14px", fontFamily: "'Plus Jakarta Sans',sans-serif", boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}>
        <p style={{ fontSize: ".68rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: C.muted, marginBottom: 4 }}>{payload[0].name}</p>
        <p style={{ fontSize: "1rem", fontWeight: 800, color: C.cyan, margin: 0 }}>{payload[0].value.toFixed(2)} <span style={{ fontSize: ".7rem", color: C.muted }}>TND</span></p>
        <p style={{ fontSize: ".72rem", color: C.muted, margin: "3px 0 0", fontWeight: 600 }}>{pct}% of total</p>
      </div>
    );
  };

  return (
    <Card title="Revenue Share" sub={`Top ${Math.min(PIE_LIMIT, sales.length)} products${sales.length > PIE_LIMIT ? ` + Others (${sales.length - PIE_LIMIT})` : ""}`} icon={PieIcon} accent={C.rose} delay={.26}>
      {loading ? <Skeleton h={300} /> : sales.length === 0 ? <Empty /> : (
        <>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={pieData} cx="50%" cy="50%"
                outerRadius={88} innerRadius={40}
                dataKey="totalRevenue" paddingAngle={3}
                label={({ percent }) => percent > 0.03 ? `${(percent * 100).toFixed(0)}%` : ""}
                labelLine={{ stroke: "rgba(255,255,255,.15)", strokeWidth: 1 }}
              >
                {pieData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === PIE_LIMIT ? "rgba(255,255,255,.15)" : PIE_COLORS[i % PIE_COLORS.length]}
                    stroke="rgba(13,31,60,.8)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* ── Custom compact legend ── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 10, justifyContent: "center" }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                  background: i === PIE_LIMIT ? "rgba(255,255,255,.3)" : PIE_COLORS[i % PIE_COLORS.length],
                }} />
                <span style={{ fontSize: ".65rem", color: C.muted, fontFamily: "'Plus Jakarta Sans',sans-serif", whiteSpace: "nowrap" }}>{d.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CSS
═══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

.ac-root {
  font-family: 'Plus Jakarta Sans', sans-serif;
  min-height: 100vh;
  background: #0d1f3c;
  color: #e8f4ff;
  position: relative;
  overflow-x: hidden;
}
.ac-glow {
  position: fixed;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
  z-index: 0;
}
.ac-g1 { width: 600px; height: 600px; background: #1bcbe0; opacity: .055; top: -220px; right: -150px; }
.ac-g2 { width: 500px; height: 500px; background: #1a6dd4; opacity: .055; bottom: -160px; left: -120px; }
.ac-grid-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: radial-gradient(rgba(27,203,224,.07) 1px, transparent 1px);
  background-size: 40px 40px;
}
.ac-inner {
  position: relative;
  z-index: 1;
  max-width: 1140px;
  margin: 0 auto;
  padding: 0 24px 64px;
}

/* Header */
.ac-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 0 28px;
  border-bottom: 1px solid rgba(255,255,255,.07);
  margin-bottom: 24px;
  gap: 16px;
}
.ac-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.09);
  color: #4a7099;
  font-size: .78rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all .2s;
  flex-shrink: 0;
}
.ac-back:hover { border-color: rgba(27,203,224,.35); color: #1bcbe0; }
.ac-header-center { display: flex; align-items: center; gap: 12px; }
.ac-title {
  font-size: 1.4rem;
  font-weight: 800;
  letter-spacing: -.02em;
  margin: 0;
  line-height: 1;
  background: linear-gradient(135deg, #e8f4ff 30%, #7ab8d8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.ac-subtitle {
  font-size: .7rem;
  color: #4a7099;
  margin: 0;
  margin-top: 3px;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.ac-live {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(52,211,153,.07);
  border: 1px solid rgba(52,211,153,.2);
  font-size: .68rem;
  font-weight: 700;
  color: #34d399;
  letter-spacing: .1em;
  text-transform: uppercase;
  flex-shrink: 0;
}
.ac-live-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #34d399;
  animation: acblink 1.5s ease-in-out infinite;
}
@keyframes acblink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }

/* Range bar */
.ac-range-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-radius: 14px;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.07);
}
.ac-presets { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; flex: 1; }
.ac-preset {
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.08);
  background: transparent;
  color: #4a7099;
  font-family: inherit;
  font-size: .72rem;
  font-weight: 600;
  cursor: pointer;
  transition: all .18s;
  white-space: nowrap;
}
.ac-preset:hover { border-color: rgba(27,203,224,.3); color: #1bcbe0; }
.ac-preset-on  { background: rgba(27,203,224,.12); border-color: rgba(27,203,224,.35); color: #1bcbe0; }
.ac-custom-dates { display: flex; align-items: center; gap: 8px; }
.ac-date-input {
  padding: 6px 10px;
  border-radius: 9px;
  border: 1px solid rgba(27,203,224,.2);
  background: rgba(255,255,255,.04);
  color: #e8f4ff;
  font-family: inherit;
  font-size: .75rem;
  outline: none;
  cursor: pointer;
}
.ac-date-input:focus { border-color: rgba(27,203,224,.5); }
.ac-refresh {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid rgba(255,255,255,.08);
  background: rgba(255,255,255,.04);
  color: #4a7099;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all .2s;
}
.ac-refresh:hover:not(:disabled) { border-color: rgba(27,203,224,.3); color: #1bcbe0; }
.ac-refresh:disabled { opacity: .5; cursor: default; }

/* Animations */
@keyframes acfadein { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ac-pulse  { 0%,100% { opacity: .4; } 50% { opacity: .7; } }
@keyframes ac-spin   { to { transform: rotate(360deg); } }

/* KPI grid */
.ac-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}
@media (max-width: 900px) { .ac-kpi-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .ac-kpi-grid { grid-template-columns: 1fr; } }

.ac-kpi {
  position: relative;
  overflow: hidden;
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  padding: 20px 20px 24px;
  transition: border-color .3s, transform .3s;
  animation: acfadein .55s ease-out both;
}
.ac-kpi:hover { border-color: rgba(27,203,224,.22); transform: translateY(-3px); }
.ac-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.ac-kpi-label {
  font-size: .65rem;
  font-weight: 700;
  letter-spacing: .13em;
  text-transform: uppercase;
  color: #4a7099;
}
.ac-kpi-icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ac-kpi-value { font-size: 2rem; font-weight: 800; letter-spacing: -.03em; color: #e8f4ff; line-height: 1; margin-bottom: 4px; }
.ac-kpi-unit  { font-size: .72rem; color: #2a4a6a; font-weight: 400; }
.ac-kpi-bar   { position: absolute; bottom: 0; left: 0; right: 0; height: 2px; border-radius: 0 0 18px 18px; opacity: .5; }

/* Two-column row */
.ac-row2 { display: grid; gap: 16px; margin-bottom: 16px; grid-template-columns: 1fr 1fr; }
@media (max-width: 800px) { .ac-row2 { grid-template-columns: 1fr; } }

/* Card */
.ac-card {
  background: rgba(255,255,255,.04);
  border: 1px solid rgba(255,255,255,.08);
  border-radius: 18px;
  padding: 22px 22px 18px;
  transition: border-color .3s, transform .3s;
  animation: acfadein .55s ease-out both;
  position: relative;
  margin-bottom: 16px;
}
.ac-card:hover { border-color: rgba(27,203,224,.18); transform: translateY(-2px); }
.ac-card-hd   { display: flex; align-items: center; gap: 11px; margin-bottom: 18px; }
.ac-card-icon { width: 36px; height: 36px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ac-card-title { font-size: .9rem; font-weight: 700; color: #e8f4ff; line-height: 1; }
.ac-card-sub   { font-size: .68rem; color: #4a7099; margin-top: 3px; }

/* Top performers */
.ac-ranks { display: flex; flex-direction: column; gap: 14px; }
.ac-rank-row { display: flex; align-items: center; gap: 12px; }
.ac-rank-num {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .62rem;
  font-weight: 800;
}
.ac-rank-name {
  font-size: .82rem;
  font-weight: 600;
  color: #c8dff0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}
.ac-rank-rev  { font-size: .75rem; font-weight: 700; color: #34d399; flex-shrink: 0; }
.ac-rank-track { height: 4px; border-radius: 999px; background: rgba(255,255,255,.06); overflow: hidden; margin-bottom: 3px; }
.ac-rank-fill  { height: 100%; border-radius: 999px; transition: width .6s ease; }

/* Scrollable list */
.ac-scroll { scrollbar-width: thin; scrollbar-color: rgba(167,139,250,.3) transparent; }
.ac-scroll::-webkit-scrollbar { width: 4px; }
.ac-scroll::-webkit-scrollbar-track { background: transparent; }
.ac-scroll::-webkit-scrollbar-thumb { background: rgba(167,139,250,.3); border-radius: 4px; }

/* Recharts font override */
.ac-root .recharts-text,
.ac-root .recharts-legend-item-text {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
}
`;