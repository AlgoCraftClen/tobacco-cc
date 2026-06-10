/* ============================================================
   CUSTOMERS — list + detail drawer + add/delete
   ============================================================ */

const RISK_BADGE = {
  low:  { kind: "pos",    label: "Low risk"  },
  med:  { kind: "warn",   label: "Medium"    },
  high: { kind: "danger", label: "High risk" },
};

function Customers({ go, showToast }) {
  const [customers, setCustomers] = React.useState(() => [...DATA.customers]);
  const [q, setQ] = React.useState("");
  const [type, setType] = React.useState("All");
  const [selected, setSelected] = React.useState(null);
  const [showAdd, setShowAdd] = React.useState(false);

  const types = ["All", "Retailer", "C-Store", "Wholesaler"];
  const list = customers.filter(c =>
    (type === "All" || c.type === type) &&
    (c.name.toLowerCase().includes(q.toLowerCase()) ||
     c.contact.toLowerCase().includes(q.toLowerCase()) ||
     c.city.toLowerCase().includes(q.toLowerCase()))
  );

  const totalAR      = customers.reduce((s, c) => s + c.balance, 0);
  const totalOverdue = customers.reduce((s, c) => s + c.overdue, 0);
  const highRisk     = customers.filter(c => c.risk === "high").length;

  const deleteCustomer = (id, e) => {
    e.stopPropagation();
    setCustomers(cs => cs.filter(c => c.id !== id));
    if (selected?.id === id) setSelected(null);
    showToast && showToast("Customer removed");
  };

  return (
    <div className="page page-wide fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Customers</div>
          <div className="page-desc">
            {customers.length} accounts · {money(totalAR)} AR balance · {money(totalOverdue)} overdue
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn"><Icon name="download" size={14} />Export</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} />Add Customer
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid g-3 mb24">
        <div className="stat">
          <div className="stat-top">
            <div className="stat-ico" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
              <Icon name="users" size={15} />
            </div>
            <span className="stat-label">Total Accounts</span>
          </div>
          <div className="stat-val">{customers.length}</div>
          <div className="stat-foot"><span className="ctx">active customers</span></div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <div className="stat-ico" style={{ background: "var(--info-bg)", color: "var(--info)" }}>
              <Icon name="wallet" size={15} />
            </div>
            <span className="stat-label">AR Balance</span>
          </div>
          <div className="stat-val"><span className="cur">$</span>{fmt(totalAR)}</div>
          <div className="stat-foot">
            <span style={{ color: totalOverdue > 0 ? "var(--danger)" : "var(--pos)", fontWeight: 600, fontSize: 11.5 }}>
              {money(totalOverdue)} overdue
            </span>
          </div>
        </div>
        <div className="stat">
          <div className="stat-top">
            <div className="stat-ico" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
              <Icon name="alert" size={15} />
            </div>
            <span className="stat-label">High Risk</span>
          </div>
          <div className="stat-val">{highRisk}</div>
          <div className="stat-foot"><span className="ctx">require attention</span></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-inp" style={{ minWidth: 280 }}>
          <Icon name="search" size={14} />
          <input placeholder="Search by name, contact, or city…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="seg">
          {types.map(t => (
            <button key={t} className={type === t ? "on" : ""} onClick={() => setType(t)}>{t}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Type</th>
              <th>Location</th>
              <th>Terms</th>
              <th className="num">Balance</th>
              <th className="num">Overdue</th>
              <th className="num">YTD Sales</th>
              <th>Risk</th>
              <th>Last order</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(c => (
              <tr key={c.id} onClick={() => setSelected(c)}>
                <td>
                  <div className="cell-ico">
                    <Avatar name={c.name}
                      cls={c.risk === "high" ? "av-4" : c.risk === "med" ? "av-3" : "av-2"}
                      size={30} />
                    <div className="cell-2">
                      <span className="td-strong">{c.name}</span>
                      <span className="td-sub">{c.contact}</span>
                    </div>
                  </div>
                </td>
                <td><span className="cat-chip">{c.type}</span></td>
                <td className="muted" style={{ fontSize: 12.5 }}>{c.city}</td>
                <td className="mono muted" style={{ fontSize: 12 }}>{c.terms}</td>
                <td className="num mono td-strong">{money(c.balance)}</td>
                <td className="num mono">
                  {c.overdue > 0
                    ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>{money(c.overdue)}</span>
                    : <span className="faint">—</span>}
                </td>
                <td className="num mono muted">{money(c.ytd)}</td>
                <td><Badge kind={RISK_BADGE[c.risk].kind}>{RISK_BADGE[c.risk].label}</Badge></td>
                <td className="muted" style={{ fontSize: 12.5 }}>{c.lastOrder}</td>
                <td><Icon name="chevR" size={14} className="row-arrow" /></td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn btn-sm btn-icon btn-ghost btn-danger"
                    onClick={e => deleteCustomer(c.id, e)}
                    title="Remove customer">
                    <Icon name="trash" size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="empty">
            <Icon name="users" size={28} />
            <div className="empty-title">No customers found</div>
            <div className="empty-desc">Try adjusting your search or add a new customer</div>
          </div>
        )}
      </div>

      {selected && (
        <CustomerDrawer
          customer={selected}
          onClose={() => setSelected(null)}
          go={go} />
      )}

      {showAdd && (
        <AddCustomerDrawer
          onClose={() => setShowAdd(false)}
          onSave={(c) => {
            setCustomers(cs => [c, ...cs]);
            setShowAdd(false);
            showToast && showToast("Customer added: " + c.name);
          }}
        />
      )}
    </div>
  );
}

function CustomerDrawer({ customer: c, onClose, go }) {
  const recentInvoices = DATA.invoices.filter(i => i.cid === c.id).slice(0, 5);
  const usedPct = c.limit > 0 ? Math.round((c.balance / c.limit) * 100) : 0;

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={c.name}
              cls={c.risk === "high" ? "av-4" : c.risk === "med" ? "av-3" : "av-2"}
              size={38} />
            <div>
              <div className="drawer-title" style={{ fontSize: 15 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                {c.type} · {c.city}
              </div>
            </div>
          </div>
          <div className="center gap8">
            <Badge kind={RISK_BADGE[c.risk].kind}>{RISK_BADGE[c.risk].label}</Badge>
            <button className="btn btn-sm btn-icon btn-ghost" onClick={onClose}>
              <Icon name="x" size={16} />
            </button>
          </div>
        </div>

        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-label">Contact</div>
            <div className="kv"><span className="k">Contact name</span><span className="v">{c.contact}</span></div>
            <div className="kv"><span className="k">Phone</span><span className="v mono">{c.phone}</span></div>
            <div className="kv"><span className="k">Payment terms</span><span className="v mono">{c.terms}</span></div>
            <div className="kv"><span className="k">Customer since</span><span className="v">{c.since}</span></div>
            <div className="kv"><span className="k">Sales rep</span><span className="v">{c.rep}</span></div>
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Account Balance</div>
            <div className="kv">
              <span className="k">Current balance</span>
              <span className="v mono" style={{ fontSize: 16, fontWeight: 700 }}>{money(c.balance)}</span>
            </div>
            {c.overdue > 0 && (
              <div className="kv">
                <span className="k">Overdue amount</span>
                <span className="v mono" style={{ color: "var(--danger)", fontWeight: 600 }}>{money(c.overdue)}</span>
              </div>
            )}
            <div className="kv">
              <span className="k">Credit limit</span>
              <span className="v mono">{money(c.limit)}</span>
            </div>
            <div className="kv">
              <span className="k">YTD purchases</span>
              <span className="v mono">{money(c.ytd)}</span>
            </div>
            {c.limit > 0 && (
              <div style={{ marginTop: 14 }}>
                <div className="between mb8" style={{ fontSize: 12 }}>
                  <span className="muted">Credit utilized</span>
                  <span className="mono" style={{
                    fontWeight: 600,
                    color: usedPct > 85 ? "var(--danger)" : usedPct > 65 ? "var(--warn)" : "var(--text)",
                  }}>
                    {usedPct}%
                  </span>
                </div>
                <Meter value={c.balance} max={c.limit} height={7}
                  color={usedPct > 85 ? "var(--danger)" : usedPct > 65 ? "var(--warn)" : "var(--pos)"} />
              </div>
            )}
          </div>

          <div className="drawer-section">
            <div className="drawer-section-label">Recent Invoices</div>
            {recentInvoices.length > 0 ? (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th className="num">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map(inv => (
                    <tr key={inv.id} style={{ cursor: "default" }}>
                      <td className="mono" style={{ fontSize: 12.5, fontWeight: 500 }}>{inv.id}</td>
                      <td className="muted" style={{ fontSize: 12.5 }}>{inv.date}</td>
                      <td className="num mono td-strong">{money(inv.total)}</td>
                      <td><InvBadge status={inv.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted" style={{ fontSize: 13, padding: "8px 0" }}>No invoices on record</p>
            )}
          </div>

          <div className="drawer-section">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => { onClose(); go("sales"); }}>
                <Icon name="plus" size={14} />New Invoice
              </button>
              <button className="btn" style={{ flex: 1 }}>
                <Icon name="phone" size={14} />Call
              </button>
              <button className="btn" style={{ flex: 1 }}>
                <Icon name="mail" size={14} />Email
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AddCustomerDrawer({ onClose, onSave }) {
  const [name, setName]       = React.useState("");
  const [contact, setContact] = React.useState("");
  const [type, setType]       = React.useState("Retailer");
  const [city, setCity]       = React.useState("");
  const [phone, setPhone]     = React.useState("");
  const [terms, setTerms]     = React.useState("Net 15");
  const [limit, setLimit]     = React.useState(10000);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: "C-" + Date.now(),
      name: name.trim(),
      contact: contact.trim() || "—",
      type,
      city: city.trim() || "—",
      phone: phone.trim() || "—",
      terms,
      balance: 0,
      overdue: 0,
      limit: Number(limit) || 10000,
      since: new Date().getFullYear().toString(),
      lastOrder: "—",
      ytd: 0,
      rep: "—",
      risk: "low",
    });
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div className="drawer-title">Add Customer</div>
          <button className="btn btn-sm btn-icon btn-ghost" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-label">Business Info</div>
            <div className="col gap12">
              <div className="field">
                <label className="label">Business Name *</label>
                <input className="input" placeholder="e.g. Corner Smoke Shop"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Contact Name</label>
                <input className="input" placeholder="e.g. John Smith"
                  value={contact} onChange={e => setContact(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Type</label>
                <select className="select" value={type} onChange={e => setType(e.target.value)}>
                  {["Retailer", "C-Store", "Wholesaler"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">City / State</label>
                <input className="input" placeholder="e.g. Newark, NJ"
                  value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Phone</label>
                <input className="input" placeholder="e.g. (555) 000-0000"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="drawer-section">
            <div className="drawer-section-label">Account Terms</div>
            <div className="col gap12">
              <div className="field">
                <label className="label">Payment Terms</label>
                <select className="select" value={terms} onChange={e => setTerms(e.target.value)}>
                  {["Net 15", "Net 30", "COD"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">Credit Limit ($)</label>
                <input className="input mono" type="number" min="0"
                  value={limit} onChange={e => setLimit(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="drawer-section">
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                disabled={!name.trim()}
                onClick={handleSave}>
                <Icon name="plus" size={14} />Add Customer
              </button>
              <button className="btn" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { Customers, CustomerDrawer, AddCustomerDrawer });
