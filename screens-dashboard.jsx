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
const partnerNames = ["Clanny", "Clenny"];

/* merge all transaction types into a chronological activity feed */
function buildActivity(shipments, purchases, expenses, contributions) {
  const ev = [];
  const shipmentById = new Map((shipments || []).map(s => [s.id, s]));
  (shipments || []).forEach(s => {
    const f = DATA.shipmentFinance(s, expenses);
    ev.push({ kind: "sent", who: s.sender, act: "sent a shipment",
      obj: `${boxWord(s.boxes)} · ${s.brand}`, amount: f.productTotal, time: s.createdAt, pip: "pip-sent", av: "av-3" });
    if (s.status === "received" && s.receivedAt)
      ev.push({ kind: "received", who: s.receiver, act: "received", obj: `${s.brand} shipment`,
        amount: f.productTotal, time: s.receivedAt, pip: "pip-received", av: "av-1" });
    if (s.status === "disputed" && s.receivedAt)
      ev.push({ kind: "disputed", who: s.receiver, act: "reported an issue on", obj: `${s.brand} shipment`,
        amount: null, time: s.receivedAt, pip: "pip-disputed", av: "av-1" });
    if ((Number(s.saleTotal) || 0) > 0 && s.soldAt)
      ev.push({ kind: "sold", who: s.receiver, act: "recorded sales for", obj: `${s.brand} shipment`,
        amount: s.saleTotal, time: s.soldAt, pip: "pip-received", av: "av-1" });
  });
  (purchases || []).forEach(p => {
    ev.push({ kind: "purchase", who: p.partner, act: "logged an older purchase",
      obj: `${p.cans} cans · ${p.brand}`, amount: p.total, time: p.createdAt, pip: "pip-purchase", av: avOf(p.partner) });
  });
  (expenses || []).forEach(e => {
    const kind = DATA.expenseKind(e);
    const meta = DATA.parseExpenseMeta(e) || {};
    const s = shipmentById.get(e.shipmentId);
    if (kind === DATA.EXPENSE_KINDS.PRODUCT) {
      ev.push({ kind: "funding", who: e.partner, act: "funded product",
        obj: s ? `${s.brand} · ${fmt(meta.rolls || 0)} rolls` : `${fmt(meta.cans || 0)} cans`,
        amount: e.amount, time: e.createdAt, pip: "pip-purchase", av: avOf(e.partner) });
    } else if (kind === DATA.EXPENSE_KINDS.DISTRIBUTION) {
      ev.push({ kind: "distribution", who: e.partner, act: "paid distribution cost",
        obj: `${DATA.displayExpenseCategory(e)}${s ? ` · ${s.brand}` : ""}`, amount: e.amount, time: e.createdAt, pip: "pip-disputed", av: avOf(e.partner) });
    } else {
      ev.push({ kind: "expense", who: e.partner, act: e.shipmentId ? "paid shipment cost" : "logged an expense",
        obj: `${DATA.displayExpenseCategory(e)}${s ? ` · ${s.brand}` : ""}`, amount: e.amount, time: e.createdAt, pip: "pip-disputed", av: avOf(e.partner) });
    }
  });
  (contributions || []).forEach(c => {
    ev.push({ kind: "contribution", who: c.partner, act: "added capital",
      obj: c.description || "business cash", amount: c.amount, time: c.createdAt, pip: "pip-received", av: avOf(c.partner) });
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
  const gainy = pos.net >= 0;
  return (
    <div className="list-card">
      <button className="lc-head" onClick={() => setOpen(o => !o)}>
        <Avatar name={name} cls={avOf(name)} size={40} />
        <div className="lc-main">
          <div className="lc-title">{name}</div>
          <div className="lc-sub">{roleLabel}</div>
        </div>
        <div className="lc-amt" style={{ color: gainy ? "var(--pos)" : "var(--danger)" }}>
          {money(pos.net)}<span className="sub">net gain</span>
        </div>
        <Icon name="chevR" size={16} className={"lc-chev" + (open ? " open" : "")} />
      </button>
      {open && (
        <div className="lc-body">
          <div className="kv"><span className="k">Product funded</span><span className="v mono">{money(pos.productFunded)}</span></div>
          <div className="kv"><span className="k">Revenue share</span><span className="v mono">{money(pos.revenueShare)}</span></div>
          <div className="kv"><span className="k">Product gain</span><span className="v mono" style={{ color: pos.productProfit >= 0 ? "var(--pos)" : "var(--danger)" }}>{money(pos.productProfit)}</span></div>
          <div className="kv"><span className="k">Shipment costs paid</span><span className="v mono">{money(pos.shipmentCosts)}</span></div>
          <div className="kv"><span className="k">Distribution costs paid</span><span className="v mono">{money(pos.distributionCosts)}</span></div>
          <div className="kv"><span className="k">Other costs paid</span><span className="v mono">{money(pos.costsPaid - pos.shipmentCosts - pos.distributionCosts)}</span></div>
          <div className="kv" style={{ borderTop: "1px solid var(--border-2)" }}>
            <span className="k" style={{ fontWeight: 600, color: "var(--text)" }}>Net gain after costs</span>
            <span className="v mono" style={{ fontWeight: 700, color: gainy ? "var(--pos)" : "var(--danger)" }}>{money(pos.net)}</span></div>
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
        <MetricCard icon="dollar" iconBg="var(--pos-bg)" iconColor="var(--pos)" value={fmt(pt.revenue)} cur label="Sales revenue" />
        <MetricCard icon="cart" iconBg="var(--accent-soft)" iconColor="var(--accent)" value={fmt(pt.productTotal + pt.manualPurchases)} cur label="Product funded" />
        <MetricCard icon="wallet" iconBg="var(--danger-bg)" iconColor="var(--danger)" value={fmt(pt.extraCosts)} cur label="Extra costs" />
        <MetricCard icon="trendUp" iconBg={lossy ? "var(--danger-bg)" : "var(--pos-bg)"} iconColor={lossy ? "var(--danger)" : "var(--pos)"} value={fmt(pt.netProfit)} cur label={lossy ? "Net loss" : "Net gain"} />
      </div>

      <div className="card card-pad mb16" style={{ borderColor: lossy ? "var(--danger)" : "var(--accent-line)", background: lossy ? "var(--danger-bg)" : "var(--accent-softer)" }}>
        <div className="between">
          <span style={{ fontWeight: 600 }}>{lossy ? "Net loss after all costs" : "Net gain after all costs"}</span>
          <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: lossy ? "var(--danger)" : "var(--pos)" }}>{money(pt.netProfit)}</span>
        </div>
        <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>sales revenue - product funding - shipment/distribution costs</div>
        <div className="kv" style={{ marginTop: 10, borderTop: "1px solid var(--border-2)", paddingTop: 10 }}>
          <span className="k">Sales are allocated by each shipment's funded product share</span><span className="v mono">not 50/50</span>
        </div>
      </div>

      <div className="sec-head"><span className="sec-title">Each partner's position</span></div>
      <div className="grid g-2" style={{ gap: 12 }}>
        {partnerNames.map(name => (
          <PartnerCard key={name} name={name} roleLabel={name === "Clanny" ? "Sender · funds and ships" : "Receiver · sells locally"}
            pos={{
              productFunded: pt.productFunded[name],
              revenueShare: pt.revenueShare[name],
              productProfit: pt.productProfit[name],
              costsPaid: pt.costsPaid[name],
              shipmentCosts: pt.shipmentCostsPaid[name],
              distributionCosts: pt.distributionCostsPaid[name],
              net: pt.netGain[name],
            }} />
        ))}
      </div>
    </div>
  );
}

function Dashboard({ role, shipments, purchases, expenses, contributions, loading, go }) {
  const [seg, setSeg] = React.useState("overview");

  const sent = shipments.length;
  const pt = DATA.computePartnership(shipments, purchases, expenses, contributions);
  const value = pt.productTotal + pt.manualPurchases;
  const pending = shipments.filter(s => s.status === "pending").length;
  const received = shipments.filter(s => s.status === "received").length;
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
              <MetricCard icon="send"   iconBg="var(--accent-soft)" iconColor="var(--accent)" value={fmt(sent)} label="Shipments" onClick={() => go("shipments")} />
              <MetricCard icon="cart"   iconBg="var(--pos-bg)"      iconColor="var(--pos)"    value={fmt(value)} cur label="Product Funded" onClick={() => go("purchases")} />
              <MetricCard icon="clock"  iconBg="var(--warn-bg)"     iconColor="var(--warn)"   value={fmt(pending)} label="Pending" onClick={() => go("receive")} />
              <MetricCard icon="check"  iconBg="var(--info-bg)"     iconColor="var(--info)"   value={fmt(received)} label="Received" onClick={() => go("history")} />
            </div>
          )}
          <div className="card card-pad mt16" onClick={() => setSeg("partnership")} style={{ cursor: "pointer", borderColor: lossy ? "var(--danger)" : "var(--accent-line)" }}>
            <div className="between">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{lossy ? "Net loss" : "Net gain"}</div>
                <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>{money(pt.revenue)} sales - {money(pt.productTotal + pt.manualPurchases)} product - {money(pt.extraCosts)} costs</div>
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
                <div className="empty-desc">Create a shipment, record sales, or log a cost</div>
              </div>
            )}
        </div>
      )}

      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

Object.assign(window, { Dashboard, ShipStatus, SHIP_V2, buildActivity, boxWord, ActivityRow });
