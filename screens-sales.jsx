/* ============================================================
   SALES — invoice list + new invoice form + detail drawer + delete
   ============================================================ */

const SALE_TABS = ["All", "Sent", "Partial", "Overdue", "Paid"];
const SALE_FILTER_MAP = { Sent: "sent", Partial: "partial", Overdue: "overdue", Paid: "paid" };

function Sales({ go, showToast }) {
  const [invoices, setInvoices] = React.useState([]);
  const [tab, setTab]           = React.useState("All");
  const [q, setQ]               = React.useState("");
  const [selected, setSelected] = React.useState(null);
  const [showNew, setShowNew]   = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      DB.invoices.list(),
      DB.customers.list(),
      DB.products.list(),
    ]).then(([invRows, custRows, prodRows]) => {
      DATA.invoices = invRows;
      DATA.customers = custRows;
      DATA.products = prodRows;
      setInvoices(invRows);
    });
  }, []);

  const list = invoices.filter(inv =>
    (tab === "All" || inv.status === SALE_FILTER_MAP[tab]) &&
    (inv.customer.toLowerCase().includes(q.toLowerCase()) || inv.id.toLowerCase().includes(q.toLowerCase()))
  );

  const totalSent    = invoices.filter(i => i.status === "sent").reduce((s, i) => s + i.total, 0);
  const totalOverdue = invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.total, 0);
  const totalPaid    = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);

  const deleteInvoice = (id, e) => {
    e.stopPropagation();
    DB.invoices.delete(id);
    const updated = invoices.filter(i => i.id !== id);
    DATA.invoices = updated;
    setInvoices(updated);
    if (selected?.id === id) setSelected(null);
    showToast && showToast("Invoice removed");
  };

  const nextInvId = React.useMemo(() => {
    const nums = invoices.map(i => parseInt(i.id.replace("INV-", "")) || 0);
    return "INV-" + (Math.max(0, ...nums) + 1);
  }, [invoices]);

  return (
    <div className="page page-wide fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Sales</div>
          <div className="page-desc">
            {invoices.length} invoices · {money(totalOverdue)} overdue · {money(totalPaid)} collected this month
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn" onClick={() => exportCSV(invoices, "sales.csv",
            ["Invoice","Customer","Date","Due","Total","Status","Items"],
            i => [i.id, i.customer, i.date, i.due, i.total, i.status, i.items]
          )}><Icon name="download" size={14} />Export</button>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>
            <Icon name="plus" size={14} />New Invoice
          </button>
        </div>
      </div>

      {/* AR Summary */}
      <div className="grid g-3 mb24">
        <div className="stat">
          <div className="stat-top">
            <div className="stat-ico" style={{ background: "var(--info-bg)", color: "var(--info)" }}>
              <Icon name="send" size={15} />
            </div>
            <span className="stat-label">Outstanding</span>
          </div>
          <div className="stat-val"><span className="cur">$</span>{fmt(totalSent)}</div>
          <div className="stat-foot"><span className="ctx">{invoices.filter(i => i.status === "sent").length} invoices sent</span></div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <div className="stat-ico" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
              <Icon name="alert" size={15} />
            </div>
            <span className="stat-label">Overdue</span>
          </div>
          <div className="stat-val"><span className="cur">$</span>{fmt(totalOverdue)}</div>
          <div className="stat-foot">
            <Trend value={-8} />
            <span className="ctx">{invoices.filter(i => i.status === "overdue").length} accounts</span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <div className="stat-ico" style={{ background: "var(--pos-bg)", color: "var(--pos)" }}>
              <Icon name="checkCircle" size={15} />
            </div>
            <span className="stat-label">Collected</span>
          </div>
          <div className="stat-val"><span className="cur">$</span>{fmt(totalPaid)}</div>
          <div className="stat-foot"><span className="ctx">this month · {invoices.filter(i => i.status === "paid").length} invoices</span></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-inp">
          <Icon name="search" size={14} />
          <input placeholder="Search by customer or invoice #…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="seg">
          {SALE_TABS.map(t => (
            <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Due</th>
              <th className="num">Items</th>
              <th className="num">Total</th>
              <th>Status</th>
              <th>Rep</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(inv => (
              <tr key={inv.id} onClick={() => setSelected(inv)}>
                <td>
                  <span className="mono td-strong" style={{ fontSize: 12.5 }}>{inv.id}</span>
                </td>
                <td className="td-strong">{inv.customer}</td>
                <td className="muted" style={{ fontSize: 12.5 }}>{inv.date}</td>
                <td>
                  <span style={{ fontSize: 12.5, color: inv.status === "overdue" ? "var(--danger)" : "var(--text-3)" }}>
                    {inv.due}
                  </span>
                </td>
                <td className="num mono muted">{inv.items}</td>
                <td className="num mono td-strong">{money(inv.total)}</td>
                <td><InvBadge status={inv.status} /></td>
                <td className="muted" style={{ fontSize: 12 }}>{inv.rep}</td>
                <td><Icon name="chevR" size={14} className="row-arrow" /></td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm btn-icon btn-ghost btn-danger"
                    onClick={e => deleteInvoice(inv.id, e)}
                    title="Remove invoice">
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="empty">
            <Icon name="invoice" size={28} />
            <div className="empty-title">No invoices</div>
            <div className="empty-desc">No results for the current filter</div>
          </div>
        )}
      </div>

      {/* Invoice Detail Drawer */}
      {selected && (
        <>
          <div className="overlay" onClick={() => setSelected(null)} />
          <div className="drawer">
            <div className="drawer-head">
              <div>
                <div className="drawer-title mono">{selected.id}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>{selected.customer}</div>
              </div>
              <div className="center gap8">
                <InvBadge status={selected.status} />
                <button className="btn btn-sm btn-icon btn-ghost" onClick={() => setSelected(null)}>
                  <Icon name="x" size={16} />
                </button>
              </div>
            </div>
            <div className="drawer-body">
              <div className="drawer-section">
                <div className="drawer-section-label">Invoice Details</div>
                <div className="kv"><span className="k">Customer</span><span className="v">{selected.customer}</span></div>
                <div className="kv"><span className="k">Invoice date</span><span className="v">{selected.date}</span></div>
                <div className="kv"><span className="k">Due date</span>
                  <span className="v" style={{ color: selected.status === "overdue" ? "var(--danger)" : undefined }}>
                    {selected.due}
                  </span>
                </div>
                <div className="kv"><span className="k">Sales rep</span><span className="v">{selected.rep}</span></div>
                <div className="kv"><span className="k">Total</span>
                  <span className="v mono" style={{ fontSize: 16, fontWeight: 700 }}>{money(selected.total)}</span>
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-label">Line Items</div>
                <table className="tbl" style={{ marginTop: -4 }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Unit</th>
                      <th className="num">Qty</th>
                      <th className="num">Price</th>
                      <th className="num">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DATA.invoiceLines.map((l, i) => (
                      <tr key={i} style={{ cursor: "default" }}>
                        <td>
                          <div className="cell-2">
                            <span className="td-strong" style={{ fontSize: 12.5 }}>{l.product}</span>
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
                        <td className="num mono">{l.qty}</td>
                        <td className="num mono">{money(l.price)}</td>
                        <td className="num mono td-strong">{money(l.qty * l.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="drawer-section">
                <div className="between mb8">
                  <span className="muted">Subtotal</span>
                  <span className="mono">{money(selected.total)}</span>
                </div>
                <div className="between" style={{ fontWeight: 600, fontSize: 15 }}>
                  <span>Total</span>
                  <span className="mono">{money(selected.total)}</span>
                </div>
              </div>

              <div className="drawer-section">
                <div style={{ display: "flex", gap: 8 }}>
                  {selected.status !== "paid" && (
                    <button className="btn btn-primary" style={{ flex: 1 }}
                      onClick={async () => {
                        await DB.invoices.update(selected.id, { status: "paid" });
                        const updated = invoices.map(i => i.id === selected.id ? { ...i, status: "paid" } : i);
                        DATA.invoices = updated;
                        setInvoices(updated);
                        setSelected(null);
                        showToast && showToast("Payment recorded for " + selected.id);
                      }}>
                      <Icon name="checkCircle" size={14} />Record Payment
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Invoice Form */}
      {showNew && (
        <NewInvoiceDrawer
          nextId={nextInvId}
          onClose={() => setShowNew(false)}
          onSave={async (inv, saleLines, msg) => {
            await DB.invoices.insert(inv);
            // Increment sold_30 (in cases) for each product in the sale
            for (const line of saleLines) {
              const prod = DATA.products.find(p => p.name === line.product);
              if (prod) {
                const casesQty = Math.round((Number(line.qty) || 0) / UNIT_DIV[line.unit || "Case"]);
                if (casesQty > 0) {
                  const newSold30 = prod.sold30 + casesQty;
                  await DB.products.update(prod.id, { sold_30: newSold30 });
                  prod.sold30 = newSold30;
                }
              }
            }
            DATA.invoices = [inv, ...DATA.invoices];
            setInvoices(is => [inv, ...is]);
            setShowNew(false);
            showToast && showToast(msg);
          }}
        />
      )}
    </div>
  );
}

// Price per unit derived from case price — 1 Case = 6 Boxes = 60 Rolls = 300 Cans
const UNIT_DIV = { Case: 1, Box: 6, Roll: 60, Can: 300 };
function unitPrice(casePrice, unit) {
  return +(casePrice / UNIT_DIV[unit]).toFixed(2);
}

function NewInvoiceDrawer({ nextId, onClose, onSave }) {
  const d = DATA;
  const [cid, setCid]   = React.useState("");
  const [note, setNote] = React.useState("");
  const [lines, setLines] = React.useState([{ product: "", unit: "Case", qty: 1, price: 0 }]);

  const addLine    = () => setLines(ls => [...ls, { product: "", unit: "Case", qty: 1, price: 0 }]);
  const removeLine = (i) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [field]: val } : l));

  // When product changes: auto-fill price for selected unit
  const onProductChange = (i, prodName) => {
    const p = d.products.find(x => x.name === prodName);
    setLines(ls => ls.map((l, idx) => {
      if (idx !== i) return l;
      const price = p && p.casePrice ? unitPrice(p.casePrice, l.unit) : l.price;
      return { ...l, product: prodName, price };
    }));
  };

  // When unit changes: recalculate price from case price
  const onUnitChange = (i, unit) => {
    setLines(ls => ls.map((l, idx) => {
      if (idx !== i) return l;
      const p = d.products.find(x => x.name === l.product);
      const price = p && p.casePrice ? unitPrice(p.casePrice, unit) : l.price;
      return { ...l, unit, price };
    }));
  };

  const total    = lines.reduce((s, l) => s + (l.qty || 0) * (l.price || 0), 0);
  const custName = d.customers.find(c => c.id === cid)?.name || "";

  const buildInvoice = (status) => ({
    id: nextId,
    customer: custName,
    cid,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    due: new Date(Date.now() + 15 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    total,
    status,
    items: lines.filter(l => l.product).length,
    rep: "—",
  });

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <div className="drawer-title">New Invoice</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{nextId}</div>
          </div>
          <button className="btn btn-sm btn-icon btn-ghost" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-label">Customer</div>
            <div className="field">
              <label className="label">Bill to</label>
              <select className="select" value={cid} onChange={e => setCid(e.target.value)}>
                <option value="">Select customer…</option>
                {d.customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Line Items</div>
            {lines.map((l, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 90px 32px", gap: 8, marginBottom: 10 }}>
                <select className="select" value={l.product}
                  onChange={e => onProductChange(i, e.target.value)}>
                  <option value="">Product…</option>
                  {d.products.map(p => <option key={p.id}>{p.name}</option>)}
                </select>
                <select className="select" value={l.unit}
                  onChange={e => onUnitChange(i, e.target.value)}>
                  {["Case", "Box", "Roll", "Can"].map(u => <option key={u}>{u}</option>)}
                </select>
                <input className="input mono" type="number" min="1" value={l.qty}
                  onChange={e => updateLine(i, "qty", parseFloat(e.target.value) || 0)}
                  style={{ textAlign: "center" }} placeholder="Qty" />
                <input className="input mono" type="number" min="0" value={l.price}
                  onChange={e => updateLine(i, "price", parseFloat(e.target.value) || 0)}
                  placeholder="Price" />
                <button className="btn btn-sm btn-icon btn-ghost btn-danger" onClick={() => removeLine(i)}
                  disabled={lines.length === 1}>
                  <Icon name="x" size={13} />
                </button>
              </div>
            ))}
            <button className="btn btn-sm btn-ghost mt8" onClick={addLine}>
              <Icon name="plus" size={13} />Add Line
            </button>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Notes</div>
            <textarea className="input" rows={3} placeholder="Optional note for this invoice…"
              value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <div className="drawer-section">
            <div className="between" style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>
              <span>Total</span>
              <span className="mono">{money(total)}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                disabled={!cid || total === 0}
                onClick={() => onSave(buildInvoice("sent"), lines.filter(l => l.product && l.qty), "Sale recorded — " + custName)}>
                <Icon name="checkCircle" size={14} />Record Sale
              </button>
              <button className="btn" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { Sales, NewInvoiceDrawer });
