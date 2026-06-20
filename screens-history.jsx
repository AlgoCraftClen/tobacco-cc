/* ============================================================
   HISTORY — chronological activity log
   Shipments, funding, costs, sales, contributions
   ============================================================ */

function dayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const KIND_ICON = {
  sent:         { icon: "send",   bg: "var(--info-bg)",     color: "var(--info)" },
  received:     { icon: "check",  bg: "var(--pos-bg)",      color: "var(--pos)" },
  disputed:     { icon: "alert",  bg: "var(--danger-bg)",   color: "var(--danger)" },
  sold:         { icon: "dollar", bg: "var(--pos-bg)",      color: "var(--pos)" },
  purchase:     { icon: "cart",   bg: "var(--accent-soft)", color: "var(--accent)" },
  funding:      { icon: "cart",   bg: "var(--accent-soft)", color: "var(--accent)" },
  distribution: { icon: "truck",  bg: "var(--danger-bg)",   color: "var(--danger)" },
  expense:      { icon: "wallet", bg: "var(--danger-bg)",   color: "var(--danger)" },
  contribution: { icon: "dollar", bg: "var(--accent-soft)", color: "var(--accent)" },
};

function History({ shipments, purchases, expenses, contributions, loading, go, showToast, refresh }) {
  const [scope, setScope] = React.useState("all");
  const [confirm, setConfirm] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const SHIP_KINDS = ["sent", "received", "disputed", "sold"];
  const all = buildActivity(shipments, purchases, expenses, contributions);

  const clearAll = async () => {
    setClearing(true);
    try {
      await DB.clearAll();
      await refresh();
      showToast("All data cleared");
      setConfirm(false);
    } catch (e) { showToast("Couldn't clear — check connection"); }
    setClearing(false);
  };
  const events = scope === "all" ? all
    : scope === "shipments" ? all.filter(e => SHIP_KINDS.includes(e.kind))
    : all.filter(e => !SHIP_KINDS.includes(e.kind));

  // group by day label, preserving chronological order
  const groups = [];
  events.forEach(e => {
    const label = dayLabel(e.time);
    let g = groups[groups.length - 1];
    if (!g || g.label !== label) { g = { label, items: [] }; groups.push(g); }
    g.items.push(e);
  });

  return (
    <div className="page fade-in">
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">History</div>
          <div className="page-desc">{all.length} event{all.length !== 1 ? "s" : ""} · shipments, funding, sales, costs</div>
        </div>
        {all.length > 0 && (
          <div className="page-head-actions">
            <button className="btn btn-sm btn-danger" onClick={() => setConfirm(true)}>
              <Icon name="trash" size={13} />Clear all
            </button>
          </div>
        )}
      </div>

      <div className="seg mb16" style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
        {[["all", "All"], ["shipments", "Shipments"], ["finance", "Finance"]].map(([k, l]) => (
          <button key={k} className={scope === k ? "on" : ""} onClick={() => setScope(k)}>{l}</button>
        ))}
      </div>

      {loading ? <SkeletonList count={6} /> :
        groups.length > 0 ? groups.map((g, gi) => (
          <div key={gi} style={{ marginBottom: 6 }}>
            <div className="steplabel" style={{ margin: "14px 2px 8px" }}>{g.label}</div>
            <div className="card" style={{ paddingTop: 4, paddingBottom: 4 }}>
              {g.items.map((a, i) => {
                const ki = KIND_ICON[a.kind] || KIND_ICON.sent;
                return (
                  <div key={i} className="activity-row">
                    <div className="lc-ico" style={{ width: 34, height: 34, borderRadius: 10, background: ki.bg, color: ki.color }}>
                      <Icon name={ki.icon} size={15} />
                    </div>
                    <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, minWidth: 0 }}>
                      <span style={{ fontWeight: 600 }}>{a.who}</span>
                      <span className="muted"> {a.act} </span>
                      <span style={{ color: "var(--accent)", fontWeight: 500 }}>{a.obj}</span>
                      <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{fmtDate(a.time, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                    </div>
                    {a.amount != null && <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>{money(a.amount)}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )) : (
          <div className="empty">
            <Icon name="history" size={30} />
            <div className="empty-title">Nothing here yet</div>
            <div className="empty-desc">Your shipment, funding, sale, and cost history will build up over time</div>
          </div>
        )}

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Clear all data" icon="trash">
        <div className="step-hint" style={{ marginBottom: 18 }}>
          This permanently deletes <strong>all shipments, funding records, older purchases, expenses, and contributions</strong> for both partners. This cannot be undone.
        </div>
        <div className="lc-actions" style={{ padding: 0, border: "none" }}>
          <button className="btn" onClick={() => setConfirm(false)} disabled={clearing}>Cancel</button>
          <button className="btn btn-danger" onClick={clearAll} disabled={clearing}>
            <Icon name="trash" size={15} />{clearing ? "Clearing…" : "Clear everything"}
          </button>
        </div>
      </Sheet>

      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

Object.assign(window, { History });
