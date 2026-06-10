/* ============================================================
   WORKERS + EXPENSES + REPORTS
   ============================================================ */
function Workers({ go, showToast }) {
  const d = DATA;
  const owed = d.workers.reduce((s, w) => s + w.owed, 0);
  const due = d.workers.filter(w => w.owed > 0).length;
  const [sel, setSel] = React.useState(null);
  return (
    <div className="page page-wide fade-in">
      <div className="page-head">
        <div><div className="page-title">Workers</div><div className="page-desc">{d.workers.length} on payroll · {money(owed)} owed across {due} people · next run Jun 13</div></div>
        <div className="page-head-actions"><button className="btn"><Icon name="cal" size={15} />Payroll History</button><button className="btn btn-primary" onClick={() => showToast(`Payroll run started · ${money(owed)}`)}><Icon name="wallet" size={15} />Run Payroll</button></div>
      </div>

      <div className="grid g-4 mb16">
        <StatCard icon="worker" iconBg="rgba(192,139,240,0.12)" iconColor="#c08bf0" label="Headcount" value={String(d.workers.length)} ctx="active" />
        <StatCard icon="wallet" iconBg="var(--warn-bg)" iconColor="var(--warn)" label="Total Owed" cur value={fmt(owed)} ctx={`${due} pending`} />
        <StatCard icon="dollar" iconBg="var(--info-bg)" iconColor="var(--info)" label="Labor Cost (MTD)" cur value={fmt(d.kpis.laborCost)} trend={2.4} ctx="this month" />
        <StatCard icon="trendUp" iconBg="var(--pos-bg)" iconColor="var(--pos)" label="Rev / Labor $" value="8.2×" trend={5} ctx="efficiency" />
      </div>

      <div className="card">
        <div className="card-hd"><h3>Team</h3><div className="right"><span className="muted" style={{ fontSize: 12 }}>Click to view payment history</span></div></div>
        <table className="tbl">
          <thead><tr><th>Worker</th><th>Role</th><th>Pay Type</th><th>Hours</th><th>Route</th><th className="num">YTD Paid</th><th className="num">Owed</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {d.workers.map(w => (
              <React.Fragment key={w.id}>
                <tr onClick={() => setSel(sel === w.id ? null : w.id)}>
                  <td><div className="cell-ico"><Avatar name={w.name} cls={w.av} size={32} /><span className="td-strong">{w.name}</span></div></td>
                  <td className="muted">{w.role}</td>
                  <td><Badge kind="outline">{w.pay}</Badge></td>
                  <td className="mono muted">{w.hours}</td>
                  <td className="muted">{w.route}</td>
                  <td className="num mono">{money(w.ytd)}</td>
                  <td className="num mono td-strong" style={{ color: w.owed ? "var(--warn)" : "var(--text-3)" }}>{w.owed ? money(w.owed) : "—"}</td>
                  <td><Badge kind={w.status === "paid" ? "pos" : "warn"} dot={w.status === "paid" ? "var(--pos)" : "var(--warn)"}>{w.status === "paid" ? "Paid" : "Due"}</Badge></td>
                  <td><Icon name={sel === w.id ? "chevU" : "chevD"} size={15} className="muted" /></td>
                </tr>
                {sel === w.id && (
                  <tr style={{ cursor: "default" }}><td colSpan="9" style={{ padding: 0, background: "var(--bg-grad)" }}>
                    <div style={{ padding: "14px 18px" }}>
                      <div className="between mb12"><span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)" }}>Payment History</span>{w.owed > 0 && <button className="btn btn-sm btn-primary" onClick={() => showToast(`Paid ${w.name} ${money(w.owed)}`)}><Icon name="check" size={13} />Pay {money(w.owed)}</button>}</div>
                      <div className="grid g-3" style={{ gap: 10 }}>
                        {[["Jun 6", w.pay === "Hourly" ? money(920) : money(1840), "cleared"], ["May 31", money(w.ytd / 12 | 0), "cleared"], ["May 24", money(w.ytd / 13 | 0), "cleared"]].map((p, i) => (
                          <div key={i} className="card card-pad" style={{ padding: 12 }}><div className="between"><span className="faint" style={{ fontSize: 11.5 }}>{p[0]}</span><Badge kind="pos">{p[2]}</Badge></div><div className="mono" style={{ fontSize: 17, fontWeight: 600, marginTop: 6 }}>{p[1]}</div></div>
                        ))}
                      </div>
                    </div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const EX_COLORS = { Rent: "#5b8def", "Taxes & Licenses": "#f06a6a", Utilities: "#3ecf8e", Fuel: "#e0a93c", Insurance: "#c08bf0", Supplies: "#4fc4cf" };
function Expenses({ showToast }) {
  const d = DATA;
  const total = d.expenses.reduce((s, e) => s + e.amount, 0);
  const byCat = Object.entries(d.expenses.reduce((a, e) => ((a[e.cat] = (a[e.cat] || 0) + e.amount), a), {})).map(([name, val]) => ({ name, val, color: EX_COLORS[name] || "#888" })).sort((a, b) => b.val - a.val);
  const [cat, setCat] = React.useState("All");
  const cats = ["All", ...byCat.map(c => c.name)];
  const list = d.expenses.filter(e => cat === "All" || e.cat === cat);
  return (
    <div className="page page-wide fade-in">
      <div className="page-head">
        <div><div className="page-title">Expenses</div><div className="page-desc">{money(total)} this month · {d.expenses.length} transactions · <span style={{ color: "var(--pos)" }}>5.6% below budget</span></div></div>
        <div className="page-head-actions"><button className="btn"><Icon name="download" size={15} />Export</button><button className="btn btn-primary"><Icon name="plus" size={15} />Log Expense</button></div>
      </div>

      <div className="grid split" style={{ gridTemplateColumns: "1fr 1.7fr", marginBottom: 16 }}>
        <div className="card">
          <div className="card-hd"><h3>By Category</h3></div>
          <div className="card-pad center" style={{ gap: 20 }}>
            <Donut data={byCat} size={132} thickness={16} center={{ top: moneyK(total), bot: "total" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
              {byCat.map(c => <div key={c.name} className="between"><span className="center gap8" style={{ fontSize: 12 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />{c.name}</span><span className="mono muted" style={{ fontSize: 11.5 }}>{money(c.val)}</span></div>)}
            </div>
          </div>
        </div>
        <div className="grid g-2" style={{ alignContent: "start" }}>
          <StatCard icon="receipt" iconBg="var(--warn-bg)" iconColor="var(--warn)" label="Total (MTD)" cur value={fmt(total)} trend={-5.6} ctx="vs budget" />
          <StatCard icon="dollar" iconBg="var(--danger-bg)" iconColor="var(--danger)" label="Largest" value="Excise Tax" ctx={money(11200)} />
          <StatCard icon="clock" iconBg="var(--info-bg)" iconColor="var(--info)" label="Pending" value="1" ctx={money(2150) + " · insurance"} />
          <StatCard icon="trendUp" iconBg="var(--pos-bg)" iconColor="var(--pos)" label="% of Revenue" value="7.4%" trend={-1} ctx="opex ratio" />
        </div>
      </div>

      <div className="filter-bar"><div className="seg">{cats.map(c => <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}</div></div>

      <div className="card">
        <table className="tbl">
          <thead><tr><th>Date</th><th>Vendor</th><th>Category</th><th>Method</th><th>Status</th><th className="num">Amount</th></tr></thead>
          <tbody>
            {list.map(e => (
              <tr key={e.id} style={{ cursor: "default" }}>
                <td className="muted">{e.date}</td>
                <td className="td-strong">{e.vendor}</td>
                <td><span className="center gap6" style={{ fontSize: 12.5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: EX_COLORS[e.cat] || "#888" }} />{e.cat}</span></td>
                <td className="muted">{e.method}</td>
                <td><Badge kind={e.status === "paid" ? "pos" : "warn"} dot={e.status === "paid" ? "var(--pos)" : "var(--warn)"}>{e.status}</Badge></td>
                <td className="num mono td-strong">{money(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Reports({ go }) {
  const d = DATA, k = d.kpis;
  const cogs = k.revenue - k.profit - k.laborCost - k.expenses;
  const pnl = [
    { label: "Revenue", val: k.revenue, kind: "pos", bold: true },
    { label: "Cost of Goods Sold", val: -cogs, kind: "neg" },
    { label: "Gross Profit", val: k.revenue - cogs, kind: "sub", bold: true },
    { label: "Labor Cost", val: -k.laborCost, kind: "neg" },
    { label: "Operating Expenses", val: -k.expenses, kind: "neg" },
    { label: "Net Profit", val: k.profit, kind: "net", bold: true },
  ];
  return (
    <div className="page page-wide fade-in">
      <div className="page-head">
        <div><div className="page-title">Reports</div><div className="page-desc">Profitability & financial overview · June 2026 · {k.margin}% net margin</div></div>
        <div className="page-head-actions"><div className="seg"><button className="on">This Month</button><button>Quarter</button><button>Year</button></div><button className="btn"><Icon name="download" size={15} />PDF</button></div>
      </div>

      <div className="grid g-6 stagger mb16">
        <StatCard icon="dollar" iconBg="var(--accent-soft)" iconColor="var(--accent)" label="Revenue" cur value={fmt(k.revenue)} trend={k.revenueTrend} ctx="MTD" />
        <StatCard icon="trendUp" iconBg="var(--pos-bg)" iconColor="var(--pos)" label="Net Profit" cur value={fmt(k.profit)} trend={k.profitTrend} ctx={`${k.margin}%`} />
        <StatCard icon="pkg" iconBg="var(--info-bg)" iconColor="var(--info)" label="Inventory Value" cur value={fmt(k.invValue)} trend={k.invTrend} ctx="at cost" />
        <StatCard icon="worker" iconBg="rgba(192,139,240,0.12)" iconColor="#c08bf0" label="Labor Cost" cur value={fmt(k.laborCost)} trend={k.laborTrend} ctx="MTD" />
        <StatCard icon="receipt" iconBg="var(--warn-bg)" iconColor="var(--warn)" label="Expenses" cur value={fmt(k.expenses)} trend={k.expTrend} ctx="MTD" />
        <StatCard icon="wallet" iconBg="var(--danger-bg)" iconColor="var(--danger)" label="Receivables" cur value={fmt(k.balances)} ctx={money(k.overdue) + " overdue"} />
      </div>

      <div className="grid split" style={{ gridTemplateColumns: "1.3fr 1fr", marginBottom: 16 }}>
        <div className="card">
          <div className="card-hd"><h3>Cash Flow</h3><div className="center gap16" style={{ marginLeft: 14 }}><span className="center gap6" style={{ fontSize: 11.5, color: "var(--text-2)" }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--accent)" }} />In</span><span className="center gap6" style={{ fontSize: 11.5, color: "var(--text-2)" }}><span style={{ width: 9, height: 9, borderRadius: 2, background: "var(--panel-3)", border: "1px solid var(--border-2)" }} />Out</span></div></div>
          <div style={{ padding: "16px 18px 8px" }}><BarPair data={d.cashflow} h={210} /></div>
        </div>
        <div className="card">
          <div className="card-hd"><h3>Profit & Loss</h3><div className="right"><span className="muted" style={{ fontSize: 12 }}>June 2026</span></div></div>
          <div className="card-pad">
            {pnl.map((r, i) => (
              <div key={i} className="between" style={{ padding: "11px 0", borderTop: i ? "1px solid var(--border)" : "none", borderBottom: r.kind === "net" ? "none" : undefined }}>
                <span style={{ fontSize: 13.5, fontWeight: r.bold ? 600 : 400, color: r.kind === "sub" || r.kind === "net" ? "var(--text)" : "var(--text-2)" }}>{r.label}</span>
                <span className="mono" style={{ fontSize: r.kind === "net" ? 18 : 14, fontWeight: r.bold ? 600 : 500, color: r.kind === "net" ? "var(--pos)" : r.val < 0 ? "var(--text-3)" : "var(--text)" }}>{r.val < 0 ? "(" + money(-r.val) + ")" : money(r.val)}</span>
              </div>
            ))}
            <div className="center gap8 mt12" style={{ padding: "10px 12px", background: "var(--accent-softer)", borderRadius: 8, fontSize: 12.5, color: "var(--text-2)" }}><Icon name="trendUp" size={15} style={{ color: "var(--accent)" }} />Net margin up <b style={{ color: "var(--pos)" }}>{k.profitTrend}%</b> vs last month</div>
          </div>
        </div>
      </div>

      <div className="grid split" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
        <div className="card">
          <div className="card-hd"><h3>Category Mix</h3></div>
          <div className="card-pad center" style={{ gap: 20 }}>
            <Donut data={d.categoryMix} size={130} thickness={16} center={{ top: "$318k", bot: "revenue" }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
              {d.categoryMix.map(c => <div key={c.name} className="between"><span className="center gap8" style={{ fontSize: 12 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />{c.name}</span><span className="mono muted" style={{ fontSize: 11.5 }}>${c.val}k</span></div>)}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><h3>Top Products by Margin</h3><div className="right"><button className="btn btn-sm btn-ghost" onClick={() => go("inventory")}>Inventory</button></div></div>
          <table className="tbl">
            <thead><tr><th>Product</th><th className="num">Units</th><th>Trend</th><th className="num">Revenue</th></tr></thead>
            <tbody>
              {d.topProducts.map((p, i) => (
                <tr key={p.name} style={{ cursor: "default" }}>
                  <td><div className="center gap10"><span className="mono faint" style={{ fontSize: 11, width: 14 }}>{i + 1}</span><span className="td-strong">{p.name}</span></div></td>
                  <td className="num mono">{p.units}</td>
                  <td><Trend value={p.trend} /></td>
                  <td className="num mono td-strong">{money(p.rev)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Workers, Expenses, Reports });
