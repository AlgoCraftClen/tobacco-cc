/* ============================================================
   DASHBOARD — Overview · Partnership · Activity (segmented)
   Also defines shared SHIP_V2 / ShipStatus / buildActivity / boxWord
   ============================================================ */

const SHIP_V2 = {
  pending:  { label: "Pending",  cls: "warn",   pip: "pip-sent",     color: "var(--warn)"   },
  received: { label: "Received", cls: "pos",    pip: "pip-received", color: "var(--pos)"    },
  disputed: { label: "Disputed", cls: "danger", pip: "pip-disputed", color: "var(--danger)" },
};
function ShipStatus({ status }) {
  const s = SHIP_V2[status] || SHIP_V2.pending;
  return <Badge kind={s.cls}>{s.label}</Badge>;
}
const boxWord = (n) => n + " " + (Number(n) === 1 ? "box" : "boxes");
const avOf = (partner) => (partner === "Clanny" ? "av-3" : "av-1");

/* merge all transaction types into a chronological activity feed */
function buildActivity(shipments, purchases, expenses, contributions) {
  const ev = [];
  (shipments || []).forEach(s => {
    ev.push({ kind: "sent", who: s.sender, act: "sent a shipment",
      obj: `${boxWord(s.boxes)} · ${s.brand}`, amount: s.grandTotal, time: s.createdAt, pip: "pip-sent", av: "av-3" });
    if (s.status === "received" && s.receivedAt)
      ev.push({ kind: "received", who: s.receiver, act: "received", obj: `${s.brand} shipment`,
        amount: s.grandTotal, time: s.receivedAt, pip: "pip-received", av: "av-1" });
    if (s.status === "disputed" && s.receivedAt)
      ev.push({ kind: "disputed", who: s.receiver, act: "reported an issue on", obj: `${s.brand} shipment`,
        amount: null, time: s.receivedAt, pip: "pip-disputed", av: "av-1" });
    if ((Number(s.saleTotal) || 0) > 0 && s.soldAt)
      ev.push({ kind: "sold", who: s.receiver, act: "sold", obj: `${s.brand} shipment`,
        amount: s.saleTotal, time: s.soldAt, pip: "pip-received", av: "av-1" });
  });
  (purchases || []).forEach(p => {
    ev.push({ kind: "purchase", who: p.partner, act: "logged a purchase",
      obj: `${p.cans} cans · ${p.brand}`, amount: p.total, time: p.createdAt, pip: "pip-purchase", av: avOf(p.partner) });
  });
  (expenses || []).forEach(e => {
    ev.push({ kind: "expense", who: e.partner, act: "logged an expense",
      obj: e.description || e.category || "expense", amount: e.amount, time: e.createdAt, pip: "pip-disputed", av: avOf(e.partner) });
  });
  (contributions || []).forEach(c => {
    ev.push({ kind: "contribution", who: c.partner, act: "added a contribution",
      obj: c.description || "capital", amount: c.amount, time: c.createdAt, pip: "pip-received", av: avOf(c.partner) });
  });
  return ev.filter(e => e.time).sort((a, b) => new Date(b.time) - new Date(a.time));
}

function ActivityRow({ a }) {
  return (
    <div className="activity-row">
      <span className={"activity-pip " + a.pip} />
      <Avatar name={a.who} cls={a.av} size={28} />
      <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, minWidth: 0 }}>
        <span style={{ fontWeight: 600 }}>{a.who}</span>
        <span className="muted"> {a.act} </span>
        <span style={{ color: "var(--accent)", fontWeight: 500 }}>{a.obj}</span>
      </div>
      {a.amount != null && <span className="mono faint" style={{ fontSize: 11.5, flexShrink: 0 }}>{money(a.amount)}</span>}
      <span className="faint mono" style={{ fontSize: 10, flexShrink: 0, marginLeft: 6 }}>{relTime(a.time)}</span>
    </div>
  );
}

/* ---- Partnership: per-partner financial position (expandable) ---- */
function PartnerCard({ name, roleLabel, pos }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="list-card">
      <button className="lc-head" onClick={() => setOpen(o => !o)}>
        <Avatar name={name} cls={avOf(name)} size={40} />
        <div className="lc-main">
          <div className="lc-title">{name}</div>
          <div className="lc-sub">{roleLabel}</div>
        </div>
        <div className="lc-amt" style={{ color: pos.net >= 0 ? "var(--text)" : "var(--danger)" }}>
          {money(pos.net)}<span className="sub">net position</span>
        </div>
        <Icon name="chevR" size={16} className={"lc-chev" + (open ? " open" : "")} />
      </button>
      {open && (
        <div className="lc-body">
          <div className="kv"><span className="k">Invested (contributions)</span><span className="v mono">{money(pos.invested)}</span></div>
          <div className="kv"><span className="k">Expenses paid for business</span><span className="v mono">{money(pos.expenses)}</span></div>
          <div className="kv"><span className="k">{pos.share >= 0 ? "Profit share (50%)" : "Loss share (50%)"}</span>
            <span className="v mono" style={{ color: pos.share >= 0 ? "var(--pos)" : "var(--danger)" }}>{money(pos.share)}</span></div>
          <div className="kv" style={{ borderTop: "1px solid var(--border-2)" }}>
            <span className="k" style={{ fontWeight: 600, color: "var(--text)" }}>Net position</span>
            <span className="v mono" style={{ fontWeight: 700 }}>{money(pos.net)}</span></div>
        </div>
      )}
    </div>
  );
}

function PartnershipView({ pt }) {
  const lossy = pt.netProfit < 0;
  return (
    <div className="fade-in">
      <div className="metric-grid mb12">
        <MetricCard icon="dollar" iconBg="var(--pos-bg)" iconColor="var(--pos)" value={fmt(pt.revenue)} cur label="Total revenue" />
        <MetricCard icon="wallet" iconBg="var(--danger-bg)" iconColor="var(--danger)" value={fmt(pt.totalExpenses)} cur label="Total expenses" />
      </div>

      <div className="card card-pad mb16" style={{ borderColor: lossy ? "var(--danger)" : "var(--accent-line)", background: lossy ? "var(--danger-bg)" : "var(--accent-softer)" }}>
        <div className="between">
          <span style={{ fontWeight: 600 }}>{lossy ? "Net loss" : "Net profit"}</span>
          <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: lossy ? "var(--danger)" : "var(--pos)" }}>{money(pt.netProfit)}</span>
        </div>
        <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>revenue − expenses · split 50/50 ({money(pt.sharePer)} each)</div>
        <div className="kv" style={{ marginTop: 10, borderTop: "1px solid var(--border-2)", paddingTop: 10 }}>
          <span className="k">Total invested (both partners)</span><span className="v mono">{money(pt.totalContributions)}</span>
        </div>
      </div>

      <div className="sec-head"><span className="sec-title">Each partner's position</span></div>
      <div className="grid g-2" style={{ gap: 12 }}>
        <PartnerCard name="Clanny" roleLabel="Sender · funds shipments"
          pos={{ invested: pt.contributed.Clanny, expenses: pt.expensesPaid.Clanny, share: pt.sharePer, net: pt.netPosition.Clanny }} />
        <PartnerCard name="Clenny" roleLabel="Receiver · sells locally"
          pos={{ invested: pt.contributed.Clenny, expenses: pt.expensesPaid.Clenny, share: pt.sharePer, net: pt.netPosition.Clenny }} />
      </div>
    </div>
  );
}

function Dashboard({ role, shipments, purchases, expenses, contributions, loading, go }) {
  const [seg, setSeg] = React.useState("overview");

  const sent     = shipments.length;
  const value    = shipments.reduce((s, x) => s + x.grandTotal, 0);
  const pending  = shipments.filter(s => s.status === "pending").length;
  const received = shipments.filter(s => s.status === "received").length;
  const pt = DATA.computePartnership(shipments, purchases, expenses, contributions);
  const activity = buildActivity(shipments, purchases, expenses, contributions).slice(0, 12);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  const lossy = pt.netProfit < 0;

  return (
    <div className="page fade-in">
      {/* greeting */}
      <div className="mb16">
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}>Iakwe{role ? `, ${role.name}` : "!"}</div>
        <div className="page-desc" style={{ marginTop: 4 }}>{today}<span style={{ color: "var(--pos)", marginLeft: 8 }}>● Live</span></div>
      </div>

      {/* segmented control */}
      <div className="seg mb16" style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
        {[["overview", "Overview"], ["partnership", "Partnership"], ["activity", "Activity"]].map(([k, l]) => (
          <button key={k} className={seg === k ? "on" : ""} onClick={() => setSeg(k)}>{l}</button>
        ))}
      </div>

      {seg === "overview" && (
        <div className="fade-in">
          {loading ? (
            <div className="metric-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}</div>
          ) : (
            <div className="metric-grid stagger">
              <MetricCard icon="send"   iconBg="var(--accent-soft)" iconColor="var(--accent)" value={fmt(sent)} label="Shipments Sent" onClick={() => go("shipments")} />
              <MetricCard icon="dollar" iconBg="var(--pos-bg)"      iconColor="var(--pos)"    value={fmt(value)} cur label="Shipment Value" onClick={() => go("shipments")} />
              <MetricCard icon="clock"  iconBg="var(--warn-bg)"     iconColor="var(--warn)"   value={fmt(pending)} label="Pending" onClick={() => go("receive")} />
              <MetricCard icon="check"  iconBg="var(--info-bg)"     iconColor="var(--info)"   value={fmt(received)} label="Received" onClick={() => go("history")} />
            </div>
          )}
          {/* net profit teaser → opens Partnership */}
          <div className="card card-pad mt16" onClick={() => setSeg("partnership")} style={{ cursor: "pointer", borderColor: lossy ? "var(--danger)" : "var(--accent-line)" }}>
            <div className="between">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{lossy ? "Net loss" : "Net profit"}</div>
                <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{money(pt.revenue)} revenue − {money(pt.totalExpenses)} expenses</div>
              </div>
              <div className="center gap6">
                <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: lossy ? "var(--danger)" : "var(--pos)" }}>{money(pt.netProfit)}</span>
                <Icon name="chevR" size={15} className="faint" />
              </div>
            </div>
          </div>
        </div>
      )}

      {seg === "partnership" && (loading ? <SkeletonList count={4} /> : <PartnershipView pt={pt} />)}

      {seg === "activity" && (
        <div className="card fade-in" style={{ paddingTop: 4, paddingBottom: 6 }}>
          {loading ? <div style={{ padding: 16 }}><SkeletonList count={5} /></div>
            : activity.length > 0 ? activity.map((a, i) => <ActivityRow key={i} a={a} />)
            : (
              <div className="empty">
                <Icon name="bell" size={28} />
                <div className="empty-title">No activity yet</div>
                <div className="empty-desc">Send a shipment, log a purchase/expense, or add a contribution</div>
              </div>
            )}
        </div>
      )}

      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

Object.assign(window, { Dashboard, ShipStatus, SHIP_V2, buildActivity, boxWord, ActivityRow });
