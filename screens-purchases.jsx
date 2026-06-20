/* ============================================================
   PRODUCT FUNDING — shipment funding ledger
   Product funding comes from New Shipment; older manual purchases are shown separately.
   ============================================================ */

function AddPurchaseSheet({ open, onClose, role, showToast, refresh }) {
  const [brand, setBrand] = React.useState("Grizzly");
  const [cans, setCans] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [partner, setPartner] = React.useState(role ? role.name : "Clanny");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) { setBrand("Grizzly"); setCans(""); setPrice(""); setPartner(role ? role.name : "Clanny"); }
  }, [open, role]);

  const total = (Number(cans) || 0) * (Number(price) || 0);
  const valid = brand && Number(cans) > 0 && Number(price) > 0;

  const save = async () => {
    setSaving(true);
    try {
      await DB.purchases.insert({
        partner, brand, cans: Number(cans) || 0,
        pricePerCan: Number(price) || 0, total,
      });
      await refresh();
      showToast("Older purchase logged");
      onClose();
    } catch (e) { showToast("Couldn't save — check connection"); }
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Log older purchase" icon="cart">
      <div className="step-hint" style={{ marginBottom: 16 }}>Use New Shipment for new product funding. This is only for older purchases that were not tied to a shipment.</div>
      <div className="field mb16">
        <label className="label">Who bought it?</label>
        <div className="choice-row">
          {["Clanny", "Clenny"].map(p => (
            <button key={p} className={"choice" + (partner === p ? " on" : "")} onClick={() => setPartner(p)} style={{ minHeight: 70 }}>
              <Avatar name={p} cls={p === "Clanny" ? "av-3" : "av-1"} size={28} />
              <div className="choice-name">{p}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="field mb16">
        <label className="label">Brand</label>
        <div className="choice-row">
          {DATA.BRANDS.map(b => (
            <button key={b} className={"choice" + (brand === b ? " on" : "")} onClick={() => setBrand(b)} style={{ minHeight: 70 }}>
              <div className="choice-ico"><Icon name="box" size={18} /></div>
              <div className="choice-name">{b}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="grid g-2 mb16" style={{ gap: 12 }}>
        <div className="field">
          <label className="label">Number of cans</label>
          <input className="bignum" style={{ height: 54, fontSize: 24 }} type="number" inputMode="numeric" min="0" placeholder="0" value={cans} onChange={e => setCans(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Price per can</label>
          <div className="bignum-wrap"><span className="bignum-cur" style={{ fontSize: 18 }}>$</span>
            <input className="bignum prefixed" style={{ height: 54, fontSize: 24 }} type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} /></div>
        </div>
      </div>
      <div className="review-row total mb16" style={{ borderRadius: 12, border: "1px solid var(--accent-line)" }}>
        <span className="rk">Total</span><span className="rv">{money(total)}</span>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", height: 48 }} onClick={save} disabled={!valid || saving}>
        <Icon name="check" size={15} />{saving ? "Saving…" : "Save Older Purchase"}
      </button>
    </Sheet>
  );
}

function FundingCard({ row, shipment }) {
  const meta = DATA.parseExpenseMeta(row) || {};
  return (
    <div className="list-card">
      <div className="lc-head" style={{ cursor: "default" }}>
        <Avatar name={row.partner} cls={row.partner === "Clanny" ? "av-3" : "av-1"} size={42} />
        <div className="lc-main">
          <div className="lc-title">{shipment ? shipment.brand : "Product"} <span className="cat-chip">{row.partner}</span></div>
          <div className="lc-sub">
            {shipment ? `${boxWord(shipment.boxes)} · ` : ""}{fmt(meta.rolls || 0)} rolls · {fmt(meta.cans || 0)} cans · {fmtDate(row.createdAt)}
          </div>
        </div>
        <div className="lc-amt">{money(row.amount)}</div>
      </div>
    </div>
  );
}

function Purchases({ purchases, shipments = [], expenses = [], loading, role, showToast, refresh, params, go }) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [scope, setScope] = React.useState("all");
  React.useEffect(() => { if (params && params.add) setAddOpen(true); }, [params]);

  const shipmentById = new Map((shipments || []).map(s => [s.id, s]));
  const fundingRows = (expenses || []).filter(DATA.isProductFunding).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const filteredFunding = scope === "all" ? fundingRows : fundingRows.filter(row => row.partner === scope);
  const filteredPurchases = scope === "all" ? purchases : purchases.filter(p => p.partner === scope);
  const fundingTotal = filteredFunding.reduce((s, row) => s + row.amount, 0);
  const olderTotal = filteredPurchases.reduce((s, p) => s + p.total, 0);

  const remove = async (p) => {
    try { await DB.purchases.delete(p.id); await refresh(); showToast("Older purchase removed"); }
    catch (e) { showToast("Couldn't remove — check connection"); }
  };

  return (
    <div className="page fade-in">
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Product Funding</div>
          <div className="page-desc">{filteredFunding.length} funding line{filteredFunding.length !== 1 ? "s" : ""} · {money(fundingTotal + olderTotal)} total</div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-primary" onClick={() => go("newshipment")}>
            <Icon name="plus" size={14} />New Shipment
          </button>
        </div>
      </div>

      <div className="seg mb16" style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
        {[["all", "All"], ["Clanny", "Clanny"], ["Clenny", "Clenny"]].map(([k, l]) => (
          <button key={k} className={scope === k ? "on" : ""} onClick={() => setScope(k)}>{l}</button>
        ))}
      </div>

      {loading ? <SkeletonList count={4} /> :
        filteredFunding.length > 0 ? filteredFunding.map(row => (
          <FundingCard key={row.id} row={row} shipment={shipmentById.get(row.shipmentId)} />
        )) : (
          <div className="empty">
            <Icon name="cart" size={30} />
            <div className="empty-title">No product funding yet</div>
            <div className="empty-desc">Create a shipment and enter who paid for the product</div>
          </div>
        )}

      {filteredPurchases.length > 0 && (
        <>
          <div className="sec-head" style={{ marginTop: 18 }}><span className="sec-title">Older manual purchases</span></div>
          {filteredPurchases.map(p => (
            <div key={p.id} className="list-card">
              <div className="lc-head" style={{ cursor: "default" }}>
                <Avatar name={p.partner} cls={p.partner === "Clanny" ? "av-3" : "av-1"} size={42} />
                <div className="lc-main">
                  <div className="lc-title">{p.brand} <span className="cat-chip">{p.partner}</span></div>
                  <div className="lc-sub">{fmt(p.cans)} cans · {money(p.pricePerCan, 2)}/can · {fmtDate(p.createdAt)}</div>
                </div>
                <div className="lc-amt">{money(p.total)}</div>
                <button className="icon-btn" onClick={() => remove(p)} title="Remove">
                  <Icon name="trash" size={15} className="faint" />
                </button>
              </div>
            </div>
          ))}
        </>
      )}

      <AddPurchaseSheet open={addOpen} onClose={() => setAddOpen(false)} role={role} showToast={showToast} refresh={refresh} />
      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

Object.assign(window, { Purchases, AddPurchaseSheet });
