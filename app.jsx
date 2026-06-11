/* ============================================================
   APP — shell, sidebar, topbar, command palette, router
   ============================================================ */

const NAV = [
  { group: "Overview", items: [
    { k: "dashboard", label: "Dashboard", icon: "dashboard" },
  ]},
  { group: "Operations", items: [
    { k: "inventory",  label: "Inventory",  icon: "inventory" },
    { k: "shipments",  label: "Incoming",   icon: "truck" },
    { k: "sales",      label: "Sales",      icon: "invoice" },
    { k: "customers",  label: "Customers",  icon: "users" },
  ]},
];

const TITLES = {
  dashboard: ["Dashboard"],
  inventory: ["Inventory"],
  product:   ["Inventory", "Product Detail"],
  shipments: ["Incoming"],
  shipment:  ["Incoming", "Detail"],
  sales:     ["Sales"],
  customers: ["Customers"],
  customer:  ["Customers", "Detail"],
};

function Sidebar({ screen, go, mobileOpen, setMobileOpen, userName }) {
  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="brand-mark">CC</div>
        <div>
          <div className="brand-name">CC Tobacco</div>
          <div className="brand-sub">Distribution OS</div>
        </div>
      </div>

      <nav className="sb-nav">
        {NAV.map(g => (
          <div key={g.group}>
            <div className="sb-group-label">{g.group}</div>
            {g.items.map(it => {
              const active = screen === it.k
                || (it.k === "inventory" && screen === "product")
                || (it.k === "shipments" && screen === "shipment")
                || (it.k === "customers" && screen === "customer");
              return (
                <button key={it.k}
                  className={"nav-item" + (active ? " active" : "")}
                  onClick={() => { go(it.k); setMobileOpen(false); }}>
                  <Icon name={it.icon} size={16} />
                  <span>{it.label}</span>
                  {it.badge && (
                    <span className={"nav-badge" + (it.badgeCls ? " " + it.badgeCls : "")}>
                      {it.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sb-foot">
        <button className="user-card">
          <Avatar name={userName || "?"} cls="av-3" size={30} />
          <div className="user-meta">
            <div className="nm">{userName || "…"}</div>
            <div className="rl">CC Tobacco</div>
          </div>
          <Icon name="settings" size={14} className="muted" />
        </button>
      </div>
    </aside>
  );
}

function Topbar({ screen, go, onMenu, onSearch }) {
  const crumbs = TITLES[screen] || ["Dashboard"];
  return (
    <header className="topbar">
      <button className="icon-btn" style={{ display: "none" }} id="menuBtn" onClick={onMenu}>
        <Icon name="menu" />
      </button>
      <div className="crumb">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <Icon name="chevR" size={12} className="faint" />}
            <span className={i === crumbs.length - 1 ? "cur" : ""}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <button className="topbar-search" onClick={onSearch}>
        <Icon name="search" size={14} />
        <span>Search…</span>
        <span className="kbd">⌘K</span>
      </button>
      <div className="topbar-spacer" />
      <button className="btn btn-primary btn-sm" onClick={() => go("sales")}>
        <Icon name="plus" size={13} />New Sale
      </button>
      <button className="icon-btn">
        <Icon name="bell" size={17} />
        <span className="dot" />
      </button>
    </header>
  );
}

function CommandPalette({ open, setOpen, go, userName }) {
  const d = DATA;
  const [q, setQ] = React.useState("");
  const [hi, setHi] = React.useState(0);
  const inputRef = React.useRef(null);

  const close = () => { setOpen(false); setQ(""); setHi(0); };
  const run = (fn) => { close(); fn(); };

  const items = React.useMemo(() => {
    const actions = [
      { group: "Actions", label: "New sale",          sub: "Create a sales invoice",   icon: "invoice",   run: () => go("sales")     },
      { group: "Actions", label: "View shipments",    sub: "Inbound deliveries",        icon: "truck",     run: () => go("shipments") },
      { group: "Actions", label: "Check inventory",   sub: "Stock levels & products",   icon: "inventory", run: () => go("inventory") },
    ];
    const navItems = NAV.flatMap(g => g.items).map(it => ({
      group: "Go to", label: it.label, sub: "Page", icon: it.icon, run: () => go(it.k),
    }));
    const custs = d.customers.map(c => ({
      group: "Customers", label: c.name,
      sub: `${c.city} · ${money(c.balance)} balance`,
      icon: "users", run: () => go("customer", { id: c.id }),
    }));
    const prods = d.products.map(p => ({
      group: "Products", label: p.name,
      sub: `${p.sku} · ${p.onHand} on hand`,
      icon: "box", run: () => go("product", { id: p.id }),
    }));
    return [...actions, ...navItems, ...custs, ...prods];
  }, []);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? items.filter(it => (it.label + " " + it.sub).toLowerCase().includes(s))
      : items.slice(0, 10);
    return list.slice(0, 20);
  }, [q, items]);

  React.useEffect(() => {
    if (open) { setQ(""); setHi(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);
  React.useEffect(() => { setHi(0); }, [q]);

  if (!open) return null;

  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && filtered[hi]) { e.preventDefault(); run(filtered[hi].run); }
    else if (e.key === "Escape") close();
  };

  let lastGroup = null;
  return (
    <div className="cmd-backdrop" onMouseDown={close}>
      <div className="cmd" onMouseDown={e => e.stopPropagation()}>
        <div className="cmd-search">
          <Icon name="search" size={18} className="muted" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search customers, products, or jump to a page…" />
          <span className="kbd">esc</span>
        </div>
        <div className="cmd-list">
          {filtered.length === 0 && (
            <div className="empty" style={{ padding: 28 }}>No results for "{q}"</div>
          )}
          {filtered.map((it, i) => {
            const head = it.group !== lastGroup ? (lastGroup = it.group) : null;
            return (
              <React.Fragment key={i}>
                {head && <div className="cmd-group">{head}</div>}
                <button className={"cmd-item" + (i === hi ? " on" : "")}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => run(it.run)}>
                  <div className="cmd-ico"><Icon name={it.icon} size={16} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cmd-label">{it.label}</div>
                    <div className="cmd-sub">{it.sub}</div>
                  </div>
                  {i === hi && <Icon name="arrowR" size={14} className="faint" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="cmd-foot">
          <span><span className="kbd">↑↓</span> navigate</span>
          <span><span className="kbd">↵</span> open</span>
          <span style={{ marginLeft: "auto" }}>{userName || "Guest"} · CC Tobacco</span>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ name }) {
  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
      <div className="empty">
        <Icon name="grid" size={32} />
        <div className="empty-title">{name}</div>
        <div className="empty-desc">Under construction</div>
      </div>
    </div>
  );
}

function NamePrompt({ onSave }) {
  const [name, setName] = React.useState("");
  const save = () => {
    const n = name.trim();
    if (!n) return;
    localStorage.setItem("cc_user_name", n);
    onSave(n);
  };
  return (
    <div className="cmd-backdrop" style={{ zIndex: 9999, backdropFilter: "blur(18px)" }}>
      <div className="cmd" style={{ maxWidth: 380 }}>
        <div style={{ padding: "36px 28px 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 32 }}>
            <div className="brand-mark" style={{ width: 44, height: 44, borderRadius: 11, fontSize: 15 }}>CC</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>CC Tobacco OS</div>
              <div className="muted" style={{ fontSize: 12.5 }}>Distribution Platform</div>
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: 26, marginBottom: 8, letterSpacing: "-0.025em" }}>Iakwe!</div>
          <div className="muted" style={{ fontSize: 13.5, marginBottom: 28, lineHeight: 1.55 }}>
            You've got access. What should we call you?
          </div>
          <input
            className="input"
            placeholder="Your name…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && save()}
            autoFocus
            style={{ fontSize: 15, height: 44, marginBottom: 14 }}
          />
          <button
            className="btn btn-primary"
            style={{ width: "100%", height: 44, fontSize: 14, fontWeight: 600 }}
            disabled={!name.trim()}
            onClick={save}
          >
            Enter OS
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [nav, setNav] = React.useState({ screen: "dashboard", params: {} });
  const [userName, setUserName] = React.useState(() => localStorage.getItem("cc_user_name") || "");
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [cmdOpen, setCmdOpen] = React.useState(false);

  const go = React.useCallback((screen, params = {}) => {
    setNav({ screen, params });
    const c = document.querySelector(".content");
    if (c) c.scrollTop = 0;
  }, []);

  const showToast = React.useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  React.useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setCmdOpen(o => !o);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const REG = {
    dashboard: window.Dashboard,
    inventory: window.Inventory,
    product:   window.ProductDetail,
    shipments: window.Shipments,
    shipment:  window.ShipmentDetail,
    sales:     window.Sales,
    customers: window.Customers,
    customer:  window.CustomerDetail,
  };
  const Screen = REG[nav.screen] || (() => <ComingSoon name={nav.screen} />);
  const ctx = { go, showToast, params: nav.params, userName };

  return (
    <div className={"app" + (mobileOpen ? " sb-open" : "")}>
      <Sidebar screen={nav.screen} go={go} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} userName={userName} />
      <div className="main">
        <Topbar screen={nav.screen} go={go}
          onMenu={() => setMobileOpen(o => !o)}
          onSearch={() => setCmdOpen(true)} />
        <div className="content">
          <Screen {...ctx} />
        </div>
        <footer className="app-footer">
          © {new Date().getFullYear()} Clenny Minor · All Rights Reserved
        </footer>
      </div>
      {toast && (
        <div className="toast-wrap">
          <div className="toast"><Icon name="checkCircle" size={15} />{toast}</div>
        </div>
      )}
      {!userName && <NamePrompt onSave={setUserName} />}
      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} go={go} userName={userName} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
