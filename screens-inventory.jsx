/* ============================================================
   INVENTORY + PRODUCT DETAIL + add/delete
   Unit ladder: 1 Case = 6 Boxes = 60 Rolls = 300 Cans
   ============================================================ */

function Inventory({ go, showToast }) {
  const [products, setProducts] = React.useState(() => [...DATA.products]);
  const [cat, setCat]   = React.useState("All");
  const [q, setQ]       = React.useState("");
  const [view, setView] = React.useState("table");
  const [showAdd, setShowAdd] = React.useState(false);

  const cats = ["All", ...new Set(DATA.products.map(p => p.cat))];
  const list = products.filter(p =>
    (cat === "All" || p.cat === cat) &&
    (p.name.toLowerCase().includes(q.toLowerCase()) || p.sku.toLowerCase().includes(q.toLowerCase()))
  );
  const lowCount = products.filter(p => p.status !== "ok").length;

  const deleteProduct = (id, e) => {
    e.stopPropagation();
    setProducts(ps => ps.filter(p => p.id !== id));
    showToast && showToast("Product removed");
  };

  return (
    <div className="page page-wide fade-in">
      <div className="page-head">
        <div>
          <div className="page-title">Inventory</div>
          <div className="page-desc">
            {products.length} SKUs · {fmt(products.reduce((s, p) => s + p.onHand, 0))} units on hand · valued at {money(DATA.kpis.invValue)}
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn"><Icon name="download" size={14} />Export</button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Icon name="plus" size={14} />Add Product
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid g-4 mb20">
        <StatCard icon="pkg"     iconBg="var(--info-bg)"    iconColor="var(--info)"   label="Inventory Value" cur value={fmt(DATA.kpis.invValue)} ctx="at cost" />
        <StatCard icon="box"     iconBg="var(--accent-soft)" iconColor="var(--accent)" label="SKUs On Hand"   value={String(products.length)} ctx="active products" />
        <StatCard icon="alert"   iconBg="var(--warn-bg)"    iconColor="var(--warn)"   label="Need Reorder"   value={String(lowCount)} ctx="below par" />
        <StatCard icon="trendUp" iconBg="var(--pos-bg)"     iconColor="var(--pos)"    label="Turn Rate"      value="6.2×" trend={4.1} ctx="annualized" />
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-inp" style={{ minWidth: 280 }}>
          <Icon name="search" size={14} />
          <input placeholder="Search product name or SKU…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="seg">
          {cats.map(c => (
            <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto" }} className="seg">
          <button className={view === "table" ? "on" : ""} onClick={() => setView("table")}>
            <Icon name="list" size={14} />
          </button>
          <button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")}>
            <Icon name="grid" size={14} />
          </button>
        </div>
      </div>

      {view === "table" ? (
        <div className="card">
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Stock level</th>
                <th className="num">On hand</th>
                <th className="num">Reorder at</th>
                <th className="num">Case price</th>
                <th className="num">Sold 30d</th>
                <th>Status</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map(p => {
                const meterColor = p.status === "ok" ? "var(--pos)" : p.status === "low" ? "var(--warn)" : "var(--danger)";
                return (
                  <tr key={p.id} onClick={() => go("product", { id: p.id })}>
                    <td>
                      <div className="cell-ico">
                        <div className="thumb">
                          <Icon name="box" size={15} className="muted" />
                        </div>
                        <div className="cell-2">
                          <span className="td-strong">{p.name}</span>
                          <span className="td-sub mono">{p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="cat-chip">{p.cat}</span></td>
                    <td>
                      <div className="meter-row" style={{ width: 130 }}>
                        <Meter value={p.onHand} max={p.par} color={meterColor} />
                        <span className="faint mono" style={{ fontSize: 10.5, flexShrink: 0 }}>
                          {Math.round(p.onHand / p.par * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="num mono td-strong">{p.onHand}</td>
                    <td className="num mono muted">{p.reorder}</td>
                    <td className="num mono">{money(p.casePrice)}</td>
                    <td className="num mono muted">{p.sold30}</td>
                    <td><StockBadge status={p.status} /></td>
                    <td><Icon name="chevR" size={14} className="row-arrow" /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-sm btn-icon btn-ghost btn-danger"
                        onClick={e => deleteProduct(p.id, e)}
                        title="Remove product">
                        <Icon name="trash" size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && (
            <div className="empty">
              <Icon name="box" size={28} />
              <div className="empty-title">No products found</div>
              <div className="empty-desc">Try adjusting your search or add a new product</div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid g-4 stagger">
          {list.map(p => {
            const meterColor = p.status === "ok" ? "var(--pos)" : p.status === "low" ? "var(--warn)" : "var(--danger)";
            return (
              <div key={p.id} className="card card-pad" style={{ cursor: "pointer", position: "relative" }}
                onClick={() => go("product", { id: p.id })}>
                <div className="between mb12">
                  <div className="thumb" style={{ width: 40, height: 40 }}>
                    <Icon name="box" size={18} className="muted" />
                  </div>
                  <div className="center gap8">
                    <StockBadge status={p.status} />
                    <button className="btn btn-sm btn-icon btn-ghost btn-danger"
                      onClick={e => deleteProduct(p.id, e)}
                      title="Remove product">
                      <Icon name="trash" size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{p.name}</div>
                <div className="td-sub mono mb14">{p.brand} · {p.sku}</div>
                <div className="between" style={{ alignItems: "flex-end", marginBottom: 12 }}>
                  <div>
                    <div className="faint" style={{ fontSize: 10.5 }}>On hand</div>
                    <div className="mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.04em" }}>
                      {p.onHand}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="faint" style={{ fontSize: 10.5 }}>Case price</div>
                    <div className="mono td-strong" style={{ fontSize: 14 }}>{money(p.casePrice)}</div>
                  </div>
                </div>
                <Meter value={p.onHand} max={p.par} color={meterColor} />
                <div className="between mt8">
                  <span className="faint" style={{ fontSize: 10.5 }}>Par: {p.par}</span>
                  <span className="faint mono" style={{ fontSize: 10.5 }}>{Math.round(p.onHand / p.par * 100)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <AddProductDrawer
          onClose={() => setShowAdd(false)}
          onSave={(p) => {
            setProducts(ps => [p, ...ps]);
            setShowAdd(false);
            showToast && showToast("Product added: " + p.name);
          }}
        />
      )}
    </div>
  );
}

function AddProductDrawer({ onClose, onSave }) {
  const [name, setName]         = React.useState("");
  const [brand, setBrand]       = React.useState("");
  const [cat, setCat]           = React.useState("Cigarettes");
  const [sku, setSku]           = React.useState("");
  const [baseUnit, setBaseUnit] = React.useState("Case");
  const [casePrice, setCasePrice] = React.useState("");
  const [cost, setCost]         = React.useState("");
  const [onHand, setOnHand]     = React.useState("");
  const [reorder, setReorder]   = React.useState("");
  const [par, setPar]           = React.useState("");

  const handleSave = () => {
    if (!name.trim() || !sku.trim()) return;
    const oh = Number(onHand) || 0;
    const ro = Number(reorder) || 0;
    const pr = Number(par) || 0;
    const status = oh <= 0 ? "critical" : oh < ro ? "low" : "ok";
    onSave({
      id: "P-" + Date.now(),
      name: name.trim(),
      brand: brand.trim() || "—",
      cat,
      sku: sku.trim(),
      baseUnit,
      casePrice: Number(casePrice) || 0,
      cost: Number(cost) || 0,
      onHand: oh,
      reorder: ro,
      par: pr || Math.max(oh * 2, 1),
      sold30: 0,
      status,
    });
  };

  const cats = ["Cigarettes", "Smokeless", "Nicotine Pouch", "Cigars", "Vapor", "Accessories"];

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <div className="drawer-title">Add Product</div>
          <button className="btn btn-sm btn-icon btn-ghost" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="drawer-body">
          <div className="drawer-section">
            <div className="drawer-section-label">Product Info</div>
            <div className="col gap12">
              <div className="field">
                <label className="label">Product Name *</label>
                <input className="input" placeholder="e.g. Marlboro Red"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Brand</label>
                <input className="input" placeholder="e.g. Philip Morris"
                  value={brand} onChange={e => setBrand(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Category</label>
                <select className="select" value={cat} onChange={e => setCat(e.target.value)}>
                  {cats.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="label">SKU *</label>
                <input className="input mono" placeholder="e.g. MB-RED-200"
                  value={sku} onChange={e => setSku(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Base Unit</label>
                <select className="select" value={baseUnit} onChange={e => setBaseUnit(e.target.value)}>
                  {["Case", "Box", "Roll", "Can"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="drawer-section">
            <div className="drawer-section-label">Pricing & Stock</div>
            <div className="col gap12">
              <div className="field">
                <label className="label">Case Price ($)</label>
                <input className="input mono" type="number" min="0" placeholder="0"
                  value={casePrice} onChange={e => setCasePrice(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Unit Cost ($)</label>
                <input className="input mono" type="number" min="0" placeholder="0"
                  value={cost} onChange={e => setCost(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">On Hand (units)</label>
                <input className="input mono" type="number" min="0" placeholder="0"
                  value={onHand} onChange={e => setOnHand(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Reorder Point</label>
                <input className="input mono" type="number" min="0" placeholder="0"
                  value={reorder} onChange={e => setReorder(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Par Level</label>
                <input className="input mono" type="number" min="0" placeholder="0"
                  value={par} onChange={e => setPar(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="drawer-section">
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                disabled={!name.trim() || !sku.trim()}
                onClick={handleSave}>
                <Icon name="plus" size={14} />Add Product
              </button>
              <button className="btn" onClick={onClose}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ProductDetail({ go, params }) {
  const d = DATA;
  const p = d.products.find(x => x.id === params.id) || d.products[0];
  const margin = Math.round((1 - p.cost / p.casePrice) * 100);
  const daysLeft = Math.round(p.onHand / (p.sold30 / 30));

  const unitBreakdown = [
    { unit: "Case", qty: p.onHand,      price: p.casePrice,                        desc: "6 Boxes" },
    { unit: "Box",  qty: p.onHand * 6,  price: Math.round(p.casePrice / 6),        desc: "10 Rolls" },
    { unit: "Roll", qty: p.onHand * 60, price: Math.round(p.casePrice / 60),       desc: "5 Cans" },
    { unit: "Can",  qty: p.onHand * 300,price: +(p.casePrice / 300).toFixed(2),    desc: "Single unit" },
  ];

  const meterColor = p.status === "ok" ? "var(--pos)" : p.status === "low" ? "var(--warn)" : "var(--danger)";

  return (
    <div className="page fade-in">
      <button className="btn btn-sm btn-ghost mb16" onClick={() => go("inventory")}>
        <Icon name="chevL" size={13} />Inventory
      </button>

      <div className="page-head">
        <div className="center gap16">
          <div className="thumb" style={{ width: 52, height: 52, borderRadius: 12 }}>
            <Icon name="box" size={22} className="muted" />
          </div>
          <div>
            <div className="center gap10 mb4">
              <div className="page-title">{p.name}</div>
              <StockBadge status={p.status} />
            </div>
            <div className="page-desc">{p.brand} · {p.cat} · <span className="mono">{p.sku}</span></div>
          </div>
        </div>
        <div className="page-head-actions">
          <button className="btn"><Icon name="edit" size={14} />Edit</button>
          <button className="btn btn-primary"><Icon name="truck" size={14} />Reorder</button>
        </div>
      </div>

      <div className="grid split" style={{ gridTemplateColumns: "1.65fr 1fr" }}>
        <div className="col gap16">
          <div className="grid g-3">
            <div className="stat">
              <div className="stat-top"><span className="stat-label">On Hand</span></div>
              <div className="stat-val">{p.onHand} <span style={{ fontSize: 13, color: "var(--text-3)", marginLeft: 2 }}>cases</span></div>
              <div className="stat-foot">
                <Meter value={p.onHand} max={p.par} color={meterColor} height={4} />
                <span className="ctx" style={{ marginLeft: 4 }}>par {p.par}</span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-top"><span className="stat-label">Gross Margin</span></div>
              <div className="stat-val" style={{ color: "var(--pos)" }}>{margin}<span style={{ fontSize: 16 }}>%</span></div>
              <div className="stat-foot"><span className="ctx">{money(p.casePrice - p.cost)} / case profit</span></div>
            </div>
            <div className="stat">
              <div className="stat-top"><span className="stat-label">Velocity</span></div>
              <div className="stat-val">{p.sold30}</div>
              <div className="stat-foot"><span className="ctx">units sold · last 30d</span></div>
            </div>
          </div>

          <div className="card">
            <div className="card-hd">
              <h3>Unit Breakdown</h3>
              <span className="muted sub" style={{ marginLeft: "auto", fontSize: 11.5 }}>
                1 Case = 6 Boxes = 60 Rolls = 300 Cans
              </span>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Contains</th>
                  <th className="num">Available</th>
                  <th className="num">Unit price</th>
                </tr>
              </thead>
              <tbody>
                {unitBreakdown.map(u => (
                  <tr key={u.unit} style={{ cursor: "default" }}>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        fontFamily: "var(--mono)", fontSize: 12, fontWeight: 600,
                        color: { Case: "#5b8def", Box: "#c08bf0", Roll: "#d4a030", Can: "#4fc4cf" }[u.unit],
                      }}>
                        <span className={`uq uq-${u.unit.toLowerCase()}`} />
                        {u.unit}
                      </span>
                    </td>
                    <td className="muted">{u.desc}</td>
                    <td className="num mono td-strong">{fmt(u.qty)}</td>
                    <td className="num mono">{typeof u.price === "number" && u.price >= 1 ? money(u.price) : "$" + u.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-hd">
              <h3>Stock Movement</h3>
              <span className="muted sub" style={{ marginLeft: "auto", fontSize: 11.5 }}>Last 12 weeks</span>
            </div>
            <div style={{ padding: "16px 18px 8px" }}>
              <AreaChart
                series={[210,198,220,240,232,205,188,215,200,178,196,p.onHand]}
                h={160} color="var(--info)" />
            </div>
          </div>
        </div>

        <div className="col gap16">
          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Pricing & Cost</div>
            <div className="kv"><span className="k">Case price</span><span className="v mono">{money(p.casePrice)}</span></div>
            <div className="kv"><span className="k">Unit cost</span><span className="v mono">{money(p.cost)}</span></div>
            <div className="kv"><span className="k">Gross margin</span><span className="v mono" style={{ color: "var(--pos)" }}>{margin}%</span></div>
            <div className="kv"><span className="k">Reorder point</span><span className="v mono">{p.reorder} cases</span></div>
            <div className="kv"><span className="k">Par level</span><span className="v mono">{p.par} cases</span></div>
          </div>

          <div className="card card-pad">
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Supplier</div>
            <div className="center gap12 mb14">
              <Avatar name={p.brand} cls="av-3" size={34} />
              <div>
                <div style={{ fontWeight: 500, fontSize: 13.5 }}>{p.brand}</div>
                <div className="faint" style={{ fontSize: 11.5 }}>Last order 8 days ago</div>
              </div>
            </div>
            <div className="kv"><span className="k">Lead time</span><span className="v">3–5 days</span></div>
            <div className="kv"><span className="k">Min. order</span><span className="v">10 cases</span></div>
            <button className="btn btn-sm" style={{ width: "100%", marginTop: 14 }}>
              <Icon name="truck" size={13} />Create Purchase Order
            </button>
          </div>

          <div className="card card-pad" style={{
            background: p.status !== "ok"
              ? "linear-gradient(135deg, rgba(224,82,82,0.08), transparent)"
              : "var(--accent-softer)",
            borderColor: p.status !== "ok" ? "var(--danger-bg)" : "var(--accent-line)",
          }}>
            <div className="center gap10">
              <Icon name={p.status !== "ok" ? "alert" : "trendUp"} size={17}
                style={{ color: p.status !== "ok" ? "var(--danger)" : "var(--accent)", flexShrink: 0 }} />
              <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.55 }}>
                At current velocity, stock lasts{" "}
                <strong style={{ color: "var(--text)" }}>~{daysLeft} days</strong>.
                {p.status !== "ok" && (
                  <span style={{ color: "var(--warn)", display: "block", marginTop: 4 }}>
                    Reorder recommended.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Inventory, ProductDetail, AddProductDrawer });
