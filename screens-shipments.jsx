/* ============================================================
   SHIPMENTS + SHIPMENT DETAIL (receive flow) + add/delete
   ============================================================ */

function Shipments({ go, showToast }) {
  const [shipments, setShipments] = React.useState([]);
  const [tab, setTab]   = React.useState("All");
  const [showNew, setShowNew] = React.useState(false);

  React.useEffect(() => {
    DB.shipments.list().then(rows => {
      DATA.shipments = rows;
      setShipments(rows);
    });
  }, []);

  const tabs   = ["All", "Arriving", "Verifying", "In Transit", "Received"];
  const tabMap = { Arriving: "arriving", Verifying: "verifying", "In Transit": "in_transit", Received: "received" };
  const list   = shipments.filter(s => tab === "All" || s.status === tabMap[tab]);
  const inbound = shipments.filter(s => s.status !== "received").length;

  const deleteShipment = (id, e) => {
    e.stopPropagation();
    DB.shipments.delete(id);
    const updated = shipments.filter(s => s.id !== id);
    DATA.shipments = updated;
    setShipments(updated);
    showToast && showToast("Shipment removed");
  };

  const nextId = React.useMemo(() => {
    const nums = shipments.map(s => parseInt(s.id.replace("SH-", "")) || 0);
    return "SH-" + (Math.max(...nums, 3391) + 1);
  }, [shipments]);

  return (
    <div className="page page-wide fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Shipments</div>
          <div className="page-desc">
            {inbound} inbound · {shipments.filter(s => s.status === "arriving").length} arriving today
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn"><Icon name="cal" size={14} />Schedule</button>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Icon name="plus" size={14} />New PO
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
                  {sh.cases} cases · {sh.lines} line items · {money(sh.value)} · Dock {sh.dock}
                </div>
              </div>
            </div>
            <div className="center gap8" style={{ flexShrink: 0 }}>
              <button className="btn" onClick={() => go("shipment", { id: sh.id })}>View Manifest</button>
              <button className="btn btn-primary" onClick={() => go("shipment", { id: "SH-3390" })}>
                <Icon name="scan" size={14} />Receive Shipment
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
              <th>Shipment / PO</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>ETA</th>
              <th className="num">Cases</th>
              <th className="num">Value</th>
              <th>Carrier</th>
              <th>Dock</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(s => (
              <tr key={s.id} onClick={() => go("shipment", { id: s.id })}>
                <td>
                  <div className="cell-2">
                    <span className="td-strong mono">{s.id}</span>
                    <span className="td-sub mono">{s.po}</span>
                  </div>
                </td>
                <td className="td-strong">{s.supplier}</td>
                <td><ShipBadge status={s.status} /></td>
                <td className="muted" style={{ fontSize: 12.5 }}>{s.eta}</td>
                <td className="num mono td-strong">{s.cases}</td>
                <td className="num mono">{money(s.value)}</td>
                <td className="muted">{s.carrier}</td>
                <td className="mono muted">{s.dock}</td>
                <td><Icon name="chevR" size={14} className="row-arrow" /></td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm btn-icon btn-ghost btn-danger"
                    onClick={e => deleteShipment(s.id, e)}
                    title="Remove shipment">
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
            <div className="empty-title">No shipments in this view</div>
            <div className="empty-desc">Try a different filter tab or add a new PO</div>
          </div>
        )}
      </div>

      {showNew && (
        <NewShipmentDrawer
          nextId={nextId}
          onClose={() => setShowNew(false)}
          onSave={async (sh) => {
            await DB.shipments.insert(sh);
            DATA.shipments = [sh, ...DATA.shipments];
            setShipments(ss => [sh, ...ss]);
            setShowNew(false);
            showToast && showToast("Shipment added: " + sh.id);
          }}
        />
      )}
    </div>
  );
}

function NewShipmentDrawer({ nextId, onClose, onSave }) {
  const [supplier, setSupplier] = React.useState("");
  const [po, setPo]             = React.useState("");
  const [carrier, setCarrier]   = React.useState("");
  const [cases, setCases]       = React.useState("");
  const [value, setValue]       = React.useState("");
  const [eta, setEta]           = React.useState("");
  const [dock, setDock]         = React.useState("");

  const handleSave = () => {
    if (!supplier.trim()) return;
    onSave({
      id: nextId,
      supplier: supplier.trim(),
      po: po.trim() || nextId.replace("SH-", "PO-"),
      carrier: carrier.trim() || "TBD",
      cases: Number(cases) || 0,
      value: Number(value) || 0,
      eta: eta.trim() || "TBD",
      dock: dock.trim() || "—",
      lines: 0,
      status: "in_transit",
    });
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <div className="drawer-title">New Shipment</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{nextId}</div>
          </div>
          <button className="btn btn-sm btn-icon btn-ghost" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-label">Supplier & Carrier</div>
            <div className="col gap12">
              <div className="field">
                <label className="label">Supplier *</label>
                <input className="input" placeholder="e.g. Philip Morris USA"
                  value={supplier} onChange={e => setSupplier(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">PO Number</label>
                <input className="input mono" placeholder="e.g. PO-88500"
                  value={po} onChange={e => setPo(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Carrier</label>
                <input className="input" placeholder="e.g. Old Dominion"
                  value={carrier} onChange={e => setCarrier(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Dock Assignment</label>
                <input className="input mono" placeholder="e.g. Bay 1"
                  value={dock} onChange={e => setDock(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="drawer-section">
            <div className="drawer-section-label">Delivery Details</div>
            <div className="col gap12">
              <div className="field">
                <label className="label">ETA</label>
                <input className="input" placeholder="e.g. Tomorrow, 10 AM"
                  value={eta} onChange={e => setEta(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Cases</label>
                <input className="input mono" type="number" min="0" placeholder="0"
                  value={cases} onChange={e => setCases(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Estimated Value ($)</label>
                <input className="input mono" type="number" min="0" placeholder="0"
                  value={value} onChange={e => setValue(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="drawer-section">
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                disabled={!supplier.trim()}
                onClick={handleSave}>
                <Icon name="truck" size={14} />Add Shipment
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
  const d = DATA;
  const sh = d.shipments.find(s => s.id === params.id) || d.shipments[1];
  const isVerifying = sh.status === "verifying";

  const [lines, setLines] = React.useState(() =>
    d.shipmentLines.map(l => ({ ...l, received: l.state === "pending" ? 0 : l.received }))
  );
  const [done, setDone] = React.useState(sh.status === "received");

  const setQty = (i, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, received: Math.max(0, v) } : l));
  const verifiedCount = lines.filter(l => l.received === l.expected).length;
  const totalRec = lines.reduce((s, l) => s + l.received, 0);
  const totalExp = lines.reduce((s, l) => s + l.expected, 0);

  const lineState = (l) => l.received === 0 ? "pending" : l.received < l.expected ? "short" : l.received > l.expected ? "over" : "ok";

  const handleReceive = () => {
    setDone(true);
    showToast && showToast(`${sh.id} received — ${totalRec} cases posted to inventory`);
  };

  return (
    <div className="page fade-in">
      <button className="btn btn-sm btn-ghost mb16" onClick={() => go("shipments")}>
        <Icon name="chevL" size={13} />Shipments
      </button>

      <div className="page-head">
        <div>
          <div className="center gap10 mb4">
            <div className="page-title mono">{sh.id}</div>
            <ShipBadge status={done ? "received" : sh.status} />
          </div>
          <div className="page-desc">
            {sh.supplier} · {sh.carrier} · PO <span className="mono">{sh.po}</span> · {sh.eta}
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn"><Icon name="print" size={14} />Manifest</button>
          {!done && (
            <button className="btn btn-primary" onClick={handleReceive}
              disabled={lines.every(l => l.received === 0)}>
              <Icon name="check" size={14} />Mark Received
            </button>
          )}
        </div>
      </div>

      <div className="grid split" style={{ gridTemplateColumns: "1.7fr 1fr" }}>
        <div className="card">
          <div className="card-hd">
            <h3>Verify Quantities</h3>
            <div className="right">
              {!done && (
                <button className="btn btn-sm btn-ghost"
                  style={{ color: "var(--accent)" }}
                  onClick={() => setLines(ls => ls.map(l => ({ ...l, received: l.expected })))}>
                  <Icon name="check" size={13} />Match all
                </button>
              )}
              <span className="muted" style={{ fontSize: 12.5 }}>
                <span className="mono" style={{ color: "var(--text)" }}>{verifiedCount}</span>
                /{lines.length} matched
              </span>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit</th>
                <th className="num">Expected</th>
                <th>Received</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const st = lineState(l);
                const stColor = { ok: "var(--pos)", short: "var(--warn)", over: "var(--info)", pending: "var(--text-3)" }[st];
                const stLabel = { ok: "Matched", short: "Short", over: "Over", pending: "Pending" }[st];
                return (
                  <tr key={i} style={{ cursor: "default" }}>
                    <td>
                      <div className="cell-2">
                        <span className="td-strong">{l.product}</span>
                        <span className="td-sub mono">{l.sku}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontFamily: "var(--mono)", fontSize: 11.5, fontWeight: 600,
                        color: { Case: "#5b8def", Box: "#c08bf0", Roll: "#d4a030", Can: "#4fc4cf" }[l.unit],
                      }}>
                        <span className={`uq uq-${l.unit.toLowerCase()}`} style={{ marginRight: 5 }} />
                        {l.unit}
                      </span>
                    </td>
                    <td className="num mono td-strong">{l.expected}</td>
                    <td>
                      {done ? (
                        <span className="mono td-strong">{l.received}</span>
                      ) : (
                        <div className="center gap6">
                          <button className="btn btn-sm btn-icon" onClick={() => setQty(i, l.received - 1)}
                            style={{ fontSize: 16, fontWeight: 300 }}>−</button>
                          <input className="input mono" style={{ width: 58, height: 32, textAlign: "center", padding: 0, fontWeight: 600, fontSize: 14 }}
                            value={l.received}
                            onFocus={e => e.target.select()}
                            onChange={e => setQty(i, parseInt(e.target.value) || 0)} />
                          <button className="btn btn-sm btn-icon" onClick={() => setQty(i, l.received + 1)}
                            style={{ fontSize: 16, fontWeight: 300 }}>+</button>
                        </div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: stColor, fontWeight: 500 }}>{stLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 13 }}>
              Total: <span className="mono" style={{ color: "var(--text)", fontWeight: 600 }}>{totalRec}</span> of {totalExp} expected
            </span>
            {totalRec < totalExp && !done && (
              <span className="badge badge-warn">Short by {totalExp - totalRec}</span>
            )}
          </div>
        </div>

        <div className="col gap16">
          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Shipment Info</div>
            <div className="kv"><span className="k">Supplier</span><span className="v">{sh.supplier}</span></div>
            <div className="kv"><span className="k">PO number</span><span className="v mono">{sh.po}</span></div>
            <div className="kv"><span className="k">Carrier</span><span className="v">{sh.carrier}</span></div>
            <div className="kv"><span className="k">Dock assignment</span><span className="v mono">{sh.dock}</span></div>
            <div className="kv"><span className="k">ETA</span><span className="v">{sh.eta}</span></div>
            <div className="kv"><span className="k">Total value</span><span className="v mono">{money(sh.value)}</span></div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Progress</div>
            <div className="between mb8">
              <span className="muted" style={{ fontSize: 12.5 }}>Lines verified</span>
              <span className="mono td-strong">{verifiedCount}/{lines.length}</span>
            </div>
            <Meter value={verifiedCount} max={lines.length} color="var(--pos)" height={7} />
            <div className="mt16 between">
              <span className="muted" style={{ fontSize: 12.5 }}>Cases received</span>
              <span className="mono td-strong">{totalRec}/{totalExp}</span>
            </div>
          </div>

          {done && (
            <div className="card card-pad" style={{ background: "var(--pos-bg)", borderColor: "rgba(74,184,122,0.3)" }}>
              <div className="center gap10">
                <Icon name="checkCircle" size={18} style={{ color: "var(--pos)", flexShrink: 0 }} />
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>
                  Shipment received. <strong style={{ color: "var(--text)" }}>{totalRec} cases</strong> posted to inventory.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Shipments, ShipmentDetail, NewShipmentDrawer });
