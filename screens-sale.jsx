/* ============================================================
   SALE - Updated Running Sales Report
   Running entries: Sale #, quantity, cans, price/can, revenue.
   ============================================================ */

const fmtQty = (n) => {
  const x = Number(n) || 0;
  return Number.isInteger(x) ? fmt(x) : x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

function SaleReportRow({ sale, onDelete }) {
  const cases = Number(sale.quantityCases) || ((Number(sale.cans) || 0) / DATA.TO_CANS.Case);
  const cans = Number(sale.cans) || 0;
  const pricePerCan = Number(sale.pricePerCan) || 0;
  const revenue = Number(sale.revenue) || (cans * pricePerCan);
  return (
    <div className="list-card">
      <div className="lc-head" style={{ cursor: "default" }}>
        <div className="lc-ico"><Icon name="reports" size={18} /></div>
        <div className="lc-main">
          <div className="lc-title">Sale #{sale.saleNo}</div>
          <div className="lc-sub">{fmtQty(cases)} case{cases === 1 ? "" : "s"} - {fmt(cans)} cans - {fmtDate(sale.createdAt)}</div>
        </div>
        <div className="lc-amt">{money(revenue, 2)}</div>
        <button className="icon-btn" onClick={() => onDelete(sale)} title="Remove sale">
          <Icon name="trash" size={15} className="faint" />
        </button>
      </div>
      <div className="lc-body">
        <div className="calc-grid">
          <Cell k="Quantity" v={`${fmtQty(cases)} case${cases === 1 ? "" : "s"}`} />
          <Cell k="Cans" v={fmt(cans)} />
          <Cell k="Price/Can" v={money(pricePerCan, 2)} />
          <Cell k="Revenue" v={money(revenue, 2)} accent />
        </div>
        <div className="review-card mt16">
          <ReviewRow k="Revenue formula" v={`${fmt(cans)} x ${money(pricePerCan, 2)}`} total />
        </div>
      </div>
    </div>
  );
}

function AddSaleSheet({ open, onClose, sales, showToast, refresh }) {
  const nextNo = (sales || []).reduce((m, s) => Math.max(m, Number(s.saleNo) || 0), 0) + 1;
  const [quantityCases, setQuantityCases] = React.useState("1");
  const [price, setPrice] = React.useState("12.00");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) { setQuantityCases("1"); setPrice("12.00"); }
  }, [open]);

  const cases = Number(quantityCases) || 0;
  const cans = cases * DATA.TO_CANS.Case;
  const pricePerCan = Number(price) || 0;
  const revenue = cans * pricePerCan;
  const valid = cases > 0 && pricePerCan > 0;

  const save = async () => {
    setSaving(true);
    try {
      await DB.sales.insert({ quantityCases: cases, cans, pricePerCan });
      await refresh();
      showToast(`Sale #${nextNo} added`);
      onClose();
    } catch (e) {
      showToast("Couldn't save sale");
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title={`Add Sale #${nextNo}`} icon="dollar">
      <div className="grid g-2 mb16" style={{ gap: 12 }}>
        <div className="field">
          <label className="label">Quantity (cases)</label>
          <input className="bignum" style={{ height: 54, fontSize: 24 }} type="number" inputMode="decimal" min="0" step="0.01"
            placeholder="1" value={quantityCases} onChange={e => setQuantityCases(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label className="label">Price/Can</label>
          <div className="bignum-wrap">
            <span className="bignum-cur" style={{ fontSize: 18 }}>$</span>
            <input className="bignum prefixed" style={{ height: 54, fontSize: 24 }} type="number" inputMode="decimal" min="0" step="0.01"
              placeholder="12.00" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="review-card mb16">
        <ReviewRow k="Cans" v={fmt(cans)} />
        <ReviewRow k="Revenue" v={money(revenue, 2)} total />
      </div>

      <button className="btn btn-primary" style={{ width: "100%", height: 48 }} onClick={save} disabled={!valid || saving}>
        <Icon name="check" size={15} />{saving ? "Saving..." : `Save Sale #${nextNo}`}
      </button>
    </Sheet>
  );
}

function Sale({ sales, loading, showToast, refresh }) {
  const [addOpen, setAddOpen] = React.useState(false);
  const rows = (sales || []).slice().sort((a, b) => (Number(a.saleNo) || 0) - (Number(b.saleNo) || 0));
  const totals = rows.reduce((acc, s) => {
    const cans = Number(s.cans) || 0;
    const revenue = Number(s.revenue) || (cans * (Number(s.pricePerCan) || 0));
    acc.revenue += revenue;
    acc.cans += cans;
    return acc;
  }, { revenue: 0, cans: 0 });
  const totalCases = totals.cans / DATA.TO_CANS.Case;
  const avgPerCan = totals.cans > 0 ? totals.revenue / totals.cans : 0;

  const remove = async (sale) => {
    try {
      await DB.sales.delete(sale.id);
      await refresh();
      showToast(`Sale #${sale.saleNo} removed`);
    } catch (e) {
      showToast("Couldn't remove sale");
    }
  };

  return (
    <div className="page fade-in">
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Updated Running Sales Report</div>
          <div className="page-desc">{rows.length} sale{rows.length !== 1 ? "s" : ""} recorded - enter each sale as it happens</div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            <Icon name="plus" size={14} />Add Sale
          </button>
        </div>
      </div>

      {loading ? (
        <div className="metric-grid">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 14 }} />)}</div>
      ) : (
        <>
          <div className="metric-grid stagger mb16">
            <MetricCard icon="dollar" iconBg="var(--pos-bg)" iconColor="var(--pos)"
              value={totals.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cur label="Revenue" />
            <MetricCard icon="pkg" iconBg="var(--accent-soft)" iconColor="var(--accent)" value={fmtQty(totalCases)} label="Cases" />
            <MetricCard icon="box" iconBg="var(--info-bg)" iconColor="var(--info)" value={fmt(totals.cans)} label="Cans" />
            <MetricCard icon="tag" iconBg="var(--accent-soft)" iconColor="var(--accent)" value={avgPerCan.toFixed(2)} cur label="Price/Can" />
          </div>

          <div className="card card-pad mb16">
            <div className="between">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Sale summary</div>
                <div className="faint" style={{ fontSize: 12, marginTop: 2 }}>
                  Quantity: {fmtQty(totalCases)} cases / {fmt(totals.cans)} cans - average {money(avgPerCan, 2)} per can
                </div>
              </div>
              <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--pos)" }}>{money(totals.revenue, 2)}</span>
            </div>
          </div>

          {rows.length > 0 ? (
            <div className="col gap12">
              {rows.map(s => <SaleReportRow key={s.id} sale={s} onDelete={remove} />)}
            </div>
          ) : (
            <div className="empty">
              <Icon name="reports" size={30} />
              <div className="empty-title">No sales recorded yet</div>
              <div className="empty-desc">Tap Add Sale to enter the first sale</div>
            </div>
          )}
        </>
      )}

      <AddSaleSheet open={addOpen} onClose={() => setAddOpen(false)} sales={rows} showToast={showToast} refresh={refresh} />

      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

Object.assign(window, { Sale, SaleReportRow, AddSaleSheet });
