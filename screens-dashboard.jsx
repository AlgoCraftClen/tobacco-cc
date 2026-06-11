/* ============================================================
   DASHBOARD — owner overview
   ============================================================ */

function StatCard({ icon, iconBg, iconColor, label, value, cur, trend, ctx, spark, sparkColor }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <div className="stat-ico" style={{ background: iconBg, color: iconColor }}>
          <Icon name={icon} size={15} />
        </div>
        <span className="stat-label">{label}</span>
        {spark && (
          <div style={{ marginLeft: "auto" }}>
            <Sparkline data={spark} color={sparkColor || iconColor} w={64} h={22} />
          </div>
        )}
      </div>
      <div className="stat-val">
        {cur && <span className="cur">$</span>}
        {value}
      </div>
      <div className="stat-foot">
        {trend !== undefined && <Trend value={trend} />}
        <span className="ctx">{ctx}</span>
      </div>
    </div>
  );
}
Object.assign(window, { StatCard });

const RANGES = {
  "7d":  { f: 0.23, rev: 9.1,  prof: 6.2,  ctx: "vs prior 7d"  },
  "30d": { f: 1,    rev: 12.4, prof: 8.1,  ctx: "vs last month" },
  "QTD": { f: 2.86, rev: 10.2, prof: 7.4,  ctx: "quarter to date" },
  "YTD": { f: 11.4, rev: 14.8, prof: 9.6,  ctx: "year to date" },
};

function Dashboard({ go, userName }) {
  const [, reload] = React.useReducer(x => x + 1, 0);
  const [range, setRange] = React.useState("30d");

  React.useEffect(() => {
    Promise.all([
      DB.products.list(),
      DB.invoices.list(),
      DB.shipments.list(),
      DB.customers.list(),
    ]).then(([products, invoices, shipments, customers]) => {
      DATA.products  = products;
      DATA.invoices  = invoices;
      DATA.shipments = shipments;
      DATA.customers = customers;

      // ── KPIs ──────────────────────────────────────────────────────────────
      const today      = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const revenue    = invoices.reduce((s, i) => s + i.total, 0);
      const paid       = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
      const invValue   = products.reduce((s, p) => s + p.onHand * p.casePrice, 0);
      const balances   = customers.reduce((s, c) => s + c.balance, 0);
      const overdueAmt = customers.reduce((s, c) => s + c.overdue, 0);
      const casesOut   = shipments.filter(s => s.status === "received").reduce((s, sh) => s + sh.cases, 0);

      DATA.kpis = {
        revenue,
        revenueTrend: 0,
        profit:       paid,
        profitTrend:  0,
        margin:       revenue > 0 ? Math.round((paid / revenue) * 100) : 0,
        invValue,
        invTrend:     0,
        balances,
        overdue:      overdueAmt,
        ordersToday:  invoices.filter(i => i.date === today).length,
        casesOut,
      };

      // ── Revenue series (group invoice totals by date, last 12 points) ────
      if (invoices.length > 0) {
        const grouped = {};
        invoices.forEach(inv => { grouped[inv.date] = (grouped[inv.date] || 0) + inv.total; });
        const vals = Object.values(grouped);
        DATA.revSeries    = vals.slice(-12);
        DATA.profitSeries = DATA.revSeries.map(v => Math.round(v * (revenue > 0 ? paid / revenue : 0)));
      } else {
        DATA.revSeries    = [];
        DATA.profitSeries = [];
      }

      // ── Top products (by sold_30, fallback to inventory value) ───────────
      const ranked = [...products].sort((a, b) =>
        (b.sold30 * b.casePrice || b.onHand * b.casePrice) -
        (a.sold30 * a.casePrice || a.onHand * a.casePrice)
      );
      DATA.topProducts = ranked.slice(0, 5).map(p => ({
        name:  p.name,
        units: p.sold30 || p.onHand,
        rev:   Math.round((p.sold30 || p.onHand) * p.casePrice),
        trend: 0,
      }));

      // ── Category mix (by brand, using inventory value) ───────────────────
      const brandRev = {};
      products.forEach(p => {
        const v = (p.sold30 || p.onHand) * p.casePrice;
        brandRev[p.brand] = (brandRev[p.brand] || 0) + v;
      });
      const catColors = ["var(--accent)", "var(--pos)", "var(--warn)", "var(--info)"];
      DATA.categoryMix = Object.entries(brandRev)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([name, val], i) => ({ name, val: +(val / 1000).toFixed(1), color: catColors[i % catColors.length] }));

      reload();
    });
  }, []);

  const d = DATA, k = d.kpis;
  const r = RANGES[range];
  const sc = (n) => Math.round(n * r.f);

  const lowStock  = d.products.filter(p => p.status !== "ok");
  const overdue   = d.invoices.filter(i => i.status === "overdue");
  const arriving  = d.shipments.filter(s => ["arriving", "verifying"].includes(s.status));

  return (
    <div className="page page-wide fade-in">
      {/* Header */}
      <div className="page-head">
        <div>
          <div className="page-title">Iakwe {userName || "Friend"}</div>
          <div className="page-desc">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} · {k.ordersToday} orders today · {k.casesOut} cases moving
            <span style={{ color: "var(--pos)", marginLeft: 8 }}>● Live</span>
          </div>
        </div>
        <div className="page-head-actions">
          <div className="seg">
            {Object.keys(RANGES).map(rg => (
              <button key={rg} className={range === rg ? "on" : ""} onClick={() => setRange(rg)}>{rg}</button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => go("sales")}>
            <Icon name="plus" size={14} />New Sale
          </button>
        </div>
      </div>

      {/* Spotlight — arriving now */}
      {arriving.filter(s => s.status === "verifying").map(sh => (
        <div key={sh.id} className="spotlight mb24">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
            <div className="spotlight-ico"><Icon name="truck" size={22} /></div>
            <div>
              <div className="center gap10">
                <span style={{ fontWeight: 600, fontSize: 14.5 }}>{sh.id} · {sh.supplier}</span>
                <Badge kind="warn">Verifying Now</Badge>
              </div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                {sh.cases} cases · {sh.lines} line items · {money(sh.value)} · Dock {sh.dock}
              </div>
            </div>
          </div>
          <div className="center gap8">
            <button className="btn" onClick={() => go("shipment", { id: sh.id })}>View Manifest</button>
            <button className="btn btn-primary" onClick={() => go("shipment", { id: sh.id })}>
              <Icon name="scan" size={14} />Receive
            </button>
          </div>
        </div>
      ))}

      {/* Needs Attention */}
      <div className="between mb12" style={{ alignItems: "baseline" }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.015em" }}>Needs attention</h2>
        <span className="faint" style={{ fontSize: 12 }}>
          {lowStock.length + overdue.length + arriving.length} items
        </span>
      </div>
      <div className="grid g-3 mb28">
        <AttentionCard
          icon="alert" color="var(--warn)" bg="var(--warn-bg)"
          title="Low stock" count={`${lowStock.length} items below reorder`}
          rows={lowStock.slice(0, 3).map(p => [p.name, `${p.onHand} ${p.baseUnit.toLowerCase()}s`])}
          action="View" onAction={() => go("inventory")} />
        <AttentionCard
          icon="receipt" color="var(--danger)" bg="var(--danger-bg)"
          title="Overdue invoices" count={`${money(k.overdue)} across ${overdue.length} accounts`}
          rows={overdue.map(i => [i.customer, money(i.total)])}
          action="Collect" onAction={() => go("sales")} />
        <AttentionCard
          icon="truck" color="var(--info)" bg="var(--info-bg)"
          title="Arriving today" count={`${arriving.length} shipments to receive`}
          rows={arriving.map(s => [s.id + " · " + s.supplier, s.status === "verifying" ? "Verifying" : s.cases + " cases"])}
          action="Receive" onAction={() => go("shipments")} />
      </div>

      {/* KPI Row */}
      <div className="between mb12" style={{ alignItems: "baseline" }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.015em" }}>Performance</h2>
        <span className="faint" style={{ fontSize: 12 }}>{r.ctx}</span>
      </div>
      <div className="grid g-4 stagger mb24">
        <StatCard icon="dollar"  iconBg="var(--accent-soft)"  iconColor="var(--accent)"
          label="Revenue" cur value={fmt(sc(k.revenue))} trend={r.rev} ctx={r.ctx}
          spark={d.revSeries.length > 1 ? d.revSeries : undefined} sparkColor="var(--accent)" />
        <StatCard icon="trendUp" iconBg="var(--pos-bg)"       iconColor="var(--pos)"
          label="Gross Profit" cur value={fmt(sc(k.profit))} trend={r.prof} ctx={`${k.margin}% margin`}
          spark={d.profitSeries.length > 1 ? d.profitSeries : undefined} sparkColor="var(--pos)" />
        <StatCard icon="pkg"     iconBg="var(--info-bg)"      iconColor="var(--info)"
          label="Inventory Value" cur value={fmt(k.invValue)} trend={k.invTrend} ctx="at cost, now" />
        <StatCard icon="wallet"  iconBg="var(--danger-bg)"    iconColor="var(--danger)"
          label="AR Balance" cur value={fmt(k.balances)} ctx={`${money(k.overdue)} overdue`} />
      </div>

      {/* Charts Row */}
      <div className="grid split mb16" style={{ gridTemplateColumns: "1.65fr 1fr" }}>
        <div className="card">
          <div className="card-hd">
            <h3>Revenue & Profit</h3>
            <div className="right">
              <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>{money(k.revenue)}</span>
            </div>
          </div>
          {d.revSeries.length > 1 ? (
            <div style={{ padding: "16px 18px 8px" }}>
              <AreaChart series={d.revSeries} series2={d.profitSeries.length > 1 ? d.profitSeries : undefined} h={230} />
            </div>
          ) : (
            <div className="empty">
              <Icon name="trendUp" size={28} />
              <div className="empty-title">No sales data yet</div>
              <div className="empty-desc">Charts will appear once you record sales</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-hd">
            <h3>Sales by Category</h3>
            <div className="right"><span className="muted" style={{ fontSize: 12 }}>30 days</span></div>
          </div>
          {d.categoryMix.length > 0 ? (
            <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 20 }}>
              <Donut data={d.categoryMix} size={136} thickness={16} center={{ top: "$0", bot: "revenue" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {d.categoryMix.map(c => (
                  <div key={c.name} className="between">
                    <span className="center gap8" style={{ fontSize: 12.5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                      {c.name}
                    </span>
                    <span className="mono muted" style={{ fontSize: 12 }}>${c.val}k</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty">
              <Icon name="invoice" size={28} />
              <div className="empty-title">No category data yet</div>
              <div className="empty-desc">Add sales to see category breakdown</div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid split" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        {/* Top Products */}
        <div className="card">
          <div className="card-hd">
            <h3>Top Products</h3>
            <div className="right">
              <button className="btn btn-sm btn-ghost" onClick={() => go("inventory")}>
                See all <Icon name="chevR" size={13} />
              </button>
            </div>
          </div>
          {d.topProducts.length > 0 ? (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Units sold</th>
                  <th>Trend</th>
                  <th className="num">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {d.topProducts.map((p, i) => (
                  <tr key={p.name} onClick={() => go("inventory")}>
                    <td>
                      <div className="center gap10">
                        <span className="mono faint" style={{ fontSize: 11, width: 14 }}>{i + 1}</span>
                        <span className="td-strong">{p.name}</span>
                      </div>
                    </td>
                    <td className="num mono">{p.units}</td>
                    <td>
                      <Sparkline
                        data={[5,6,5,7,8,7,9,10 + p.trend / 3]}
                        w={54} h={20}
                        color={p.trend >= 0 ? "var(--pos)" : "var(--danger)"}
                        fill={false} />
                    </td>
                    <td className="num mono td-strong">{money(p.rev)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">
              <Icon name="box" size={28} />
              <div className="empty-title">No products yet</div>
              <div className="empty-desc">Add inventory to see top performers</div>
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card">
          <div className="card-hd">
            <h3>Activity</h3>
            <div className="right">
              <span className="badge badge-pos" style={{ fontSize: 10.5 }}>
                <span className="dot" style={{ background: "var(--pos)" }} />Live
              </span>
            </div>
          </div>
          <div style={{ paddingTop: 4, paddingBottom: 8 }}>
            {d.activity.length > 0 ? d.activity.map((a, i) => (
              <div key={i} className="activity-row">
                <Avatar name={a.who} cls={a.av} size={28} />
                <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45 }}>
                  <span style={{ fontWeight: 500 }}>{a.who}</span>
                  <span className="muted"> {a.act} </span>
                  <span style={{ color: "var(--accent)", fontWeight: 500 }}>{a.obj}</span>
                  <div className="faint" style={{ fontSize: 11, marginTop: 2 }}>{a.meta}</div>
                </div>
                <span className="faint mono" style={{ fontSize: 10.5, flexShrink: 0 }}>{a.time}</span>
              </div>
            )) : (
              <div className="empty">
                <Icon name="bell" size={28} />
                <div className="empty-title">No activity yet</div>
                <div className="empty-desc">Actions will appear here as you use the app</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AttentionCard({ icon, color, bg, title, count, rows, action, onAction }) {
  return (
    <div className="attn">
      <div className="attn-top">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="attn-icon" style={{ background: bg, color }}>
            <Icon name={icon} size={17} />
          </div>
          <div>
            <div className="attn-title">{title}</div>
            <div className="attn-subtitle">{count}</div>
          </div>
        </div>
        <button className="btn btn-sm" onClick={onAction}>{action}</button>
      </div>
      <div>
        {rows.map((row, i) => (
          <div key={i} className="attn-row">
            <span style={{ color: "var(--text-2)", fontSize: 12.5 }}>{row[0]}</span>
            <span className="mono" style={{ color, fontWeight: 600, fontSize: 12 }}>{row[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, AttentionCard });
