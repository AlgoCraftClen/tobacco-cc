/* ============================================================
   DASHBOARD — mobile overview (shipments + purchases)
   Defines shared SHIP_V2 status config + buildActivity (loaded first)
   ============================================================ */

/* shared shipment status config (pending / received / disputed) */
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

/* merge shipments + purchases into a chronological activity feed */
function buildActivity(shipments, purchases) {
  const ev = [];
  shipments.forEach(s => {
    ev.push({ kind: "sent", who: s.sender, act: "sent a shipment",
      obj: `${boxWord(s.boxes)} · ${s.brand}`, amount: s.grandTotal, time: s.createdAt,
      pip: "pip-sent", av: "av-3" });
    if (s.status === "received" && s.receivedAt)
      ev.push({ kind: "received", who: s.receiver, act: "received", obj: `${s.brand} shipment`,
        amount: s.grandTotal, time: s.receivedAt, pip: "pip-received", av: "av-1" });
    if (s.status === "disputed" && s.receivedAt)
      ev.push({ kind: "disputed", who: s.receiver, act: "reported an issue on", obj: `${s.brand} shipment`,
        amount: null, time: s.receivedAt, pip: "pip-disputed", av: "av-1" });
  });
  purchases.forEach(p => {
    ev.push({ kind: "purchase", who: p.partner, act: "logged a purchase",
      obj: `${p.cans} cans · ${p.brand}`, amount: p.total, time: p.createdAt,
      pip: "pip-purchase", av: p.partner === "Clanny" ? "av-3" : "av-1" });
  });
  return ev.filter(e => e.time).sort((a, b) => new Date(b.time) - new Date(a.time));
}

function PartnerPurchases({ name, role, av, grizzly, cope }) {
  const total = grizzly + cope;
  const max = Math.max(grizzly, cope, 1);
  return (
    <div className="card card-pad">
      <div className="between mb16">
        <div className="center gap10">
          <Avatar name={name} cls={av} size={34} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
            <div className="faint" style={{ fontSize: 11.5 }}>{role}</div>
          </div>
        </div>
        <div className="mono" style={{ fontWeight: 600, fontSize: 15 }}>{money(total)}</div>
      </div>
      <div className="col gap12">
        <div>
          <div className="between" style={{ marginBottom: 6 }}>
            <span className="center gap6" style={{ fontSize: 12.5 }}><span className="uq uq-case" />Grizzly</span>
            <span className="mono muted" style={{ fontSize: 12 }}>{money(grizzly)}</span>
          </div>
          <Meter value={grizzly} max={max} color="#5b8def" />
        </div>
        <div>
          <div className="between" style={{ marginBottom: 6 }}>
            <span className="center gap6" style={{ fontSize: 12.5 }}><span className="uq uq-roll" />Cope</span>
            <span className="mono muted" style={{ fontSize: 12 }}>{money(cope)}</span>
          </div>
          <Meter value={cope} max={max} color="var(--warn)" />
        </div>
      </div>
    </div>
  );
}

function Dashboard({ role, shipments, purchases, loading, go }) {
  const sent     = shipments.length;
  const value    = shipments.reduce((s, x) => s + x.grandTotal, 0);
  const pending  = shipments.filter(s => s.status === "pending").length;
  const received = shipments.filter(s => s.status === "received").length;

  const pSum = (partner, brand) => purchases
    .filter(p => p.partner === partner && p.brand === brand)
    .reduce((s, p) => s + p.total, 0);
  const clanny = { grizzly: pSum("Clanny", "Grizzly"), cope: pSum("Clanny", "Cope") };
  const clenny = { grizzly: pSum("Clenny", "Grizzly"), cope: pSum("Clenny", "Cope") };
  const purchTotal = purchases.reduce((s, p) => s + p.total, 0);
  const combined = value + purchTotal;

  const activity = buildActivity(shipments, purchases).slice(0, 10);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <div className="page fade-in">
      {/* greeting */}
      <div className="mb20">
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}>
          Iakwe{role ? `, ${role.name}` : "!"}
        </div>
        <div className="page-desc" style={{ marginTop: 4 }}>
          {today}
          <span style={{ color: "var(--pos)", marginLeft: 8 }}>● Live</span>
        </div>
      </div>

      {loading ? (
        <div className="metric-grid">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}
        </div>
      ) : (
        <div className="metric-grid stagger">
          <MetricCard icon="send"  iconBg="var(--accent-soft)" iconColor="var(--accent)" value={fmt(sent)} label="Shipments Sent" onClick={() => go("shipments")} />
          <MetricCard icon="dollar" iconBg="var(--pos-bg)"     iconColor="var(--pos)"    value={fmt(value)} cur label="Total Value" onClick={() => go("shipments")} />
          <MetricCard icon="clock" iconBg="var(--warn-bg)"     iconColor="var(--warn)"   value={fmt(pending)} label="Pending" onClick={() => go("receive")} />
          <MetricCard icon="check" iconBg="var(--info-bg)"     iconColor="var(--info)"   value={fmt(received)} label="Received" onClick={() => go("history")} />
        </div>
      )}

      {/* partner purchases */}
      <div className="sec-head"><span className="sec-title">Purchases by partner</span>
        <span className="sec-link" onClick={() => go("purchases")}>View all <Icon name="chevR" size={12} /></span>
      </div>
      <div className="grid g-2" style={{ gap: 12 }}>
        <PartnerPurchases name="Clanny" role="Sender"   av="av-3" grizzly={clanny.grizzly} cope={clanny.cope} />
        <PartnerPurchases name="Clenny" role="Receiver" av="av-1" grizzly={clenny.grizzly} cope={clenny.cope} />
      </div>

      {/* combined totals */}
      <div className="sec-head"><span className="sec-title">Combined totals</span></div>
      <div className="card card-pad">
        <div className="kv"><span className="k">Shipment value (sent)</span><span className="v mono">{money(value)}</span></div>
        <div className="kv"><span className="k">Personal purchases</span><span className="v mono">{money(purchTotal)}</span></div>
        <div className="kv" style={{ borderTop: "1px solid var(--border-2)" }}>
          <span className="k" style={{ color: "var(--text)", fontWeight: 600 }}>Combined activity</span>
          <span className="v mono" style={{ color: "var(--accent)", fontSize: 16, fontWeight: 700 }}>{money(combined)}</span>
        </div>
      </div>

      {/* recent activity */}
      <div className="sec-head"><span className="sec-title">Recent activity</span>
        <span className="sec-link" onClick={() => go("history")}>History <Icon name="chevR" size={12} /></span>
      </div>
      <div className="card" style={{ paddingTop: 4, paddingBottom: 6 }}>
        {loading ? (
          <div style={{ padding: 16 }}><SkeletonList count={4} /></div>
        ) : activity.length > 0 ? activity.map((a, i) => (
          <div key={i} className="activity-row">
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
        )) : (
          <div className="empty">
            <Icon name="bell" size={28} />
            <div className="empty-title">No activity yet</div>
            <div className="empty-desc">Send a shipment or log a purchase to get started</div>
          </div>
        )}
      </div>

      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

Object.assign(window, { Dashboard, ShipStatus, SHIP_V2, buildActivity, boxWord });
