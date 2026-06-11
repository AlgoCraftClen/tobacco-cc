/* ============================================================
   INCOMING — inbound deliveries from Washington supplier
   ============================================================ */

function Shipments({ go, params, showToast }) {
  const [shipments, setShipments] = React.useState([]);
  const [tab, setTab]   = React.useState("All");
  const [showNew, setShowNew] = React.useState(!!params?.openNew);

  React.useEffect(() => {
    Promise.all([DB.shipments.list(), DB.products.list()]).then(([shipRows, prodRows]) => {
      DATA.shipments = shipRows;
      DATA.products  = prodRows;
      setShipments(shipRows);
    });
  }, []);

  const tabs   = ["All", "On the Way", "Arriving", "Received"];
  const tabMap = { "On the Way": "in_transit", Arriving: "arriving", Received: "received" };
  const list   = shipments.filter(s => tab === "All" || s.status === tabMap[tab]);
  const pending = shipments.filter(s => s.status !== "received").length;

  const deleteShipment = async (id, e) => {
    e.stopPropagation();
    await DB.shipments.delete(id);
    const updated = shipments.filter(s => s.id !== id);
    DATA.shipments = updated;
    setShipments(updated);
    showToast && showToast("Delivery removed");
  };

  const nextId = React.useMemo(() => {
    const nums = shipments.map(s => parseInt(s.id.replace("SH-", "")) || 0);
    return "SH-" + (Math.max(0, ...nums) + 1);
  }, [shipments]);

  return (
    <div className="page page-wide fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Incoming</div>
          <div className="page-desc">
            {pending} pending · {shipments.filter(s => s.status === "arriving").length} arriving today
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Icon name="plus" size={14} />Log Delivery
          </button>
        </div>
      </div>

      {/* Arriving spotlight */}
      {shipments.find(s => s.status === "arriving") && (() => {
        const sh = shipments.find(s => s.status === "arriving");
        return (
          <div className="spotlight mb20">
            <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, minWidth: 0 }}>
              <div className="spotlight-ico"><Icon name="truck" size={22} /></div>
              <div style={{ minWidth: 0 }}>
                <div className="center gap10 mb4">
                  <span style={{ fontWeight: 600, fontSize: 14.5 }}>{sh.id} · {sh.supplier}</span>
                  <Badge kind="accent">Arriving {sh.eta.replace("Today, ", "")}</Badge>
                </div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  {sh.cases} cases · {sh.po && sh.po !== "—" ? sh.po : ""} · {money(sh.value)}
                </div>
              </div>
            </div>
            <div className="center gap8" style={{ flexShrink: 0 }}>
              <button className="btn btn-primary" onClick={() => go("shipment", { id: sh.id })}>
                <Icon name="check" size={14} />Receive
              </button>
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="seg mb16">
        {tabs.map(t => (
          <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {t}
            {t !== "All" && (() => {
              const cnt = shipments.filter(s => s.status === tabMap[t]).length;
              return cnt > 0 ? <span className="nav-badge" style={{ marginLeft: 6, background: "var(--panel-3)" }}>{cnt}</span> : null;
            })()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Delivery</th>
              <th>From</th>
              <th>Contents</th>
              <th>Status</th>
              <th>Expected</th>
              <th className="num">Cases</th>
              <th className="num">Value</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(s => (
              <tr key={s.id} onClick={() => go("shipment", { id: s.id })}>
                <td>
                  <span className="mono td-strong" style={{ fontSize: 12.5 }}>{s.id}</span>
                </td>
                <td className="td-strong">{s.supplier}</td>
                <td className="muted" style={{ fontSize: 12.5, maxWidth: 200 }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.po && s.po !== "—" ? s.po : "—"}
                  </span>
                </td>
                <td><ShipBadge status={s.status} /></td>
                <td className="muted" style={{ fontSize: 12.5 }}>{s.eta}</td>
                <td className="num mono td-strong">{s.cases}</td>
                <td className="num mono">{money(s.value)}</td>
                <td><Icon name="chevR" size={14} className="row-arrow" /></td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm btn-icon btn-ghost btn-danger"
                    onClick={e => deleteShipment(s.id, e)}
                    title="Remove delivery">
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="empty">
            <Icon name="truck" size={28} />
            <div className="empty-title">No deliveries in this view</div>
            <div className="empty-desc">Log an incoming delivery to track what's on the way</div>
          </div>
        )}
      </div>

      {showNew && (
        <NewShipmentDrawer
          nextId={nextId}
          preProduct={params?.preProduct}
          onClose={() => setShowNew(false)}
          onSave={async (sh) => {
            await DB.shipments.insert(sh);
            DATA.shipments = [sh, ...DATA.shipments];
            setShipments(ss => [sh, ...ss]);
            setShowNew(false);
            showToast && showToast("Delivery logged: " + sh.id);
          }}
        />
      )}
    </div>
  );
}

function NewShipmentDrawer({ nextId, preProduct, onClose, onSave }) {
  const d = DATA;
  const [from, setFrom]   = React.useState("");
  const [eta, setEta]     = React.useState("");
  const [value, setValue] = React.useState("");
  const [lines, setLines] = React.useState([{ product: preProduct || "", cases: "" }]);

  const addLine    = () => setLines(ls => [...ls, { product: "", cases: "" }]);
  const removeLine = (i) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const updateLine = (i, f, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [f]: v } : l));

  const totalCases = lines.reduce((s, l) => s + (parseInt(l.cases) || 0), 0);
  const contents   = lines.filter(l => l.product && l.cases)
                         .map(l => `${l.product} × ${l.cases}`)
                         .join(", ");

  const canSave = from.trim() && totalCases > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: nextId,
      supplier: from.trim(),
      po: contents || "—",
      carrier: "—",
      cases: totalCases,
      value: Number(value) || 0,
      eta: eta.trim() || "TBD",
      dock: "—",
      lines: lines.filter(l => l.product).length,
      status: "in_transit",
    });
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <div className="drawer-title">Log Incoming Delivery</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{nextId}</div>
          </div>
          <button className="btn btn-sm btn-icon btn-ghost" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-label">Delivery Info</div>
            <div className="col gap12">
              <div className="field">
                <label className="label">From *</label>
                <input className="input" placeholder="e.g. Washington"
                  value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Expected Arrival</label>
                <input className="input" placeholder="e.g. June 14 or This Friday"
                  value={eta} onChange={e => setEta(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">
              <span>What's Coming</span>
              {totalCases > 0 && (
                <span className="muted" style={{ marginLeft: 8, fontWeight: 400 }}>
                  {totalCases} case{totalCases !== 1 ? "s" : ""} total
                </span>
              )}
            </div>
            {lines.map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 32px", gap: 8, marginBottom: 10 }}>
                <select className="select" value={l.product}
                  onChange={e => updateLine(i, "product", e.target.value)}>
                  <option value="">Product…</option>
                  {d.products.map(p => <option key={p.id}>{p.name}</option>)}
                </select>
                <input className="input mono" type="number" min="1" placeholder="Cases"
                  value={l.cases} onChange={e => updateLine(i, "cases", e.target.value)}
                  style={{ textAlign: "center" }} />
                <button className="btn btn-sm btn-icon btn-ghost btn-danger"
                  onClick={() => removeLine(i)} disabled={lines.length === 1}>
                  <Icon name="x" size={13} />
                </button>
              </div>
            ))}
            <button className="btn btn-sm btn-ghost mt8" onClick={addLine}>
              <Icon name="plus" size={13} />Add Product
            </button>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Optional</div>
            <div className="field">
              <label className="label">Estimated Value ($)</label>
              <input className="input mono" type="number" min="0" placeholder="0"
                value={value} onChange={e => setValue(e.target.value)} />
            </div>
          </div>

          <div className="drawer-section">
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                disabled={!canSave}
                onClick={handleSave}>
                <Icon name="truck" size={14} />Log Delivery
              </button>
              <button className="btn" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ShipmentDetail({ go, params, showToast }) {
  const [shipments, setShipments] = React.useState(DATA.shipments);
  const sh = shipments.find(s => s.id === params.id);
  const [done, setDone] = React.useState(sh?.status === "received");

  if (!sh) {
    return (
      <div className="page fade-in">
        <button className="btn btn-sm btn-ghost mb16" onClick={() => go("shipments")}>
          <Icon name="chevL" size={13} />Incoming
        </button>
        <div className="empty"><Icon name="truck" size={28} /><div className="empty-title">Delivery not found</div></div>
      </div>
    );
  }

  const handleReceive = async () => {
    // Parse contents string: "Grizzly Long Cut × 10, Copenhagen Snuff × 5"
    const items = (sh.po && sh.po !== "—")
      ? sh.po.split(", ").map(s => {
          const idx = s.lastIndexOf(" × ");
          return { name: s.slice(0, idx), cases: parseInt(s.slice(idx + 3)) || 0 };
        }).filter(i => i.cases > 0)
      : [];

    // Increment on_hand for each product in the delivery
    for (const item of items) {
      const prod = DATA.products.find(p => p.name === item.name);
      if (prod) {
        const newOnHand = prod.onHand + item.cases;
        const newStatus = newOnHand <= 0 ? "critical" : (prod.reorder > 0 && newOnHand < prod.reorder) ? "low" : "ok";
        await DB.products.update(prod.id, { on_hand: newOnHand, status: newStatus });
        prod.onHand = newOnHand;
        prod.status = newStatus;
      }
    }

    await DB.shipments.update(sh.id, { status: "received" });
    const updated = DATA.shipments.map(s => s.id === sh.id ? { ...s, status: "received" } : s);
    DATA.shipments = updated;
    setShipments(updated);
    setDone(true);
    const msg = items.length > 0
      ? `${sh.id} received — ${items.length} product${items.length !== 1 ? "s" : ""} updated`
      : `${sh.id} received — no products were logged on this delivery`;
    showToast && showToast(msg);
  };

  const status = done ? "received" : sh.status;

  return (
    <div className="page fade-in">
      <button className="btn btn-sm btn-ghost mb16" onClick={() => go("shipments")}>
        <Icon name="chevL" size={13} />Incoming
      </button>

      <div className="page-head">
        <div>
          <div className="center gap10 mb4">
            <div className="page-title mono">{sh.id}</div>
            <ShipBadge status={status} />
          </div>
          <div className="page-desc">
            From {sh.supplier} · {sh.eta !== "TBD" ? "Expected " + sh.eta : "ETA unknown"}
          </div>
        </div>
        <div className="page-head-actions">
          {!done && (
            <button className="btn btn-primary" onClick={handleReceive}>
              <Icon name="check" size={14} />Mark Received
            </button>
          )}
        </div>
      </div>

      <div className="grid split" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="card card-pad">
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Delivery Details</div>
          <div className="kv"><span className="k">From</span><span className="v">{sh.supplier}</span></div>
          <div className="kv"><span className="k">Expected</span><span className="v">{sh.eta}</span></div>
          <div className="kv"><span className="k">Total cases</span><span className="v mono" style={{ fontWeight: 700, fontSize: 15 }}>{sh.cases}</span></div>
          {sh.po && sh.po !== "—" && (
            <div className="kv" style={{ alignItems: "flex-start" }}>
              <span className="k" style={{ paddingTop: 2 }}>Contents</span>
              <span className="v" style={{ lineHeight: 1.6 }}>{sh.po}</span>
            </div>
          )}
          {sh.value > 0 && (
            <div className="kv"><span className="k">Value</span><span className="v mono">{money(sh.value)}</span></div>
          )}
        </div>

        <div className="col gap16">
          {done ? (
            <div className="card card-pad" style={{ background: "var(--pos-bg)", borderColor: "rgba(74,184,122,0.3)" }}>
              <div className="center gap10">
                <Icon name="checkCircle" size={20} style={{ color: "var(--pos)", flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
                  <strong style={{ color: "var(--text)" }}>Received & posted to inventory.</strong>
                  {sh.po && sh.po !== "—" && (
                    <div style={{ marginTop: 6, color: "var(--text-3)", fontSize: 12 }}>{sh.po}</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card card-pad">
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Ready to receive?</div>
              <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.6, marginBottom: 16 }}>
                Once you confirm the delivery has arrived and counts are correct, mark it received.
              </div>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleReceive}>
                <Icon name="check" size={14} />Mark as Received
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Shipments, ShipmentDetail, NewShipmentDrawer });
