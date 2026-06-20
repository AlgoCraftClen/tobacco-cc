/* ============================================================
   SHIPMENTS — list of sent shipments + 4-step send workflow
   Clanny (Sender) creates shipments → Clenny (Receiver) confirms
   ============================================================ */

function Cell({ k, v, accent }) {
  return (
    <div className={"calc-cell" + (accent ? " accent" : "")}>
      <div className="ck">{k}</div>
      <div className="cv">{v}</div>
    </div>
  );
}
function EditableUnitCell({ label, marker, value, onChange, accent }) {
  return (
    <label className={"calc-cell editable" + (accent ? " accent" : "")}>
      <div className="ck">{marker && <span className={"uq " + marker} />}{label}</div>
      <input className="calc-input" type="number" inputMode="decimal" min="0" step="any" placeholder="0" value={value} onChange={e => onChange(e.target.value)} />
    </label>
  );
}
function SplitInput({ split, setSplit, splitSummary }) {
  const partners = ["Clanny", "Clenny"];
  return (
    <div className="split-box mt18">
      <div className="between mb12">
        <div>
          <div className="split-title">Product funding</div>
          <div className="split-sub">Enter what one person paid for. The remaining product is assigned to the other person.</div>
        </div>
      </div>
      <div className="split-grid">
        <div className="field">
          <label className="label">Who paid for product?</label>
          <select className="input" value={split.partner} onChange={e => setSplit({ ...split, partner: e.target.value })}>
            {partners.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Unit</label>
          <select className="input" value={split.unit} onChange={e => setSplit({ ...split, unit: e.target.value })}>
            <option value="rolls">Rolls</option>
            <option value="cans">Cans</option>
            <option value="cases">Cases</option>
            <option value="boxes">Boxes</option>
          </select>
        </div>
        <div className="field split-amount">
          <label className="label">Amount paid for</label>
          <input className="input" type="number" inputMode="decimal" min="0" step="any" placeholder="0" value={split.amount} onChange={e => setSplit({ ...split, amount: e.target.value })} />
        </div>
      </div>
      {splitSummary.totalCans > 0 && split.amount !== "" && (
        <div className={"split-summary" + (splitSummary.over ? " danger" : "")}>
          <div className="split-person">
            <span>{split.partner}</span>
            <strong>paid for {fmt(splitSummary.primaryRolls)} rolls · {fmt(splitSummary.primaryCans)} cans</strong>
            {splitSummary.canPrice > 0 && <em>{money(splitSummary.primaryValue)}</em>}
          </div>
          <div className="split-person">
            <span>{splitSummary.otherPartner}</span>
            <strong>paid for {fmt(splitSummary.remainingRolls)} rolls · {fmt(splitSummary.remainingCans)} cans</strong>
            {splitSummary.canPrice > 0 && <em>{money(splitSummary.remainingValue)}</em>}
          </div>
          {splitSummary.over && <div className="split-warning">This is more than the product coming in.</div>}
        </div>
      )}
    </div>
  );
}
function ReviewRow({ k, v, total }) {
  return (
    <div className={"review-row" + (total ? " total" : "")}>
      <span className="rk">{k}</span><span className="rv">{v}</span>
    </div>
  );
}

/* ---- Optional operating-expense line editor (attributed to a partner) ---- */
function ExpenseLines({ lines, setLines, categories, defaultPartner = "Clanny", showPartner = true }) {
  const add = () => setLines([...lines, { partner: defaultPartner, category: categories[0], amount: "" }]);
  const upd = (i, k, v) => setLines(lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const rm = (i) => setLines(lines.filter((_, idx) => idx !== i));
  return (
    <div className="col gap10">
      {lines.map((l, i) => (
        <div key={i} className="expense-line">
          {showPartner && (
            <select className="input" value={l.partner || defaultPartner} onChange={e => upd(i, "partner", e.target.value)}>
              <option value="Clanny">Clanny</option>
              <option value="Clenny">Clenny</option>
            </select>
          )}
          <select className="input" value={l.category} onChange={e => upd(i, "category", e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="bignum-wrap expense-amount">
            <span className="bignum-cur" style={{ fontSize: 15 }}>$</span>
            <input className="bignum prefixed" style={{ height: 42, fontSize: 16, textAlign: "right", paddingRight: 10 }}
              type="number" inputMode="decimal" min="0" step="0.01" placeholder="0" value={l.amount} onChange={e => upd(i, "amount", e.target.value)} />
          </div>
          <button className="icon-btn" onClick={() => rm(i)}><Icon name="x" size={15} className="faint" /></button>
        </div>
      ))}
      <button className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={add}>
        <Icon name="plus" size={13} />Add cost
      </button>
    </div>
  );
}

async function insertExpenseLines(lines, defaultPartner, shipmentId, kind = DATA.EXPENSE_KINDS.SHIPMENT) {
  for (const l of (lines || [])) {
    const amt = Number(l.amount) || 0;
    if (amt > 0) await DB.expenses.insert({
      partner: l.partner || defaultPartner || "Clanny",
      amount: amt,
      category: l.category,
      description: DATA.makeExpenseDescription(kind, { category: l.category }),
      shipmentId,
    });
  }
}

async function insertProductFunding(shipmentId, split, splitSummary) {
  const rows = [
    {
      partner: split.partner,
      amount: splitSummary.primaryValue,
      cans: splitSummary.primaryCans,
      rolls: splitSummary.primaryRolls,
      unit: split.unit,
      enteredAmount: Number(split.amount) || 0,
    },
    {
      partner: splitSummary.otherPartner,
      amount: splitSummary.remainingValue,
      cans: splitSummary.remainingCans,
      rolls: splitSummary.remainingRolls,
      unit: "cans",
      enteredAmount: splitSummary.remainingCans,
    },
  ];
  for (const row of rows) {
    if ((Number(row.amount) || 0) <= 0 && (Number(row.cans) || 0) <= 0) continue;
    await DB.expenses.insert({
      partner: row.partner,
      amount: row.amount,
      category: DATA.PRODUCT_FUNDING_CATEGORY,
      description: DATA.makeExpenseDescription(DATA.EXPENSE_KINDS.PRODUCT, {
        category: DATA.PRODUCT_FUNDING_CATEGORY,
        cans: row.cans,
        rolls: row.rolls,
        unit: row.unit,
        enteredAmount: row.enteredAmount,
        pricePerCan: splitSummary.canPrice,
      }),
      shipmentId,
    });
  }
}

/* ---- Expandable shipment card (reused by list + history) ---- */
function ShipmentCard({ s, expenses = [], defaultOpen, onSell, onReceive, onReport, busy, role }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const finance = DATA.shipmentFinance(s, expenses);
  const sold = (s.saleTotal || 0) > 0;
  const profit = finance.grossProfit;
  const net = finance.netProfit;
  const canSell = s.status === "received" && !!onSell && role?.name === "Clenny";
  const canReceive = s.status === "pending" && !!onReceive && role?.name === "Clenny";
  const fundingPartners = ["Clanny", "Clenny"];
  return (
    <div className="list-card">
      <button className="lc-head" onClick={() => setOpen(o => !o)}>
        <div className="lc-ico"><Icon name="send" size={19} /></div>
        <div className="lc-main">
          <div className="lc-title">{s.brand} <ShipStatus status={s.status} /></div>
          <div className="lc-sub">{boxWord(s.boxes)} · {fmt(s.cans)} cans · {fmtDate(s.createdAt)}</div>
        </div>
        <div className="lc-amt">{money(finance.productTotal)}<span className="sub">product</span></div>
        <Icon name="chevR" size={16} className={"lc-chev" + (open ? " open" : "")} />
      </button>
      {open && (
        <div className="lc-body">
          <div className="calc-grid" style={{ marginTop: 12 }}>
            <Cell k="Boxes" v={fmt(s.boxes)} />
            <Cell k="Cases" v={fmt(s.cases)} />
            <Cell k="Rolls" v={fmt(s.rolls)} />
            <Cell k="Cans" v={fmt(s.cans)} />
          </div>
          <div className="review-card mt16">
            <ReviewRow k="Price / can" v={money(s.pricePerCan, 2)} />
            <ReviewRow k="Product total" v={money(finance.productTotal)} />
            {fundingPartners.map(p => (
              <ReviewRow key={p} k={`${p} funded`} v={`${fmt(finance.funding[p].rolls)} rolls · ${money(finance.funding[p].amount)}`} />
            ))}
            {finance.shipmentCosts > 0 && <ReviewRow k="Extra shipment costs" v={money(finance.shipmentCosts)} />}
            {finance.distributionCosts > 0 && <ReviewRow k="Distribution costs" v={money(finance.distributionCosts)} />}
            <ReviewRow k="All-in total" v={money(finance.allInTotal)} total />
          </div>
          {finance.costRows.length > 0 && (
            <div className="review-card mt12">
              {finance.costRows.map(row => (
                <ReviewRow key={row.id} k={`${row.partner} paid ${DATA.displayExpenseCategory(row)}`} v={money(row.amount)} />
              ))}
            </div>
          )}
          {sold && (
            <div className="review-card mt12">
              <ReviewRow k="Sold for" v={money(s.saleTotal)} />
              <ReviewRow k="Avg sale price / can" v={money(s.salePricePerCan, 2)} />
              {fundingPartners.map(p => (
                <ReviewRow key={p} k={`${p} sale share`} v={`${money(finance.revenueShare[p])} · ${money(finance.productProfit[p])} gain`} />
              ))}
              <div className="review-row total">
                <span className="rk">{net >= 0 ? "Net gain after costs" : "Net loss after costs"}</span>
                <span className="rv" style={{ color: net >= 0 ? "var(--pos)" : "var(--danger)" }}>{money(net)}</span>
              </div>
            </div>
          )}
          <div className="kv mt12"><span className="k">Route</span><span className="v">{s.sender} → {s.receiver}</span></div>
          {s.notes && <div className="kv"><span className="k">Issue note</span><span className="v" style={{ color: "var(--danger)" }}>{s.notes}</span></div>}
          {s.receivedAt && <div className="kv"><span className="k">{s.status === "disputed" ? "Flagged" : "Received"}</span><span className="v">{fmtDate(s.receivedAt)}</span></div>}
          {s.soldAt && <div className="kv"><span className="k">Sold</span><span className="v">{fmtDate(s.soldAt)}</span></div>}
        </div>
      )}
      {(canReceive || canSell || sold) && (
        <div className="lc-actions">
          {canReceive ? (
            <>
              <button className="btn btn-danger" onClick={() => onReport(s)} disabled={busy}>
                <Icon name="alert" size={15} />Report Issue
              </button>
              <button className="btn btn-primary" onClick={() => onReceive(s)} disabled={busy}>
                <Icon name="check" size={15} />Confirm Received
              </button>
            </>
          ) : sold ? (
            <>
              <div className="between" style={{ flex: 1, fontSize: 13 }}>
                <span className="muted">Sold for {money(s.saleTotal)}</span>
                <span className="mono" style={{ fontWeight: 600, color: net >= 0 ? "var(--pos)" : "var(--danger)" }}>
                  {net >= 0 ? "+" : ""}{money(net)} {net >= 0 ? "net gain" : "net loss"}
                </span>
              </div>
              <button className="btn btn-primary" onClick={() => onSell(s)}>
                <Icon name="plus" size={15} />Add sale
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => onSell(s)}>
              <Icon name="dollar" size={15} />Record sale
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Record a resale against a received shipment ---- */
function RecordSaleSheet({ shipment, expenses = [], onClose, showToast, refresh }) {
  const open = !!shipment;
  const [saleLines, setSaleLines] = React.useState([{ cans: "", price: "" }]);
  const [expLines, setExpLines] = React.useState([]);
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => { if (open) { setSaleLines([{ cans: "", price: "" }]); setExpLines([]); } }, [open, shipment]);

  const finance = shipment ? DATA.shipmentFinance(shipment, expenses) : null;
  const totalCans = shipment ? Number(shipment.cans) || 0 : 0;
  const existingSaleTotal = shipment ? Number(shipment.saleTotal) || 0 : 0;
  const existingAvgPrice = shipment ? Number(shipment.salePricePerCan) || 0 : 0;
  const existingSoldCans = existingSaleTotal > 0 && existingAvgPrice > 0 ? existingSaleTotal / existingAvgPrice : 0;
  const remainingCans = Math.max(0, totalCans - existingSoldCans);

  const updateSaleLine = (i, key, value) => setSaleLines(saleLines.map((line, idx) => idx === i ? { ...line, [key]: value } : line));
  const addSaleLine = () => setSaleLines([...saleLines, { cans: "", price: "" }]);
  const removeSaleLine = (i) => setSaleLines(saleLines.length === 1 ? [{ cans: "", price: "" }] : saleLines.filter((_, idx) => idx !== i));

  const newSoldCans = saleLines.reduce((sum, line) => sum + (Number(line.cans) || 0), 0);
  const newSaleTotal = saleLines.reduce((sum, line) => sum + ((Number(line.cans) || 0) * (Number(line.price) || 0)), 0);
  const newDistributionCosts = expLines.reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
  const aggregateSoldCans = existingSoldCans + newSoldCans;
  const aggregateSaleTotal = existingSaleTotal + newSaleTotal;
  const aggregateAvgPrice = aggregateSoldCans > 0 ? aggregateSaleTotal / aggregateSoldCans : 0;
  const productGain = aggregateSaleTotal - (finance ? finance.productTotal : 0);
  const netGain = aggregateSaleTotal - (finance ? finance.productTotal + finance.extraCosts : 0) - newDistributionCosts;
  const soldOver = newSoldCans > remainingCans;
  const valid = newSoldCans > 0 && newSaleTotal > 0 && !soldOver;

  const save = async () => {
    setSaving(true);
    try {
      await DB.shipments.recordSale(shipment.id, { salePricePerCan: aggregateAvgPrice, saleTotal: aggregateSaleTotal });
      await insertExpenseLines(expLines, "Clenny", shipment.id, DATA.EXPENSE_KINDS.DISTRIBUTION);
      await refresh();
      showToast("Sale recorded");
      onClose();
    } catch (e) { showToast("Couldn't save — check connection"); }
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title={existingSaleTotal > 0 ? "Add sale" : "Record sale"} icon="dollar">
      {shipment && finance && (
        <>
          <div className="review-card mb16">
            <ReviewRow k="Shipment" v={`${shipment.brand} · ${boxWord(shipment.boxes)}`} />
            <ReviewRow k="Total cans" v={fmt(totalCans)} />
            {existingSoldCans > 0 && <ReviewRow k="Already sold" v={`${fmt(existingSoldCans)} cans · ${money(existingSaleTotal)}`} />}
            <ReviewRow k="Available" v={fmt(remainingCans)} />
            <ReviewRow k="Product funded" v={money(finance.productTotal)} />
          </div>

          <div className="field mb16">
            <label className="label">Sale batches</label>
            <div className="sale-lines">
              {saleLines.map((line, i) => (
                <div key={i} className="sale-line">
                  <input className="input" type="number" inputMode="decimal" min="0" step="any" placeholder="Cans sold"
                    value={line.cans} onChange={e => updateSaleLine(i, "cans", e.target.value)} autoFocus={i === 0} />
                  <div className="bignum-wrap sale-price">
                    <span className="bignum-cur" style={{ fontSize: 15 }}>$</span>
                    <input className="bignum prefixed" style={{ height: 42, fontSize: 16, textAlign: "right", paddingRight: 10 }}
                      type="number" inputMode="decimal" min="0" step="0.01" placeholder="Price / can"
                      value={line.price} onChange={e => updateSaleLine(i, "price", e.target.value)} />
                  </div>
                  <button className="icon-btn" onClick={() => removeSaleLine(i)}><Icon name="x" size={15} className="faint" /></button>
                </div>
              ))}
            </div>
            <button className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={addSaleLine}>
              <Icon name="plus" size={13} />Add sale line
            </button>
          </div>

          {(newSoldCans > 0 || existingSaleTotal > 0) && (
            <div className="review-card mb16">
              {newSoldCans > 0 && <ReviewRow k={`${fmt(newSoldCans)} cans in this sale`} v={money(newSaleTotal)} />}
              <ReviewRow k="Total sold" v={`${fmt(aggregateSoldCans)} cans · ${money(aggregateSaleTotal)}`} />
              <ReviewRow k="Avg sale price" v={money(aggregateAvgPrice, 2)} />
              <ReviewRow k="Product gain" v={money(productGain)} />
              <div className="review-row total">
                <span className="rk">{netGain >= 0 ? "Net gain after costs" : "Net loss after costs"}</span>
                <span className="rv" style={{ color: netGain >= 0 ? "var(--pos)" : "var(--danger)" }}>{money(netGain)}</span>
              </div>
              {soldOver && <div className="split-warning" style={{ padding: "0 16px 13px" }}>This sale is more than the available cans.</div>}
            </div>
          )}

          <div className="field mb16">
            <label className="label">Distribution costs (optional · paid by Clenny unless changed)</label>
            <ExpenseLines lines={expLines} setLines={setExpLines} defaultPartner="Clenny" categories={["Gas", "Delivery", "Transportation", "Storage", "Other"]} />
          </div>

          <div className="sheet-actions">
            <button className="btn btn-primary" style={{ width: "100%", height: 48 }} onClick={save} disabled={!valid || saving}>
              <Icon name="check" size={15} />{saving ? "Saving…" : (existingSaleTotal > 0 ? "Add Sale" : "Record Sale")}
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
/* ---- Shipments list (tab) ---- */
function Shipments({ shipments, expenses = [], loading, go, role, showToast, refresh }) {
  const [filter, setFilter] = React.useState("all");
  const [sellFor, setSellFor] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [issueFor, setIssueFor] = React.useState(null);
  const [note, setNote] = React.useState("");

  const receive = async (s) => {
    setBusy(true);
    try { await DB.shipments.receive(s.id); await refresh(); showToast(`${s.brand} shipment received`); }
    catch (e) { showToast("Couldn't update — check connection"); }
    setBusy(false);
  };
  const openIssue = (s) => { setIssueFor(s); setNote(""); };
  const submitIssue = async () => {
    if (!issueFor) return;
    setBusy(true);
    try { await DB.shipments.dispute(issueFor.id, note.trim()); await refresh(); showToast("Issue reported to Clanny"); setIssueFor(null); }
    catch (e) { showToast("Couldn't report — check connection"); }
    setBusy(false);
  };

  const filtered = filter === "all" ? shipments : shipments.filter(s => s.status === filter);
  const counts = {
    all: shipments.length,
    pending: shipments.filter(s => s.status === "pending").length,
    received: shipments.filter(s => s.status === "received").length,
    disputed: shipments.filter(s => s.status === "disputed").length,
  };

  return (
    <div className="page fade-in">
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <div className="page-title">Shipments</div>
          <div className="page-desc">{counts.all} total · {counts.pending} pending</div>
        </div>
        <div className="page-head-actions">
          <button className="btn btn-primary" onClick={() => go("newshipment")}>
            <Icon name="plus" size={14} />New Shipment
          </button>
        </div>
      </div>

      <div className="seg mb16" style={{ width: "100%", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
        {[["all", "All"], ["pending", "Pending"], ["received", "Received"], ["disputed", "Disputed"]].map(([k, l]) => (
          <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
            {l} <span className="faint">{counts[k]}</span>
          </button>
        ))}
      </div>

      {loading ? <SkeletonList count={5} /> :
        filtered.length > 0 ? filtered.map(s => <ShipmentCard key={s.id} s={s} expenses={expenses} onSell={setSellFor} onReceive={receive} onReport={openIssue} busy={busy} role={role} />) : (
          <div className="empty">
            <Icon name="send" size={30} />
            <div className="empty-title">No shipments {filter !== "all" ? `(${filter})` : "yet"}</div>
            <div className="empty-desc">{role && role.name === "Clanny" ? "Tap New Shipment to send one" : "Shipments from Clanny will appear here"}</div>
          </div>
        )}

      <Sheet open={!!issueFor} onClose={() => setIssueFor(null)} title="Report an issue" icon="alert">
        {issueFor && (
          <>
            <div className="review-card mb16">
              <ReviewRow k="Shipment" v={`${issueFor.brand} · ${boxWord(issueFor.boxes)}`} />
              <ReviewRow k="Product total" v={money(DATA.shipmentFinance(issueFor, expenses).productTotal)} />
            </div>
            <div className="field mb16">
              <label className="label">What's wrong? (e.g. 2 cans damaged)</label>
              <textarea className="input" rows={4} placeholder="Describe the issue…" value={note} onChange={e => setNote(e.target.value)} autoFocus />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", height: 48 }} onClick={submitIssue} disabled={busy || !note.trim()}>
              <Icon name="alert" size={15} />{busy ? "Reporting…" : "Submit Issue"}
            </button>
          </>
        )}
      </Sheet>

      <RecordSaleSheet shipment={sellFor} expenses={expenses} onClose={() => setSellFor(null)} showToast={showToast} refresh={refresh} />

      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

/* ---- 4-step send workflow ---- */
function NewShipment({ go, showToast, refresh, role }) {
  const [step, setStep] = React.useState(1);
  const [brand, setBrand] = React.useState("");
  const [qty, setQty] = React.useState({ boxes: "", cases: "", rolls: "", cans: "" });
  const [split, setSplit] = React.useState({ partner: role && role.name ? role.name : "Clanny", unit: "rolls", amount: "" });
  const [canPrice, setCanPrice] = React.useState("");
  const [expLines, setExpLines] = React.useState([]);
  const [saving, setSaving] = React.useState(false);

  const num = (v) => Number(v) || 0;
  const formatQty = (n) => n ? String(Number(n.toFixed(4))) : "";
  const setUnit = (unit, value) => {
    const n = num(value);
    const next = { boxes: "", cases: "", rolls: "", cans: "" };
    if (value !== "") {
      if (unit === "boxes") {
        next.boxes = value; next.cases = formatQty(n * DATA.BOX_TO.Case); next.rolls = formatQty(n * DATA.BOX_TO.Roll); next.cans = formatQty(n * DATA.BOX_TO.Can);
      } else if (unit === "cases") {
        next.boxes = formatQty(n / DATA.BOX_TO.Case); next.cases = value; next.rolls = formatQty(n * DATA.CASE_TO.Roll); next.cans = formatQty(n * DATA.CASE_TO.Can);
      } else if (unit === "rolls") {
        next.boxes = formatQty(n / DATA.BOX_TO.Roll); next.cases = formatQty(n / DATA.CASE_TO.Roll); next.rolls = value; next.cans = formatQty(n * DATA.ROLL_TO.Can);
      } else if (unit === "cans") {
        next.boxes = formatQty(n / DATA.BOX_TO.Can); next.cases = formatQty(n / DATA.CASE_TO.Can); next.rolls = formatQty(n / DATA.ROLL_TO.Can); next.cans = value;
      }
    }
    setQty(next);
  };
  const u = { boxes: num(qty.boxes), cases: num(qty.cases), rolls: num(qty.rolls), cans: num(qty.cans) };
  const splitToCans = (unit, amount) => {
    const n = num(amount);
    if (unit === "boxes") return n * DATA.TO_CANS.Box;
    if (unit === "cases") return n * DATA.TO_CANS.Case;
    if (unit === "rolls") return n * DATA.TO_CANS.Roll;
    return n;
  };
  const splitCans = split.amount === "" ? 0 : splitToCans(split.unit, split.amount);
  const splitOver = splitCans > u.cans;
  const remainingCans = Math.max(0, u.cans - splitCans);
  const otherPartner = split.partner === "Clanny" ? "Clenny" : "Clanny";
  const splitSummary = {
    totalCans: u.cans,
    canPrice: Number(canPrice) || 0,
    primaryCans: splitCans,
    primaryRolls: splitCans / DATA.TO_CANS.Roll,
    primaryValue: splitCans * (Number(canPrice) || 0),
    remainingCans,
    remainingRolls: remainingCans / DATA.TO_CANS.Roll,
    remainingValue: remainingCans * (Number(canPrice) || 0),
    otherPartner,
    over: splitOver,
  };
  const lad = DATA.priceLadder(canPrice);
  const subtotal = u.cans * (Number(canPrice) || 0);
  const shipmentCosts = expLines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const paidBy = expLines.reduce((acc, l) => {
    const partner = l.partner || "Clanny";
    acc[partner] = (acc[partner] || 0) + (Number(l.amount) || 0);
    return acc;
  }, { Clanny: 0, Clenny: 0 });
  const allInTotal = subtotal + shipmentCosts;
  const grandTotal = subtotal;

  const canNext =
    step === 1 ? (brand && u.cans > 0) :
    step === 2 ? (split.amount !== "" && !splitOver) :
    step === 3 ? (Number(canPrice) > 0) : true;

  const submit = async () => {
    setSaving(true);
    try {
      const created = await DB.shipments.insert({
        brand, boxes: u.boxes, cases: u.cases, rolls: u.rolls, cans: u.cans,
        pricePerCan: Number(canPrice) || 0, subtotal,
        miscCost: 0, miscDesc: "",
        grandTotal, sender: "Clanny", receiver: "Clenny", status: "pending",
      });
      await insertProductFunding(created && created.id, split, splitSummary);
      await insertExpenseLines(expLines, "Clanny", created && created.id, DATA.EXPENSE_KINDS.SHIPMENT);
      await refresh();
      showToast("Shipment sent to Clenny");
      go("shipments");
    } catch (e) {
      showToast("Couldn't send — check connection");
      setSaving(false);
    }
  };

  return (
    <div className="page fade-in" style={{ maxWidth: 560 }}>
      <div className="center gap10 mb16">
        <button className="icon-btn" onClick={() => step > 1 ? setStep(step - 1) : go("shipments")}>
          <Icon name="chevL" size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <Progress value={(step / 5) * 100} />
        </div>
        <span className="faint mono" style={{ fontSize: 12 }}>{step}/5</span>
      </div>

      {step === 1 && (
        <div className="step-card" key="s1">
          <div className="steplabel">Step 1 · Brand & Quantity</div>
          <div className="step-q">What product is coming?</div>
          <div className="step-hint">Pick a brand, then enter the total shipment quantity in any unit.</div>

          <div className="choice-row mb20">
            {DATA.BRANDS.map(b => (
              <button key={b} className={"choice" + (brand === b ? " on" : "")} onClick={() => setBrand(b)}>
                <div className="choice-ico"><Icon name="box" size={20} /></div>
                <div className="choice-name">{b}</div>
              </button>
            ))}
          </div>

          <div className="calc-grid editable-units">
            <EditableUnitCell label="Boxes" marker="uq-box" value={qty.boxes} onChange={v => setUnit("boxes", v)} />
            <EditableUnitCell label="Cases" marker="uq-case" value={qty.cases} onChange={v => setUnit("cases", v)} />
            <EditableUnitCell label="Rolls" marker="uq-roll" value={qty.rolls} onChange={v => setUnit("rolls", v)} />
            <EditableUnitCell label="Cans" marker="uq-can" value={qty.cans} onChange={v => setUnit("cans", v)} accent />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step-card" key="s2">
          <div className="steplabel">Step 2 · Product Funding</div>
          <div className="step-q">Who paid for the product?</div>
          <div className="step-hint">Enter the amount one person paid for. The remaining product is assigned to the other person.</div>
          <SplitInput split={split} setSplit={setSplit} splitSummary={splitSummary} />
        </div>
      )}

      {step === 3 && (
        <div className="step-card" key="s3">
          <div className="steplabel">Step 3 · Product Price</div>
          <div className="step-q">What was the product price?</div>
          <div className="step-hint">This calculates the product purchase total and each person's product funding amount.</div>

          <div className="field">
            <label className="label">Price per can</label>
            <div className="bignum-wrap">
              <span className="bignum-cur">$</span>
              <input className="bignum prefixed" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
                value={canPrice} onChange={e => setCanPrice(e.target.value)} />
            </div>
          </div>

          {Number(canPrice) > 0 && (
            <>
              <div className="calc-grid">
                <Cell k="Per roll (×5)" v={money(lad.perRoll, 2)} />
                <Cell k="Per case (×90)" v={money(lad.perCase)} />
                <Cell k="Per box (×540)" v={money(lad.perBox)} />
                <Cell k={`${fmt(u.cans)} cans`} v={money(subtotal)} accent />
              </div>
              <div className="review-row total" style={{ borderRadius: 12, marginTop: 12, border: "1px solid var(--accent-line)" }}>
                <span className="rk">Product total</span><span className="rv">{money(subtotal)}</span>
              </div>
              <SplitInput split={split} setSplit={setSplit} splitSummary={splitSummary} />
            </>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="step-card" key="s4">
          <div className="steplabel">Step 4 · Extra Shipment Costs</div>
          <div className="step-q">Who paid extra costs?</div>
          <div className="step-hint">Keep shipping, handling, gas, and freight separate from the product purchase.</div>

          <div className="field">
            <label className="label">Extra shipment costs</label>
            <ExpenseLines lines={expLines} setLines={setExpLines} defaultPartner={role && role.name ? role.name : "Clanny"}
              categories={["Shipping", "Handling", "Freight", "Gas", "Port fees", "Loading", "Other"]} />
          </div>

          <div className="review-card mt20">
            <ReviewRow k="Product total" v={money(subtotal)} />
            <ReviewRow k="Clanny extra costs" v={money(paidBy.Clanny || 0)} />
            <ReviewRow k="Clenny extra costs" v={money(paidBy.Clenny || 0)} />
            <ReviewRow k="Extra costs" v={money(shipmentCosts)} />
            <ReviewRow k="All-in total" v={money(allInTotal)} total />
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="step-card" key="s5">
          <div className="steplabel">Step 5 · Review</div>
          <div className="step-q">Ready to send?</div>
          <div className="step-hint">Confirm the product funding and extra costs before saving the shipment.</div>

          <div className="review-card">
            <ReviewRow k="Brand" v={brand} />
            <ReviewRow k="Boxes" v={fmt(u.boxes)} />
            <ReviewRow k="Cases" v={fmt(u.cases)} />
            <ReviewRow k="Rolls" v={fmt(u.rolls)} />
            <ReviewRow k="Cans" v={fmt(u.cans)} />
            <ReviewRow k={`${split.partner} paid for`} v={`${fmt(splitSummary.primaryRolls)} rolls · ${money(splitSummary.primaryValue)}`} />
            <ReviewRow k={`${splitSummary.otherPartner} paid for`} v={`${fmt(splitSummary.remainingRolls)} rolls · ${money(splitSummary.remainingValue)}`} />
            <ReviewRow k="Price / can" v={money(Number(canPrice) || 0, 2)} />
            <ReviewRow k="Product total" v={money(subtotal)} />
            <ReviewRow k="Clanny extra costs" v={money(paidBy.Clanny || 0)} />
            <ReviewRow k="Clenny extra costs" v={money(paidBy.Clenny || 0)} />
            <ReviewRow k="Extra costs" v={money(shipmentCosts)} />
            <ReviewRow k="All-in total" v={money(allInTotal)} total />
          </div>
        </div>
      )}
      <div className="sticky-actions">
        {step > 1 && <button className="btn" onClick={() => setStep(step - 1)} disabled={saving}>Back</button>}
        {step < 5 && <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canNext}>
          Continue <Icon name="arrowR" size={15} />
        </button>}
        {step === 5 && <button className="btn btn-primary" onClick={submit} disabled={saving}>
          <Icon name="send" size={15} />{saving ? "Sending…" : "Send Shipment"}
        </button>}
      </div>
    </div>
  );
}

Object.assign(window, { Shipments, NewShipment, ShipmentCard, Cell, EditableUnitCell, SplitInput, ReviewRow });
