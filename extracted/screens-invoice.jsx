/* ============================================================
   INVOICE — list, fast keyboard-first creation builder, detail
   ============================================================ */
const UNIT_DIV = { Case: 1, Box: 50, Roll: 500, Can: 10000 };
const unitPrice = (p, unit) => {
  const raw = p.casePrice / UNIT_DIV[unit];
  return unit === "Can" ? Math.round(raw * 100) / 100 : Math.round(raw);
};

function Invoices({ go }) {
  const d = DATA;
  const [tab, setTab] = React.useState("All");
  const tabs = ["All", "Sent", "Paid", "Partial", "Overdue"];
  const list = d.invoices.filter(i => tab === "All" || i.status === tab.toLowerCase());
  const outstanding = d.invoices.filter(i => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  return (
    <div className="page page-wide fade-in">
      <div className="page-head">
        <div><div className="page-title">Invoices</div><div className="page-desc">{d.invoices.length} this month · {money(outstanding)} outstanding · avg {money(Math.round(d.invoices.reduce((s, i) => s + i.total, 0) / d.invoices.length))} / invoice</div></div>
        <div className="page-head-actions"><button className="btn"><Icon name="download" size={15} />Export</button><button className="btn btn-primary" onClick={() => go("invoice-new")}><Icon name="plus" size={15} />New Invoice</button></div>
      </div>
      <div className="seg mb16">{tabs.map(t => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Due</th><th className="num">Items</th><th>Rep</th><th className="num">Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map(i => (
              <tr key={i.id} onClick={() => go("invoice", { id: i.id })}>
                <td className="mono td-strong">{i.id}</td>
                <td className="td-strong">{i.customer}</td>
                <td className="muted">{i.date}</td>
                <td className="muted">{i.due}</td>
                <td className="num mono">{i.items}</td>
                <td className="muted">{i.rep}</td>
                <td className="num mono td-strong">{money(i.total)}</td>
                <td><Badge kind={INV_STATUS[i.status].cls.replace("badge-", "")}>{INV_STATUS[i.status].label}</Badge></td>
                <td><Icon name="chevR" size={15} className="row-arrow" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// a representative "last order" basket — same store, same basket, every week
const LAST_ORDER = [
  { id: "P-1042", unit: "Case", qty: 3 }, { id: "P-1043", unit: "Case", qty: 2 },
  { id: "P-3320", unit: "Box", qty: 6 }, { id: "P-5512", unit: "Box", qty: 4 },
];
const FREQUENT = ["P-1042", "P-5512", "P-3320", "P-2210", "P-4410"];

function InvoiceNew({ go, showToast, params = {} }) {
  const d = DATA;
  const [customer, setCustomer] = React.useState(() => params.customerId ? d.customers.find(c => c.id === params.customerId) : null);
  const [custOpen, setCustOpen] = React.useState(false);
  const [lines, setLines] = React.useState([]);
  const [pq, setPq] = React.useState("");
  const [hi, setHi] = React.useState(0);
  const [editPrice, setEditPrice] = React.useState(null);
  const inputRef = React.useRef(null);

  const prod = (id) => d.products.find(p => p.id === id);
  const effPrice = (l) => l.price != null ? l.price : unitPrice(prod(l.id), l.unit);
  const lineTotal = (l) => effPrice(l) * l.qty;
  const overStock = (l) => l.qty / UNIT_DIV[l.unit] > prod(l.id).onHand;

  const addProduct = (p, qty = 1, unit) => {
    setLines(ls => {
      const idx = ls.findIndex(l => l.id === p.id);
      if (idx >= 0 && !unit) return ls.map((l, i) => i === idx ? { ...l, qty: l.qty + qty } : l);
      return [...ls, { id: p.id, name: p.name, sku: p.sku, units: p.units, unit: unit || p.units[0], qty, price: null }];
    });
    setPq(""); setHi(0); inputRef.current?.focus();
  };
  const update = (i, patch) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const remove = (i) => setLines(ls => ls.filter((_, idx) => idx !== i));
  const loadBasket = (basket) => setLines(basket.map(b => { const p = prod(b.id); return { id: p.id, name: p.name, sku: p.sku, units: p.units, unit: b.unit, qty: b.qty, price: null }; }));

  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const totalUnits = lines.reduce((s, l) => s + l.qty, 0);
  const valid = customer && lines.length > 0;
  const results = pq.trim() ? d.products.filter(p => p.name.toLowerCase().includes(pq.toLowerCase()) || p.sku.toLowerCase().includes(pq.toLowerCase())).slice(0, 6) : [];

  const complete = React.useCallback(() => { if (customer && lines.length) { showToast(`Invoice INV-7742 created · ${money(subtotal)}`); go("invoices"); } }, [customer, lines, subtotal]);

  React.useEffect(() => { inputRef.current?.focus(); }, []);
  React.useEffect(() => {
    const h = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); complete(); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [complete]);

  const onSearchKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(h + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && results[hi]) { e.preventDefault(); addProduct(results[hi]); }
    else if (e.key === "Escape") { setPq(""); }
  };

  return (
    <div className="page page-wide fade-in" style={{ paddingBottom: 24 }}>
      <div className="page-head">
        <div><div className="page-title">New Invoice</div><div className="page-desc">Draft · <span className="mono">INV-7742</span> · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div></div>
        <div className="page-head-actions"><button className="btn btn-ghost" onClick={() => go("invoices")}>Cancel</button><button className="btn">Save Draft</button></div>
      </div>

      <div className="grid split" style={{ gridTemplateColumns: "1.7fr 360px", alignItems: "start" }}>
        <div className="col" style={{ gap: 16 }}>
          {/* customer */}
          <div className="card card-pad">
            <div className="between">
              <div className="label">Customer</div>
              {customer && <div className="center gap6" style={{ fontSize: 11.5, color: customer.balance / customer.limit > 0.8 ? "var(--warn)" : "var(--text-3)" }}><Icon name="wallet" size={13} />{money(customer.balance)} of {money(customer.limit)} credit used</div>}
            </div>
            {customer ? (
              <div className="between mt8">
                <div className="center gap12"><Avatar name={customer.name} cls={"av-" + ((customer.id.charCodeAt(2)) % 6 + 1)} size={38} /><div><div style={{ fontWeight: 500, fontSize: 14 }}>{customer.name}</div><div className="faint" style={{ fontSize: 12 }}>{customer.contact} · {customer.terms} terms</div></div></div>
                <button className="btn btn-sm" onClick={() => setCustomer(null)}>Change</button>
              </div>
            ) : (
              <div style={{ position: "relative", marginTop: 8 }}>
                <button className="input center between" style={{ cursor: "pointer", textAlign: "left" }} onClick={() => setCustOpen(o => !o)}>
                  <span className="muted">Select a customer…</span><Icon name="chevD" size={16} className="muted" />
                </button>
                {custOpen && (
                  <div className="pop" style={{ position: "absolute", top: 44, left: 0, right: 0, zIndex: 20, maxHeight: 280, overflowY: "auto" }}>
                    {d.customers.map(c => (
                      <button key={c.id} className="nav-item" style={{ borderRadius: 0, padding: "10px 14px" }} onClick={() => { setCustomer(c); setCustOpen(false); inputRef.current?.focus(); }}>
                        <Avatar name={c.name} cls={"av-" + ((c.id.charCodeAt(2)) % 6 + 1)} size={28} />
                        <div style={{ flex: 1, textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{c.name}</div><div className="faint" style={{ fontSize: 11 }}>{c.city} · {c.terms}</div></div>
                        <span className="mono faint" style={{ fontSize: 11 }}>{money(c.balance)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {customer && lines.length === 0 && (
              <div className="center gap8 wrap mt12" style={{ paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <button className="btn btn-sm btn-primary" onClick={() => loadBasket(LAST_ORDER)}><Icon name="clock" size={13} />Repeat last order</button>
                <span className="faint" style={{ fontSize: 11.5 }}>or quick-add:</span>
                {FREQUENT.map(id => { const p = prod(id); return <button key={id} className="btn btn-sm btn-ghost" style={{ background: "var(--panel-2)", border: "1px solid var(--border)" }} onClick={() => addProduct(p)}>+ {p.name.split(" ").slice(0, 2).join(" ")}</button>; })}
              </div>
            )}
          </div>

          {/* line items */}
          <div className="card">
            <div className="card-hd"><h3>Line Items</h3><div className="right"><span className="muted" style={{ fontSize: 12 }}>{lines.length} {lines.length === 1 ? "line" : "lines"} · {totalUnits} units</span></div></div>

            {/* persistent quick-add */}
            <div style={{ padding: 12, borderBottom: lines.length ? "1px solid var(--border)" : "none", position: "relative" }}>
              <div className="search-inp" style={{ height: 42, border: "1px solid var(--border-2)", background: "var(--panel-2)" }}>
                <Icon name="search" size={16} />
                <input ref={inputRef} placeholder="Type a product name or SKU, then Enter to add…" value={pq} onChange={e => { setPq(e.target.value); setHi(0); }} onKeyDown={onSearchKey} style={{ fontSize: 13.5 }} />
                <span className="kbd">↵ add</span>
              </div>
              {results.length > 0 && (
                <div className="pop" style={{ position: "absolute", top: 56, left: 12, right: 12, zIndex: 20 }}>
                  {results.map((p, ri) => (
                    <button key={p.id} className="nav-item" style={{ borderRadius: 0, padding: "9px 14px", background: ri === hi ? "var(--hover-2)" : "transparent" }}
                      onMouseEnter={() => setHi(ri)} onClick={() => addProduct(p)}>
                      <div className="thumb" style={{ width: 28, height: 28 }}><Icon name="box" size={14} className="muted" /></div>
                      <div style={{ flex: 1, textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{p.name}</div><div className="faint mono" style={{ fontSize: 11 }}>{p.sku} · {p.onHand} cases on hand</div></div>
                      <span className="mono faint" style={{ fontSize: 11.5 }}>{money(p.casePrice)}/cs</span>
                      {ri === hi && <span className="kbd" style={{ marginLeft: 8 }}>↵</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {lines.length === 0 ? (
              <div className="empty" style={{ padding: 36 }}><Icon name="invoice" size={30} /><div style={{ color: "var(--text-2)", fontWeight: 500 }}>Start typing above to add products</div><div>Enter adds · type a qty · ⌘↵ completes</div></div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Product</th><th>Unit</th><th style={{ width: 116 }}>Qty</th><th className="num">Unit Price</th><th className="num">Total</th><th></th></tr></thead>
                <tbody>
                  {lines.map((l, i) => {
                    const over = overStock(l), overridden = l.price != null;
                    return (
                      <tr key={i} style={{ cursor: "default" }}>
                        <td>
                          <div className="cell-2"><span className="td-strong">{l.name}</span>
                            <span className="td-sub mono" style={{ display: "flex", gap: 6, alignItems: "center" }}>{l.sku}
                              {over ? <span style={{ color: "var(--warn)", display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="alert" size={11} />only {prod(l.id).onHand} cs in stock</span>
                                : <span className="faint">· {prod(l.id).onHand} cs avail</span>}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="seg" style={{ padding: 2 }}>
                            {l.units.map(u => <button key={u} className={l.unit === u ? "on" : ""} style={{ padding: "5px 9px", fontSize: 11.5 }} onClick={() => update(i, { unit: u, price: null })}>{u}</button>)}
                          </div>
                        </td>
                        <td>
                          <div className="center gap4">
                            <button className="btn btn-icon" style={{ height: 34, width: 30 }} onClick={() => update(i, { qty: Math.max(1, l.qty - 1) })}>−</button>
                            <input className="input mono" style={{ width: 50, height: 34, textAlign: "center", padding: 0, fontWeight: 600, borderColor: over ? "var(--warn)" : undefined }}
                              value={l.qty} onFocus={e => e.target.select()} onChange={e => update(i, { qty: Math.max(1, parseInt(e.target.value.replace(/\D/g, "")) || 1) })} />
                            <button className="btn btn-icon" style={{ height: 34, width: 30 }} onClick={() => update(i, { qty: l.qty + 1 })}>+</button>
                          </div>
                        </td>
                        <td className="num">
                          {editPrice === i ? (
                            <input className="input mono" autoFocus style={{ width: 84, height: 32, textAlign: "right" }} defaultValue={effPrice(l)}
                              onBlur={e => { const v = parseFloat(e.target.value); update(i, { price: isNaN(v) ? null : v }); setEditPrice(null); }}
                              onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }} />
                          ) : (
                            <button className="mono" style={{ fontSize: 13, color: overridden ? "var(--accent)" : "var(--text-2)", borderBottom: "1px dashed var(--border-3)", paddingBottom: 1 }} title="Click to override price" onClick={() => setEditPrice(i)}>
                              {money(effPrice(l), l.unit === "Can" ? 2 : 0)}{overridden && " *"}
                            </button>
                          )}
                        </td>
                        <td className="num mono td-strong">{money(lineTotal(l))}</td>
                        <td><button className="icon-btn" style={{ width: 28, height: 28, color: "var(--text-3)" }} onClick={() => remove(i)}><Icon name="x" size={15} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* summary */}
        <div className="card" style={{ position: "sticky", top: 0 }}>
          <div className="card-hd"><h3>Summary</h3>{lines.some(l => l.price != null) && <div className="right"><span className="faint" style={{ fontSize: 11 }}>* custom price</span></div>}</div>
          <div className="card-pad">
            <div className="kv"><span className="k">Lines</span><span className="v mono">{lines.length}</span></div>
            <div className="kv"><span className="k">Subtotal</span><span className="v mono">{money(subtotal)}</span></div>
            <div className="kv"><span className="k">Excise tax</span><span className="v mono muted">included</span></div>
            <div className="between" style={{ padding: "16px 0 6px" }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
              <span className="mono" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em" }}>{money(subtotal)}</span>
            </div>
            {customer && subtotal > 0 && customer.balance + subtotal > customer.limit && (
              <div className="center gap8 mt8" style={{ padding: "9px 11px", background: "var(--warn-bg)", borderRadius: 8, fontSize: 12, color: "var(--warn)" }}>
                <Icon name="alert" size={15} />Exceeds credit limit by {money(customer.balance + subtotal - customer.limit)}
              </div>
            )}
            {lines.some(overStock) && (
              <div className="center gap8 mt8" style={{ padding: "9px 11px", background: "var(--warn-bg)", borderRadius: 8, fontSize: 12, color: "var(--warn)" }}>
                <Icon name="pkg" size={15} />Some lines exceed stock on hand
              </div>
            )}
            <button className="btn btn-primary" style={{ width: "100%", height: 44, marginTop: 16, fontSize: 14 }} disabled={!valid} onClick={complete}>
              <Icon name="check" size={16} />Complete Invoice
            </button>
            <div className="center gap8" style={{ justifyContent: "center", marginTop: 12, color: "var(--text-4)", fontSize: 11.5 }}>
              <span className="kbd">⌘↵</span> to complete · <span className="kbd">⌘P</span> print
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InvoiceDetail({ go, params }) {
  const d = DATA;
  const inv = d.invoices.find(i => i.id === params.id) || d.invoices[0];
  const cust = d.customers.find(c => c.id === inv.cid) || d.customers[0];
  const lines = d.invoiceLines;
  return (
    <div className="page fade-in">
      <button className="btn btn-sm btn-ghost mb16" onClick={() => go("invoices")}><Icon name="chevL" size={14} />Invoices</button>
      <div className="page-head">
        <div><div className="center gap10"><div className="page-title mono">{inv.id}</div><Badge kind={INV_STATUS[inv.status].cls.replace("badge-", "")}>{INV_STATUS[inv.status].label}</Badge></div><div className="page-desc">{inv.customer} · Issued {inv.date} · Due {inv.due}</div></div>
        <div className="page-head-actions"><button className="btn"><Icon name="print" size={15} />Print</button><button className="btn"><Icon name="send" size={15} />Send</button>{inv.status !== "paid" && <button className="btn btn-primary"><Icon name="wallet" size={15} />Record Payment</button>}</div>
      </div>

      <div className="grid split" style={{ gridTemplateColumns: "1.7fr 1fr" }}>
        <div className="card">
          <div className="card-pad between" style={{ borderBottom: "1px solid var(--border)" }}>
            <div><div className="brand-mark" style={{ marginBottom: 10 }}>CC</div><div style={{ fontWeight: 600 }}>CC Tobacco Co.</div><div className="faint" style={{ fontSize: 12, lineHeight: 1.5 }}>418 Distribution Way<br />Newark, NJ 07102<br />TTB-NJ-4471</div></div>
            <div style={{ textAlign: "right" }}><div className="faint" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>Bill To</div><div style={{ fontWeight: 500, marginTop: 4 }}>{cust.name}</div><div className="faint" style={{ fontSize: 12, lineHeight: 1.5 }}>{cust.contact}<br />{cust.city}<br />{cust.phone}</div></div>
          </div>
          <table className="tbl">
            <thead><tr><th>Product</th><th>Unit</th><th className="num">Qty</th><th className="num">Price</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} style={{ cursor: "default" }}>
                  <td><div className="cell-2"><span className="td-strong">{l.product}</span><span className="td-sub mono">{l.sku}</span></div></td>
                  <td><UnitChip unit={l.unit} /></td>
                  <td className="num mono">{l.qty}</td>
                  <td className="num mono muted">{money(l.price)}</td>
                  <td className="num mono td-strong">{money(l.price * l.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="between" style={{ padding: "16px 18px", borderTop: "1px solid var(--border)" }}>
            <span className="faint" style={{ fontSize: 12 }}>Payment terms: {cust.terms} · Thank you for your business</span>
            <div style={{ textAlign: "right" }}><div className="faint" style={{ fontSize: 11 }}>Total Due</div><div className="mono" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.03em" }}>{money(inv.total)}</div></div>
          </div>
        </div>
        <div className="col" style={{ gap: 16 }}>
          <div className="card card-pad">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Status</h3>
            <div className="kv"><span className="k">Issued</span><span className="v">{inv.date}</span></div>
            <div className="kv"><span className="k">Due date</span><span className="v">{inv.due}</span></div>
            <div className="kv"><span className="k">Amount</span><span className="v mono">{money(inv.total)}</span></div>
            <div className="kv"><span className="k">Paid</span><span className="v mono">{inv.status === "paid" ? money(inv.total) : inv.status === "partial" ? money(Math.round(inv.total * 0.4)) : "$0"}</span></div>
            <div className="kv"><span className="k">Balance</span><span className="v mono" style={{ color: inv.status === "paid" ? "var(--pos)" : "var(--warn)" }}>{inv.status === "paid" ? "$0" : inv.status === "partial" ? money(Math.round(inv.total * 0.6)) : money(inv.total)}</span></div>
          </div>
          <div className="card card-pad">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Timeline</h3>
            {[["Created", inv.date, "var(--text-2)"], ["Sent to customer", inv.date, "var(--info)"], [inv.status === "paid" ? "Paid in full" : "Awaiting payment", inv.status === "paid" ? inv.date : "—", inv.status === "paid" ? "var(--pos)" : "var(--text-3)"]].map((t, i) => (
              <div key={i} className="center gap10" style={{ padding: "7px 0" }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: t[2] }} /><span style={{ fontSize: 13, flex: 1 }}>{t[0]}</span><span className="faint mono" style={{ fontSize: 11.5 }}>{t[1]}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Invoices, InvoiceNew, InvoiceDetail });
