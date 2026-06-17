/* ============================================================
   UI — shared primitives, icon set, charts
   Exports to window.
   ============================================================ */

/* ---------- formatters ---------- */
const fmt   = (n) => Number(n).toLocaleString("en-US");
const money = (n, dec = 0) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
const moneyK = (n) => n >= 1000 ? "$" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k" : "$" + n;
const initials = (name) => name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

/* ---------- icon set ---------- */
const ICONS = {
  dashboard:  "M3 3h7v8H3zM14 3h7v5h-7zM14 11h7v10h-7zM3 14h7v7H3z",
  inventory:  "M3 7.5 12 3l9 4.5M3 7.5 12 12m-9-4.5V16l9 5m0-9 9-4.5M12 12v9m9-13.5V16l-9 5",
  truck:      "M1 3h13v11H1zM14 7h4l3 3v4h-7zM5.5 17.5a2 2 0 1 0 0 .01M17.5 17.5a2 2 0 1 0 0 .01",
  invoice:    "M5 2h10l4 4v16H5zM14 2v5h5M8 12h8M8 16h8M8 8h3",
  dollar:     "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  users:      "M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M22 20v-2a4 4 0 0 0-3-3.8M16 3.2A4 4 0 0 1 16 11",
  wallet:     "M3 6h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-1-1.7V6zM3 6l13-3v3M17 13h1",
  reports:    "M3 3v18h18M8 16v-5M13 16V7M18 16v-9",
  search:     "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3",
  bell:       "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  plus:       "M12 5v14M5 12h14",
  chevR:      "M9 6l6 6-6 6",
  chevL:      "M15 6l-6 6 6 6",
  chevD:      "M6 9l6 6 6-6",
  chevU:      "M18 15l-6-6-6 6",
  arrowUp:    "M12 19V5M5 12l7-7 7 7",
  arrowDown:  "M12 5v14M5 12l7 7 7-7",
  arrowR:     "M5 12h14M13 6l6 6-6 6",
  check:      "M20 6 9 17l-5-5",
  checkCircle:"M22 11.5V12a10 10 0 1 1-5.9-9.1M22 4 12 14.1l-3-3",
  x:          "M18 6 6 18M6 6l12 12",
  xCircle:    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M15 9l-6 6M9 9l6 6",
  more:       "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  filter:     "M22 3H2l8 9.5V19l4 2v-8.5z",
  download:   "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  edit:       "M11 4H4v16h16v-7M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z",
  trash:      "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5",
  pkg:        "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  scan:       "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10",
  clock:      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 6v6l4 2",
  alert:      "M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0M12 9v4M12 17h.01",
  settings:   "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 0 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 0 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H7a1.6 1.6 0 0 0 1-1.5V1a2 2 0 0 1 4 0v.1A1.6 1.6 0 0 0 17 2.6a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V7a1.6 1.6 0 0 0 1.5 1H23a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z",
  phone:      "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z",
  pin:        "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6",
  cal:        "M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14H3zM3 10h18M8 2v4M16 2v4",
  menu:       "M3 6h18M3 12h18M3 18h18",
  box:        "M21 8 12 3 3 8v8l9 5 9-5zM3 8l9 5 9-5",
  send:       "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  print:      "M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5h20v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z",
  trendUp:    "M22 7 13.5 15.5l-5-5L2 17M16 7h6v6",
  grid:       "M3 3h8v8H3zM13 3h8v8h-8zM13 13h8v8h-8zM3 13h8v8H3z",
  list:       "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  mail:       "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1M2 6l10 7 10-7",
  receipt:    "M5 2h14v20l-3-2-3 2-3-2-3 2V2zM9 8h6M9 12h6M9 16h3",
  tag:        "M20.6 8.3 11.7 17.3a2 2 0 0 1-2.8 0L3 11.4a2 2 0 0 1 0-2.8L12 3.4a2 2 0 0 1 1.4-.4h5.4a2 2 0 0 1 2 2v5.4a2 2 0 0 1-.2.9zM16.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1",
  star:       "M12 2l3 6.5 7 .9-5 4.8 1.3 7-6.3-3.4L5.7 21l1.3-7-5-4.8 7-.9z",
};

function Icon({ name, size = 18, className = "", strokeWidth = 1.6 }) {
  const d = ICONS[name] || "";
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round">
      {d.split("M").filter(Boolean).map((seg, i) => <path key={i} d={"M" + seg} />)}
    </svg>
  );
}

/* ---------- small atoms ---------- */
function Trend({ value, suffix = "%" }) {
  const dir = value > 0 ? "up" : value < 0 ? "down" : "flat";
  return (
    <span className={`trend ${dir}`}>
      {dir !== "flat" && <Icon name={value > 0 ? "arrowUp" : "arrowDown"} size={11} strokeWidth={2.5} />}
      {Math.abs(value)}{suffix}
    </span>
  );
}

function Avatar({ name, cls = "av-1", size = 30 }) {
  return (
    <div className={`avatar ${cls}`} style={{ width: size, height: size, fontSize: size * 0.38, borderRadius: Math.max(6, size * 0.26) }}>
      {initials(name)}
    </div>
  );
}

function Badge({ kind = "neutral", children, dot }) {
  return (
    <span className={`badge badge-${kind}`}>
      {dot && <span className="dot" style={{ background: dot }} />}
      {children}
    </span>
  );
}

function Meter({ value, max, color = "var(--accent)", height = 5 }) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  return <div className="meter" style={{ height }}><span style={{ width: pct + "%", background: color }} /></div>;
}

/* ---------- Status helpers ---------- */
const STOCK = {
  ok:       { cls: "badge-pos",    label: "In Stock", dot: "var(--pos)",    color: "var(--pos)"    },
  low:      { cls: "badge-warn",   label: "Low",      dot: "var(--warn)",   color: "var(--warn)"   },
  critical: { cls: "badge-danger", label: "Critical", dot: "var(--danger)", color: "var(--danger)" },
};
const INV_STATUS = {
  paid:    { cls: "badge-pos",     label: "Paid" },
  sent:    { cls: "badge-info",    label: "Sent" },
  overdue: { cls: "badge-danger",  label: "Overdue" },
  partial: { cls: "badge-warn",    label: "Partial" },
  draft:   { cls: "badge-neutral", label: "Draft" },
};
const SHIP_STATUS = {
  arriving:   { cls: "badge-accent",  label: "Arriving" },
  verifying:  { cls: "badge-warn",    label: "Verifying" },
  in_transit: { cls: "badge-neutral", label: "On the Way" },
  received:   { cls: "badge-pos",     label: "Received" },
};

function StockBadge({ status }) {
  const s = STOCK[status] || STOCK.ok;
  return <Badge kind={s.cls.replace("badge-", "")} dot={s.dot}>{s.label}</Badge>;
}
function ShipBadge({ status }) {
  const s = SHIP_STATUS[status] || SHIP_STATUS.in_transit;
  return <Badge kind={s.cls.replace("badge-", "")}>{s.label}</Badge>;
}
function InvBadge({ status }) {
  const s = INV_STATUS[status] || INV_STATUS.draft;
  return <Badge kind={s.cls.replace("badge-", "")}>{s.label}</Badge>;
}

/* ---------- Charts ---------- */
function smoothPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

function Sparkline({ data, w = 80, h = 24, color = "var(--accent)", fill = true, sw = 1.6 }) {
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / rng) * (h - 6)]);
  const line = smoothPath(pts);
  const id = React.useMemo(() => "sp" + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      {fill && <>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.25" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L ${w},${h} L 0,${h} Z`} fill={`url(#${id})`} />
      </>}
      <path d={line} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </svg>
  );
}

function AreaChart({ series, labels, h = 220, color = "var(--accent)", color2 = "var(--info)", series2 }) {
  const W = 640, pad = { t: 12, r: 10, b: 28, l: 46 };
  const iw = W - pad.l - pad.r, ih = h - pad.t - pad.b;
  const all = series2 ? [...series, ...series2] : series;
  const max = Math.max(...all) * 1.12;
  const xf = (i) => pad.l + (i / (series.length - 1)) * iw;
  const yf = (v) => pad.t + ih - (v / max) * ih;
  const pts = series.map((v, i) => [xf(i), yf(v)]);
  const line = smoothPath(pts);
  const id = React.useMemo(() => "ar" + Math.random().toString(36).slice(2, 7), []);
  const ticks = 4;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.3" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[...Array(ticks + 1)].map((_, i) => {
        const v = (max / ticks) * i, y = yf(v);
        return <g key={i}>
          <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="var(--border)" strokeWidth="1" />
          <text x={pad.l - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="var(--text-4)" fontFamily="var(--mono)">{moneyK(Math.round(v))}</text>
        </g>;
      })}
      {series2 && (
        <path d={smoothPath(series2.map((v, i) => [xf(i), yf(v)]))}
          fill="none" stroke={color2} strokeWidth="1.8" strokeDasharray="3 4" opacity="0.65" />
      )}
      <path d={`${line} L ${xf(series.length - 1)},${pad.t + ih} L ${pad.l},${pad.t + ih} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
      {pts.map((p, i) => i === pts.length - 1 && (
        <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill={color} stroke="var(--panel)" strokeWidth="2.5" />
      ))}
      {labels && labels.map((l, i) => l && i % Math.ceil(labels.length / 6) === 0 && (
        <text key={i} x={xf(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--text-4)">{l}</text>
      ))}
    </svg>
  );
}

function Donut({ data, size = 150, thickness = 18, center }) {
  const total = data.reduce((s, d) => s + d.val, 0);
  const r = (size - thickness) / 2, c = 2 * Math.PI * r;
  let off = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {data.map((d, i) => {
          const frac = d.val / total, len = frac * c;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-off} strokeLinecap="butt" />;
          off += len; return el;
        })}
      </g>
      {center && <>
        <text x="50%" y="47%" textAnchor="middle" fontSize="21" fontWeight="600"
          fill="var(--text)" fontFamily="var(--mono)" letterSpacing="-1">{center.top}</text>
        <text x="50%" y="62%" textAnchor="middle" fontSize="10.5" fill="var(--text-3)">{center.bot}</text>
      </>}
    </svg>
  );
}

function BarPair({ data, w = 560, h = 180 }) {
  const pad = { t: 10, r: 6, b: 26, l: 42 };
  const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
  const max = Math.max(...data.flatMap(d => [d.in, d.out])) * 1.15;
  const groupW = iw / data.length, bw = 12;
  const yf = (v) => pad.t + ih - (v / max) * ih;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
      {[0, 0.5, 1].map((f, i) => { const y = pad.t + ih - f * ih; return (
        <g key={i}>
          <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--border)" />
          <text x={pad.l - 7} y={y + 3.5} textAnchor="end" fontSize="9.5" fill="var(--text-4)" fontFamily="var(--mono)">${Math.round(max * f)}k</text>
        </g>); })}
      {data.map((d, i) => {
        const cx = pad.l + groupW * i + groupW / 2;
        return <g key={i}>
          <rect x={cx - bw - 2} y={yf(d.in)} width={bw} height={pad.t + ih - yf(d.in)} rx="3" fill="var(--accent)" opacity="0.85" />
          <rect x={cx + 2} y={yf(d.out)} width={bw} height={pad.t + ih - yf(d.out)} rx="3" fill="var(--panel-3)" stroke="var(--border-2)" />
          <text x={cx} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--text-4)">{d.m}</text>
        </g>;
      })}
    </svg>
  );
}

/* ---- extra icons (mobile nav + actions) ---- */
Object.assign(ICONS, {
  home:    "M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10",
  inbox:   "M3 12h5l2 3h4l2-3h5M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z",
  cart:    "M2 3h2.5l2.2 12.4a1.6 1.6 0 0 0 1.6 1.3h8.7a1.6 1.6 0 0 0 1.6-1.2L21.5 7H6M9.5 21a1 1 0 1 0 0-.01M17.5 21a1 1 0 1 0 0-.01",
  history: "M3 3v6h6M3.5 9a9 9 0 1 1-1 5M12 7v5l4 2",
  refresh: "M21 12a9 9 0 1 1-3-6.7M21 4v4h-4",
  user:    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M5 21v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z",
  swap:    "M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7",
});

/* ---- date / time helpers ---- */
function fmtDate(iso, opts) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-US", opts || { month: "short", day: "numeric", year: "numeric" });
}
function relTime(iso) {
  if (!iso) return "";
  const d = new Date(iso); if (isNaN(d)) return "";
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  const dd = Math.floor(h / 24); if (dd < 7) return dd + "d ago";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ---- Sheet (slide-up modal) ---- */
function Sheet({ open, onClose, title, icon, children }) {
  React.useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <div className="sheet" onMouseDown={e => e.stopPropagation()}>
        <div className="sheet-grip" />
        {title && (
          <div className="sheet-head">
            {icon && <div className="lc-ico" style={{ width: 32, height: 32, borderRadius: 9 }}><Icon name={icon} size={16} /></div>}
            <h3>{title}</h3>
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={17} /></button>
          </div>
        )}
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

/* ---- Skeleton loaders ---- */
function Skeleton({ h = 16, w = "100%", style }) {
  return <div className="skeleton" style={{ height: h, width: w, ...style }} />;
}
function SkeletonList({ count = 4 }) {
  return <div>{Array.from({ length: count }).map((_, i) => <div key={i} className="skeleton skel-card" />)}</div>;
}

/* ---- Progress bar ---- */
function Progress({ value }) {
  return <div className="progressbar"><span style={{ width: Math.max(0, Math.min(100, value)) + "%" }} /></div>;
}

/* ---- Metric card (mobile KPI) ---- */
function MetricCard({ icon, iconBg, iconColor, value, label, cur, onClick }) {
  return (
    <div className="metric" onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <div className="metric-ico" style={{ background: iconBg, color: iconColor }}>
        <Icon name={icon} size={16} />
      </div>
      <div className="metric-val">{cur && <span className="cur">$</span>}{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

Object.assign(window, {
  fmt, money, moneyK, initials,
  Icon, ICONS, Trend, Avatar, Badge, Meter,
  STOCK, INV_STATUS, SHIP_STATUS,
  StockBadge, ShipBadge, InvBadge,
  Sparkline, AreaChart, Donut, BarPair, smoothPath,
  fmtDate, relTime, Sheet, Skeleton, SkeletonList, Progress, MetricCard,
});
