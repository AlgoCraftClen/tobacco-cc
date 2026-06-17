/* ============================================================
   PURCHASES — personal tobacco purchases (both partners)
   Brand · cans · price per can → auto total
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
      showToast("Purchase logged");
      onClose();
    } catch (e) { showToast("Couldn't save — check connection"); }
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Log a purchase" icon="cart">
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
          <input className="bignum" style={{ height: 54, fontSize: 24 }} type="number" inputMode="numeric" min="0"
            placeholder="0" value={cans} onChange={e => setCans(e.target.value)} />
        </div>
        <div className="field">
          <label className="label">Price per can</label>
          <div className="bignum-wrap">
            <span className="bignum-cur" style={{ fontSize: 18 }}>$</span>
            <input className="bignum prefixed" style={{ height: 54, fontSize: 24 }} type="number" inputMode="decimal" min="0" step="0.01"
              placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="review-row total mb16" style={{ borderRadius: 12, border: "1px solid var(--accent-line)" }}>
        <span className="rk">Total</span><span className="rv">{money(total)}</span>
      </div>

      <button className="btn btn-primary" style={{ width: "100%", height: 48 }} onClick={save} disabled={!valid || saving}>
        <Icon name="check" size={15} />{saving ? "Saving…" : "Save Purchase"}
      </button>
    </Sheet>
  );
}

function Purchases({ purchases, loading, role, showToast, refresh, params, go }) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [scope, setScope] = React.useState("all");

  React.useEffect(() => { if (params && params.add) setAddOpen(true); }, [params]);

  const filtered = scope === "all" ? purchases : purchases.filter(p => p.partner === scope);
  const total = filtered.reduce((s, p) => s + p.total, 0);

  const remove = async (p) => {
    try { await DB.purchases.delete(p.id); await refresh(); showToast("Purchase removed"); }
    catch (e) { showToast("Couldn't remove — check connection"); }
  };

  return (
    <div className="page fade-in">
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Purchases</div>
          <div className="page-desc">{filtered.length} logged · {money(total)} total</div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={14} />Add
          </button>
        </div>
      </div>

      <div className="seg mb16" style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(3,1fr)" }}>
        {[["all", "All"], ["Clanny", "Clanny"], ["Clenny", "Clenny"]].map(([k, l]) => (
          <button key={k} className={scope === k ? "on" : ""} onClick={() => setScope(k)}>{l}</button>
        ))}
      </div>

      {loading ? <SkeletonList count={4} /> :
        filtered.length > 0 ? filtered.map(p => (
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
        )) : (
          <div className="empty">
            <Icon name="cart" size={30} />
            <div className="empty-title">No purchases yet</div>
            <div className="empty-desc">Tap Add to log a personal purchase</div>
          </div>
        )}

      <AddPurchaseSheet open={addOpen} onClose={() => setAddOpen(false)} role={role} showToast={showToast} refresh={refresh} />

      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

Object.assign(window, { Purchases, AddPurchaseSheet });
