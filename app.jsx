/* ============================================================
   APP — shell · role auth · bottom tabs + sidebar · FAB · ⌘K
   CC Tobacco OS (mobile shipment tracker)
   Clanny = Sender · Clenny = Receiver
   ============================================================ */

const TABS = [
  { k: "dashboard", label: "Dashboard", icon: "home" },
  { k: "shipments", label: "Shipments", icon: "send" },
  { k: "receive",   label: "Receive",   icon: "inbox" },
  { k: "purchases", label: "Purchases", icon: "cart" },
  { k: "history",   label: "History",   icon: "history" },
];
const TITLES = {
  dashboard: "Dashboard", shipments: "Shipments", newshipment: "New Shipment",
  receive: "Receive", purchases: "Purchases", history: "History",
};
// which tab is highlighted for a given screen
const tabFor = (screen) => screen === "newshipment" ? "shipments" : screen;

/* ---- Role selection ---- */
function RoleSelect({ onPick }) {
  return (
    <div className="role-select">
      <div className="role-wrap">
        <div className="role-brand">
          <div className="brand-mark">CC</div>
          <div>
            <div className="brand-name" style={{ fontSize: 15 }}>CC Tobacco OS</div>
            <div className="brand-sub">Shipment Tracker</div>
          </div>
        </div>
        <div className="role-greet">Iakwe!</div>
        <div className="role-q">Who are you?</div>
        <div className="role-grid">
          {["Clanny", "Clenny"].map(name => {
            const r = DATA.ROLES[name];
            return (
              <button key={name} className="role-card" onClick={() => onPick(name)}>
                <div className={"role-av " + r.av}>{initials(name)}</div>
                <div className="role-name">{name}</div>
                <div className="role-role">{r.role}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---- Desktop sidebar ---- */
function Sidebar({ screen, go, role, onSwitchRole }) {
  const active = tabFor(screen);
  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="brand-mark">CC</div>
        <div>
          <div className="brand-name">CC Tobacco</div>
          <div className="brand-sub">Shipment Tracker</div>
        </div>
      </div>
      <nav className="sb-nav">
        <div className="sb-group-label">Menu</div>
        {TABS.map(t => (
          <button key={t.k} className={"nav-item" + (active === t.k ? " active" : "")} onClick={() => go(t.k)}>
            <Icon name={t.icon} size={16} /><span>{t.label}</span>
          </button>
        ))}
        <div style={{ padding: "16px 8px 0" }}>
          <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => go("newshipment")}>
            <Icon name="plus" size={14} />New Shipment
          </button>
        </div>
      </nav>
      <div className="sb-foot">
        <button className="user-card" onClick={onSwitchRole}>
          <Avatar name={role ? role.name : "?"} cls={role ? role.av : "av-3"} size={30} />
          <div className="user-meta">
            <div className="nm">{role ? role.name : "…"}</div>
            <div className="rl">{role ? role.role : "CC Tobacco"}</div>
          </div>
          <Icon name="swap" size={14} className="muted" />
        </button>
      </div>
    </aside>
  );
}

/* ---- Desktop topbar ---- */
function Topbar({ screen, go, onSearch }) {
  return (
    <header className="topbar">
      <div className="crumb"><span className="cur">{TITLES[screen] || "Dashboard"}</span></div>
      <button className="topbar-search" onClick={onSearch}>
        <Icon name="search" size={14} /><span>Search…</span><span className="kbd">⌘K</span>
      </button>
      <div className="topbar-spacer" />
      <button className="btn btn-primary btn-sm" onClick={() => go("newshipment")}>
        <Icon name="plus" size={13} />New Shipment
      </button>
    </header>
  );
}

/* ---- Mobile header ---- */
function MobileHeader({ screen, role, onSwitchRole }) {
  return (
    <header className="m-header">
      <div className="brand-mark">CC</div>
      <div className="m-title">{TITLES[screen] || "CC Tobacco"}</div>
      {role && (
        <button className="m-role-chip" onClick={onSwitchRole}>
          <Avatar name={role.name} cls={role.av} size={22} />
          {role.name}
          <Icon name="swap" size={13} className="faint" />
        </button>
      )}
    </header>
  );
}

/* ---- Bottom tab bar ---- */
function BottomTabs({ screen, go }) {
  const active = tabFor(screen);
  return (
    <nav className="tabbar">
      {TABS.map(t => (
        <button key={t.k} className={"tab" + (active === t.k ? " on" : "")} onClick={() => go(t.k)}>
          <Icon name={t.icon} size={21} />
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ---- Command palette (⌘K) ---- */
function CommandPalette({ open, setOpen, go, openPurchase, onSwitchRole }) {
  const [q, setQ] = React.useState("");
  const [hi, setHi] = React.useState(0);
  const inputRef = React.useRef(null);
  const close = () => { setOpen(false); setQ(""); setHi(0); };
  const run = (fn) => { close(); fn(); };

  const items = React.useMemo(() => ([
    { group: "Actions", label: "New shipment", sub: "Send tobacco to Clenny", icon: "send", run: () => go("newshipment") },
    { group: "Actions", label: "Log purchase", sub: "Record a personal purchase", icon: "cart", run: openPurchase },
    { group: "Actions", label: "Switch role", sub: "Change sender / receiver", icon: "swap", run: onSwitchRole },
    ...TABS.map(t => ({ group: "Go to", label: t.label, sub: "Page", icon: t.icon, run: () => go(t.k) })),
  ]), [go, openPurchase, onSwitchRole]);

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? items.filter(it => (it.label + " " + it.sub).toLowerCase().includes(s)) : items).slice(0, 20);
  }, [q, items]);

  React.useEffect(() => { if (open) { setQ(""); setHi(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);
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
            placeholder="Jump to a page or run an action…" />
          <span className="kbd">esc</span>
        </div>
        <div className="cmd-list">
          {filtered.length === 0 && <div className="empty" style={{ padding: 28 }}>No results for "{q}"</div>}
          {filtered.map((it, i) => {
            const head = it.group !== lastGroup ? (lastGroup = it.group) : null;
            return (
              <React.Fragment key={i}>
                {head && <div className="cmd-group">{head}</div>}
                <button className={"cmd-item" + (i === hi ? " on" : "")} onMouseEnter={() => setHi(i)} onClick={() => run(it.run)}>
                  <div className="cmd-ico"><Icon name={it.icon} size={16} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cmd-label">{it.label}</div>
                    <div className="cmd-sub">{it.sub}</div>
                  </div>
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="cmd-foot">
          <span><span className="kbd">↑↓</span> navigate</span>
          <span><span className="kbd">↵</span> open</span>
          <span style={{ marginLeft: "auto" }}>CC Tobacco OS</span>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ name }) {
  return (
    <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 360 }}>
      <div className="empty">
        <Icon name="grid" size={32} />
        <div className="empty-title">{name}</div>
        <div className="empty-desc">Under construction</div>
      </div>
    </div>
  );
}

/* ---- Global add-transaction sheets (used by the FAB menu) ---- */
function PartnerPick({ partner, setPartner, label }) {
  return (
    <div className="field mb16">
      <label className="label">{label || "Who paid?"}</label>
      <div className="choice-row">
        {["Clanny", "Clenny"].map(p => (
          <button key={p} className={"choice" + (partner === p ? " on" : "")} onClick={() => setPartner(p)} style={{ minHeight: 70 }}>
            <Avatar name={p} cls={p === "Clanny" ? "av-3" : "av-1"} size={28} />
            <div className="choice-name">{p}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function AddContributionSheet({ open, onClose, role, showToast, refresh }) {
  const [partner, setPartner] = React.useState(role ? role.name : "Clanny");
  const [amount, setAmount] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { if (open) { setPartner(role ? role.name : "Clanny"); setAmount(""); setDesc(""); } }, [open, role]);
  const valid = Number(amount) > 0;
  const save = async () => {
    setSaving(true);
    try {
      await DB.contributions.insert({ partner, amount: Number(amount) || 0, description: desc.trim() });
      await refresh(); showToast("Contribution added"); onClose();
    } catch (e) { showToast("Couldn't save — check connection"); }
    setSaving(false);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Add contribution" icon="dollar">
      <PartnerPick partner={partner} setPartner={setPartner} label="Who invested?" />
      <div className="field mb16">
        <label className="label">Amount</label>
        <div className="bignum-wrap"><span className="bignum-cur">$</span>
          <input className="bignum prefixed" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus /></div>
      </div>
      <div className="field mb16">
        <label className="label">Description</label>
        <input className="input" style={{ height: 46, fontSize: 15 }} placeholder="e.g. Startup capital" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <button className="btn btn-primary" style={{ width: "100%", height: 48 }} onClick={save} disabled={!valid || saving}>
        <Icon name="check" size={15} />{saving ? "Saving…" : "Save Contribution"}
      </button>
    </Sheet>
  );
}

function AddExpenseSheet({ open, onClose, role, showToast, refresh }) {
  const [partner, setPartner] = React.useState(role ? role.name : "Clanny");
  const [amount, setAmount] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { if (open) { setPartner(role ? role.name : "Clanny"); setAmount(""); setDesc(""); } }, [open, role]);
  const valid = Number(amount) > 0;
  const save = async () => {
    setSaving(true);
    try {
      await DB.expenses.insert({ partner, amount: Number(amount) || 0, description: desc.trim() });
      await refresh(); showToast("Expense logged"); onClose();
    } catch (e) { showToast("Couldn't save — check connection"); }
    setSaving(false);
  };
  return (
    <Sheet open={open} onClose={onClose} title="Log expense" icon="wallet">
      <PartnerPick partner={partner} setPartner={setPartner} />
      <div className="field mb16">
        <label className="label">Amount</label>
        <div className="bignum-wrap"><span className="bignum-cur">$</span>
          <input className="bignum prefixed" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} autoFocus /></div>
      </div>
      <div className="field mb16">
        <label className="label">Description</label>
        <input className="input" style={{ height: 46, fontSize: 15 }} placeholder="e.g. Freight, fuel, delivery" value={desc} onChange={e => setDesc(e.target.value)} />
      </div>
      <button className="btn btn-primary" style={{ width: "100%", height: 48 }} onClick={save} disabled={!valid || saving}>
        <Icon name="check" size={15} />{saving ? "Saving…" : "Save Expense"}
      </button>
    </Sheet>
  );
}

function App() {
  const [roleName, setRoleName] = React.useState(() => localStorage.getItem("cc_role") || "");
  const [nav, setNav] = React.useState({ screen: "dashboard", params: {} });
  const [data, setData] = React.useState({ shipments: [], purchases: [], expenses: [], contributions: [], loading: true });
  const [toast, setToast] = React.useState(null);
  const [cmdOpen, setCmdOpen] = React.useState(false);
  const [roleSheet, setRoleSheet] = React.useState(false);
  const [fabOpen, setFabOpen] = React.useState(false);
  const [modal, setModal] = React.useState(null);
  const [ptr, setPtr] = React.useState(false);
  const contentRef = React.useRef(null);

  const role = DATA.roleOf(roleName);

  const go = React.useCallback((screen, params = {}) => {
    setNav({ screen, params });
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, []);

  const showToast = React.useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }, []);

  const refresh = React.useCallback(async () => {
    const [shipments, purchases, expenses, contributions] = await Promise.all([
      DB.shipments.list(), DB.purchases.list(), DB.expenses.list(), DB.contributions.list(),
    ]);
    DATA.shipments = shipments; DATA.purchases = purchases; DATA.expenses = expenses; DATA.contributions = contributions;
    setData({ shipments, purchases, expenses, contributions, loading: false });
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  // ⌘K command palette
  React.useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const pickRole = (name) => { localStorage.setItem("cc_role", name); setRoleName(name); setRoleSheet(false); };
  const openPurchase = () => setModal("purchase");
  const fabActions = [
    { label: "New Shipment",     icon: "send",   run: () => go("newshipment") },
    { label: "Log Purchase",     icon: "cart",   run: () => setModal("purchase") },
    { label: "Log Expense",      icon: "wallet", run: () => setModal("expense") },
    { label: "Add Contribution", icon: "dollar", run: () => setModal("contribution") },
  ];

  // lightweight pull-to-refresh (touch)
  const ptrState = React.useRef({ y: 0, pulling: false });
  const onTouchStart = (e) => {
    const el = contentRef.current;
    if (el && el.scrollTop <= 0) { ptrState.current = { y: e.touches[0].clientY, pulling: true }; }
  };
  const onTouchMove = (e) => {
    if (!ptrState.current.pulling) return;
    const dy = e.touches[0].clientY - ptrState.current.y;
    setPtr(dy > 64);
  };
  const onTouchEnd = async () => {
    if (ptrState.current.pulling && ptr) { await refresh(); }
    ptrState.current.pulling = false; setPtr(false);
  };

  if (!role) return <RoleSelect onPick={pickRole} />;

  const REG = {
    dashboard: window.Dashboard,
    shipments: window.Shipments,
    newshipment: window.NewShipment,
    receive: window.Receive,
    purchases: window.Purchases,
    history: window.History,
  };
  const Screen = REG[nav.screen] || (() => <ComingSoon name={nav.screen} />);
  const ctx = {
    go, screen: nav.screen, params: nav.params, role,
    showToast, refresh,
    shipments: data.shipments, purchases: data.purchases,
    expenses: data.expenses, contributions: data.contributions, loading: data.loading,
  };

  return (
    <div className="app">
      <Sidebar screen={nav.screen} go={go} role={role} onSwitchRole={() => setRoleSheet(true)} />
      <div className="main">
        <Topbar screen={nav.screen} go={go} onSearch={() => setCmdOpen(true)} />
        <MobileHeader screen={nav.screen} role={role} onSwitchRole={() => setRoleSheet(true)} />
        <div className="content" ref={contentRef}
          onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <div className={"ptr" + (ptr ? " on" : "")}><Icon name="refresh" size={15} />Release to refresh</div>
          <Screen {...ctx} />
        </div>
        <footer className="app-footer">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</footer>
      </div>

      <BottomTabs screen={nav.screen} go={go} />
      {nav.screen !== "newshipment" && (
        <button className="fab" onClick={() => setFabOpen(true)} aria-label="Add">
          <Icon name="plus" size={25} />
        </button>
      )}

      <Sheet open={fabOpen} onClose={() => setFabOpen(false)} title="Add">
        <div className="col gap10">
          {fabActions.map(a => (
            <button key={a.label} className="btn" style={{ width: "100%", height: 54, justifyContent: "flex-start", gap: 12, fontSize: 14.5 }}
              onClick={() => { setFabOpen(false); a.run(); }}>
              <div className="lc-ico" style={{ width: 34, height: 34, borderRadius: 10 }}><Icon name={a.icon} size={17} /></div>
              {a.label}
            </button>
          ))}
        </div>
      </Sheet>

      <AddPurchaseSheet open={modal === "purchase"} onClose={() => setModal(null)} role={role} showToast={showToast} refresh={refresh} />
      <AddExpenseSheet open={modal === "expense"} onClose={() => setModal(null)} role={role} showToast={showToast} refresh={refresh} />
      <AddContributionSheet open={modal === "contribution"} onClose={() => setModal(null)} role={role} showToast={showToast} refresh={refresh} />

      {toast && (
        <div className="toast-wrap">
          <div className="toast"><Icon name="checkCircle" size={15} />{toast}</div>
        </div>
      )}

      <CommandPalette open={cmdOpen} setOpen={setCmdOpen} go={go}
        openPurchase={openPurchase} onSwitchRole={() => setRoleSheet(true)} />

      <Sheet open={roleSheet} onClose={() => setRoleSheet(false)} title="Switch role" icon="swap">
        <div className="role-q" style={{ marginBottom: 16 }}>Clanny is the Sender · Clenny is the Receiver.</div>
        <div className="role-grid">
          {["Clanny", "Clenny"].map(name => {
            const r = DATA.ROLES[name];
            return (
              <button key={name} className="role-card"
                style={roleName === name ? { borderColor: "var(--accent-line)", background: "var(--accent-softer)" } : undefined}
                onClick={() => pickRole(name)}>
                <div className={"role-av " + r.av}>{initials(name)}</div>
                <div className="role-name">{name}</div>
                <div className="role-role">{r.role}</div>
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
