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
/* Editable version of Cell — used for the linked Boxes/Cases/Rolls/Cans inputs */
function UnitCell({ k, unit, value, onChange, accent }) {
  return (
    <div className={"calc-cell" + (accent ? " accent" : "")}>
      <div className="ck">{k}</div>
      <input
        className="cv" type="number" inputMode="decimal" min="0" step="any" placeholder="0"
        value={value} onChange={e => onChange(unit, e.target.value)}
        style={{ width: "100%", background: "transparent", border: "none", outline: "none", padding: 0,
                 color: accent ? "var(--accent)" : "var(--text)" }}
      />
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
function ExpenseLines({ lines, setLines, categories }) {
  const add = () => setLines([...lines, { category: categories[0], amount: "" }]);
  const upd = (i, k, v) => setLines(lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const rm = (i) => setLines(lines.filter((_, idx) => idx !== i));
  return (
    <div className="col gap10">
      {lines.map((l, i) => (
        <div key={i} className="center gap8">
          <select className="input" style={{ height: 42, flex: 1 }} value={l.category} onChange={e => upd(i, "category", e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="bignum-wrap" style={{ width: 118 }}>
            <span className="bignum-cur" style={{ fontSize: 15 }}>$</span>
            <input className="bignum prefixed" style={{ height: 42, fontSize: 16, textAlign: "right", paddingRight: 10 }}
              type="number" inputMode="decimal" min="0" step="0.01" placeholder="0" value={l.amount} onChange={e => upd(i, "amount", e.target.value)} />
          </div>
          <button className="icon-btn" onClick={() => rm(i)}><Icon name="x" size={15} className="faint" /></button>
        </div>
      ))}
      <button className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start" }} onClick={add}>
        <Icon name="plus" size={13} />Add expense
      </button>
    </div>
  );
}
async function insertExpenseLines(lines, partner, shipmentId) {
  for (const l of (lines || [])) {
    const amt = Number(l.amount) || 0;
    if (amt > 0) await DB.expenses.insert({ partner, amount: amt, category: l.category, description: l.category, shipmentId });
  }
}

/* ---- Expandable shipment card (reused by list + history) ---- */
function ShipmentCard({ s, defaultOpen, onSell, onReceive, onReport, busy, role }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const sold = (s.saleTotal || 0) > 0;
  const profit = (s.saleTotal || 0) - s.grandTotal;
  const canSell = s.status === "received" && !sold && !!onSell && role?.name === "Clenny";
  const canReceive = s.status === "pending" && !!onReceive && role?.name === "Clenny";
  return (
    <div className="list-card">
      <button className="lc-head" onClick={() => setOpen(o => !o)}>
        <div className="lc-ico"><Icon name="send" size={19} /></div>
        <div className="lc-main">
          <div className="lc-title">{s.brand} <ShipStatus status={s.status} /></div>
          <div className="lc-sub">{boxWord(s.boxes)} · {fmt(s.cans)} cans · {fmtDate(s.createdAt)}</div>
        </div>
        <div className="lc-amt">{money(s.grandTotal)}</div>
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
            <ReviewRow k="Subtotal" v={money(s.subtotal)} />
            {s.miscCost > 0 && <ReviewRow k={s.miscDesc || "Misc cost"} v={money(s.miscCost)} />}
            <ReviewRow k="Grand total" v={money(s.grandTotal)} total />
          </div>
          {sold && (
            <div className="review-card mt12">
              <ReviewRow k="Sold for" v={money(s.saleTotal)} />
              <ReviewRow k="Sale price / can" v={money(s.salePricePerCan, 2)} />
              <div className="review-row total">
                <span className="rk">{profit >= 0 ? "Profit" : "Loss"}</span>
                <span className="rv" style={{ color: profit >= 0 ? "var(--pos)" : "var(--danger)" }}>{money(profit)}</span>
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
            <div className="between" style={{ flex: 1, fontSize: 13 }}>
              <span className="muted">Sold for {money(s.saleTotal)}</span>
              <span className="mono" style={{ fontWeight: 600, color: profit >= 0 ? "var(--pos)" : "var(--danger)" }}>
                {profit >= 0 ? "+" : ""}{money(profit)} {profit >= 0 ? "profit" : "loss"}
              </span>
            </div>
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

/* ---- Helper component for editing multiple sale lines ---- */
function SaleLines({ lines, setLines }) {
  const add = () => setLines([...lines, { unit: "Can", quantity: "", price: "" }]);
  const upd = (i, k, v) => setLines(lines.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const rm = (i) => setLines(lines.filter((_, idx) => idx !== i));
  return (
    <div className="col gap12" style={{ marginBottom: 16 }}>
      {lines.map((l, i) => {
        const factor = DATA.TO_CANS[l.unit] || 1;
        const lineCans = (Number(l.quantity) || 0) * factor;
        const lineTotal = (Number(l.quantity) || 0) * (Number(l.price) || 0);
        return (
          <div key={i} className="center gap8" style={{ borderBottom: "1px solid var(--border-soft)", paddingBottom: 12, alignItems: "flex-end" }}>
            <div className="col gap4" style={{ width: 85 }}>
              <label className="label" style={{ fontSize: 11, marginBottom: 2 }}>Unit</label>
              <select className="input" style={{ height: 42, padding: "0 8px", fontSize: 13 }} value={l.unit} onChange={e => upd(i, "unit", e.target.value)}>
                {["Can", "Roll", "Case", "Box"].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            
            <div className="col gap4" style={{ flex: 1, minWidth: 50 }}>
              <label className="label" style={{ fontSize: 11, marginBottom: 2 }}>Qty</label>
              <input className="input" style={{ height: 42, textAlign: "center", fontSize: 14 }} type="number" inputMode="numeric" placeholder="0" value={l.quantity} onChange={e => upd(i, "quantity", e.target.value)} />
            </div>

            <div className="col gap4" style={{ width: 95 }}>
              <label className="label" style={{ fontSize: 11, marginBottom: 2 }}>Price / {l.unit}</label>
              <div className="bignum-wrap" style={{ height: 42 }}>
                <span className="bignum-cur" style={{ fontSize: 13, left: 8 }}>$</span>
                <input className="bignum prefixed" style={{ height: 42, fontSize: 14, textAlign: "right", paddingRight: 8 }}
                  type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" value={l.price} onChange={e => upd(i, "price", e.target.value)} />
              </div>
            </div>

            <div className="col gap4" style={{ width: 75, textAlign: "right", paddingRight: 4 }}>
              <span className="label" style={{ fontSize: 11, marginBottom: 2 }}>Total</span>
              <div style={{ fontSize: 13, fontWeight: "600", height: 42, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div>{money(lineTotal, 2)}</div>
                <div className="faint" style={{ fontSize: 9, fontWeight: "normal", marginTop: -2 }}>{lineCans} cans</div>
              </div>
            </div>

            {lines.length > 1 && (
              <button className="icon-btn" style={{ height: 42, padding: 4 }} onClick={() => rm(i)}>
                <Icon name="x" size={14} className="faint" />
              </button>
            )}
          </div>
        );
      })}
      <button className="btn btn-sm btn-ghost" style={{ alignSelf: "flex-start", marginTop: 4 }} onClick={add}>
        <Icon name="plus" size={13} />Add another sale
      </button>
    </div>
  );
}

/* ---- Record a resale against a received shipment ---- */
function RecordSaleSheet({ shipment, onClose, showToast, refresh }) {
  const open = !!shipment;
  const [salesLines, setSalesLines] = React.useState([{ unit: "Can", quantity: "", price: "" }]);
  const [expLines, setExpLines] = React.useState([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setSalesLines([{ unit: "Can", quantity: "", price: "" }]);
      setExpLines([]);
    }
  }, [open, shipment]);

  const cans = shipment ? shipment.cans : 0;
  
  const totalCansSold = salesLines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const factor = DATA.TO_CANS[line.unit] || 1;
    return sum + (qty * factor);
  }, 0);

  const totalRevenue = salesLines.reduce((sum, line) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.price) || 0;
    return sum + (qty * price);
  }, 0);

  const remainingCans = cans - totalCansSold;
  const opsCost = expLines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  const grandTotal = shipment ? shipment.grandTotal : 0;
  // Net profit = resale revenue − product cost − operations costs entered below.
  const profit = totalRevenue - grandTotal - opsCost;
  const remainingColor = remainingCans < 0 ? "var(--danger)" : "var(--text-2)";

  const valid = salesLines.length > 0 && 
    salesLines.every(l => (Number(l.quantity) || 0) > 0 && (Number(l.price) || 0) > 0) &&
    totalCansSold <= cans;

  const save = async () => {
    setSaving(true);
    try {
      const avgPrice = totalCansSold > 0 ? totalRevenue / totalCansSold : 0;
      await DB.shipments.recordSale(shipment.id, { salePricePerCan: avgPrice, saleTotal: totalRevenue });
      
      // Write each sale line to running sales
      for (const l of salesLines) {
        const qty = Number(l.quantity) || 0;
        const price = Number(l.price) || 0;
        if (qty > 0 && price > 0) {
          const lineCans = qty * DATA.TO_CANS[l.unit];
          const linePricePerCan = price / DATA.TO_CANS[l.unit];
          await DB.sales.insert({
            quantityCases: lineCans / DATA.TO_CANS.Case,
            cans: lineCans,
            pricePerCan: linePricePerCan,
          });
        }
      }
      
      await insertExpenseLines(expLines, "Clenny", shipment.id);
      await refresh();
      showToast("Sales recorded successfully");
      onClose();
    } catch (e) {
      showToast("Couldn't save — check connection");
    }
    setSaving(false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Record sale" icon="dollar">
      {shipment && (
        <>
          <div className="review-card mb16">
            <ReviewRow k="Shipment" v={`${shipment.brand} · ${boxWord(shipment.boxes)}`} />
            <ReviewRow k="Total Shipment Cans" v={fmt(cans)} />
            <ReviewRow k="Cost (grand total)" v={money(shipment.grandTotal)} />
          </div>

          <div className="field mb16">
            <label className="label">Sales Entries</label>
            <SaleLines lines={salesLines} setLines={setSalesLines} />
          </div>

          <div className="review-card mb16">
            <ReviewRow k="Total Cans Sold" v={`${fmt(totalCansSold)} of ${fmt(cans)}`} />
            <ReviewRow 
              k="Cans Remaining" 
              v={<span style={{ color: remainingColor, fontWeight: remainingCans < 0 ? "bold" : "normal" }}>{fmt(remainingCans)}</span>} 
            />
            <ReviewRow k="Total Revenue" v={money(totalRevenue, 2)} />
            <ReviewRow k="Product cost (grand total)" v={`-${money(grandTotal)}`} />
            {opsCost > 0 && <ReviewRow k="Operations cost (billed to Clenny)" v={`-${money(opsCost, 2)}`} />}
            <div className="review-row total">
              <span className="rk">{profit >= 0 ? "Net Profit" : "Net Loss"}</span>
              <span className="rv" style={{ color: profit >= 0 ? "var(--pos)" : "var(--danger)" }}>{money(profit)}</span>
            </div>
          </div>

          {/* ---- Separate operations cost section ---- */}
          <div className="field mb16">
            <label className="label">Cost of operations (optional · billed to Clenny)</label>
            <div className="step-hint" style={{ marginBottom: 10, fontSize: 12 }}>Add expenses for gas, delivery, transportation, etc. These are separate from product costs.</div>
            <ExpenseLines lines={expLines} setLines={setExpLines} categories={["Gas", "Delivery", "Transportation", "Storage", "Other"]} />
          </div>

          <button className="btn btn-primary" style={{ width: "100%", height: 48 }} onClick={save} disabled={!valid || saving}>
            <Icon name="check" size={15} />{saving ? "Saving…" : "Record Sale"}
          </button>
        </>
      )}
    </Sheet>
  );
}

/* ---- Shipments list (tab) ---- */
function Shipments({ shipments, loading, go, role, showToast, refresh }) {
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
        filtered.length > 0 ? filtered.map(s => <ShipmentCard key={s.id} s={s} onSell={setSellFor} onReceive={receive} onReport={openIssue} busy={busy} role={role} />) : (
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
              <ReviewRow k="Value" v={money(issueFor.grandTotal)} />
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

      <RecordSaleSheet shipment={sellFor} onClose={() => setSellFor(null)} showToast={showToast} refresh={refresh} />

      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

/* ---- 4-step send workflow ---- */
function NewShipment({ go, showToast, refresh, role }) {
  const [step, setStep] = React.useState(1);
  const [brand, setBrand] = React.useState("");
  const [boxes, setBoxes] = React.useState("");
  const [cases, setCases] = React.useState("");
  const [rolls, setRolls] = React.useState("");
  const [cans,  setCans]  = React.useState("");
  const [canPrice, setCanPrice] = React.useState("");
  const [miscCost, setMiscCost] = React.useState("");
  const [miscDesc, setMiscDesc] = React.useState("");
  const [expLines, setExpLines] = React.useState([]);
  const [saving, setSaving] = React.useState(false);

  // Boxes / Cases / Rolls / Cans are all editable and kept in sync via total cans.
  const totalCans = Number(cans) || 0;
  const u = {
    boxes: totalCans / DATA.TO_CANS.Box,
    cases: totalCans / DATA.TO_CANS.Case,
    rolls: totalCans / DATA.TO_CANS.Roll,
    cans:  totalCans,
  };
  // Edit any unit → set that field to the raw text, derive the other three.
  const applyUnit = (unit, raw) => {
    const total = (Number(raw) || 0) * (DATA.TO_CANS[unit] || 1);
    const t = (n) => { const x = Number(n); return x ? String(+x.toFixed(4)) : ""; };
    setBoxes(unit === "Box"  ? raw : t(total / DATA.TO_CANS.Box));
    setCases(unit === "Case" ? raw : t(total / DATA.TO_CANS.Case));
    setRolls(unit === "Roll" ? raw : t(total / DATA.TO_CANS.Roll));
    setCans (unit === "Can"  ? raw : t(total));
  };
  const lad = DATA.priceLadder(canPrice);
  const subtotal = u.cans * (Number(canPrice) || 0);
  const grandTotal = subtotal + (Number(miscCost) || 0);

  const canNext =
    step === 1 ? (brand && totalCans > 0) :
    step === 2 ? (Number(canPrice) > 0) : true;

  const submit = async () => {
    setSaving(true);
    try {
      const created = await DB.shipments.insert({
        brand, boxes: u.boxes, cases: u.cases, rolls: u.rolls, cans: u.cans,
        pricePerCan: Number(canPrice) || 0, subtotal,
        miscCost: Number(miscCost) || 0, miscDesc,
        grandTotal, sender: "Clanny", receiver: "Clenny", status: "pending",
      });
      await insertExpenseLines(expLines, "Clanny", created && created.id);
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
          <Progress value={(step / 4) * 100} />
        </div>
        <span className="faint mono" style={{ fontSize: 12 }}>{step}/4</span>
      </div>

      {step === 1 && (
        <div className="step-card" key="s1">
          <div className="steplabel">Step 1 · Brand & Quantity</div>
          <div className="step-q">What are you sending?</div>
          <div className="step-hint">Pick a brand, then enter the amount — boxes, cases, rolls and cans all stay in sync.</div>

          <div className="choice-row mb20">
            {DATA.BRANDS.map(b => (
              <button key={b} className={"choice" + (brand === b ? " on" : "")} onClick={() => setBrand(b)}>
                <div className="choice-ico"><Icon name="box" size={20} /></div>
                <div className="choice-name">{b}</div>
              </button>
            ))}
          </div>

          <div className="field">
            <label className="label">How many boxes are you sending?</label>
            <input className="bignum" type="number" inputMode="decimal" min="0" step="any" placeholder="0"
              value={boxes} onChange={e => applyUnit("Box", e.target.value)} />
          </div>

          <div className="step-hint" style={{ marginTop: 12, marginBottom: 2 }}>Sending less than a box? Enter cases, rolls or cans:</div>
          <div className="calc-grid" style={{ marginTop: 8 }}>
            <UnitCell k={<span><span className="uq uq-case" /> Cases</span>} unit="Case" value={cases} onChange={applyUnit} />
            <UnitCell k={<span><span className="uq uq-roll" /> Rolls</span>} unit="Roll" value={rolls} onChange={applyUnit} />
            <UnitCell k={<span><span className="uq uq-can" /> Cans</span>} unit="Can" value={cans} onChange={applyUnit} accent />
            <Cell k="Per box" v="540 cans" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="step-card" key="s2">
          <div className="steplabel">Step 2 · Pricing</div>
          <div className="step-q">How much is each can?</div>
          <div className="step-hint">We'll work out roll, case, box and the subtotal automatically.</div>

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
                <span className="rk">Subtotal</span><span className="rv">{money(subtotal)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="step-card" key="s3">
          <div className="steplabel">Step 3 · Overhead & Operations Costs</div>
          <div className="step-q">Any extra costs?</div>
          <div className="step-hint">These are separate from product cost — shipping, freight, handling, fuel, etc. Leave blank to skip.</div>

          <div className="field mb16">
            <label className="label">Overhead cost amount</label>
            <div className="bignum-wrap">
              <span className="bignum-cur">$</span>
              <input className="bignum prefixed" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
                value={miscCost} onChange={e => setMiscCost(e.target.value)} />
            </div>
          </div>
          <div className="field mb16">
            <label className="label">Overhead description</label>
            <input className="input" style={{ height: 46, fontSize: 15 }} placeholder="e.g. Freight"
              value={miscDesc} onChange={e => setMiscDesc(e.target.value)} />
          </div>

          <div className="field">
            <label className="label">Operations expenses (optional · billed to Clanny)</label>
            <div className="step-hint" style={{ marginBottom: 10, fontSize: 12 }}>Separate operating costs like fuel, pickup travel, port fees. These are tracked independently from product pricing.</div>
            <ExpenseLines lines={expLines} setLines={setExpLines} categories={["Freight", "Pickup travel", "Fuel", "Port fees", "Loading", "Other"]} />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="step-card" key="s4">
          <div className="steplabel">Step 4 · Review</div>
          <div className="step-q">Ready to send?</div>
          <div className="step-hint">From <strong>Clanny</strong> to <strong>Clenny</strong>. Confirm the details below.</div>

          <div className="review-card">
            <ReviewRow k="Brand" v={brand} />
            <ReviewRow k="Boxes" v={fmt(u.boxes)} />
            <ReviewRow k="Cases" v={fmt(u.cases)} />
            <ReviewRow k="Rolls" v={fmt(u.rolls)} />
            <ReviewRow k="Cans" v={fmt(u.cans)} />
            <ReviewRow k="Price / can" v={money(Number(canPrice) || 0, 2)} />
            <ReviewRow k="Subtotal" v={money(subtotal)} />
          </div>

          {Number(miscCost) > 0 && (
            <div className="review-card mt12">
              <div className="review-row" style={{ fontWeight: 600, color: "var(--text-2)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span className="rk">Overhead (included in total)</span><span className="rv"></span>
              </div>
              <ReviewRow k={miscDesc || "Overhead cost"} v={money(Number(miscCost))} />
            </div>
          )}

          <div className="review-card mt12">
            <ReviewRow k="Grand total" v={money(grandTotal)} total />
          </div>

          {expLines.some(l => Number(l.amount) > 0) && (
            <div className="review-card mt12">
              <div className="review-row" style={{ fontWeight: 600, color: "var(--text-2)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <span className="rk">Operations expenses</span><span className="rv"></span>
              </div>
              {expLines.filter(l => Number(l.amount) > 0).map((l, i) => (
                <ReviewRow key={i} k={l.category} v={money(Number(l.amount))} />
              ))}
              <div className="step-hint" style={{ fontSize: 11, marginTop: 8 }}>
                Billed to Clanny · tracked separately, not part of the shipment grand total.
              </div>
            </div>
          )}
        </div>
      )}

      <div className="sticky-actions">
        {step > 1 && <button className="btn" onClick={() => setStep(step - 1)} disabled={saving}>Back</button>}
        {step < 4 && <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canNext}>
          Continue <Icon name="arrowR" size={15} />
        </button>}
        {step === 4 && <button className="btn btn-primary" onClick={submit} disabled={saving}>
          <Icon name="send" size={15} />{saving ? "Sending…" : "Send Shipment"}
        </button>}
      </div>
    </div>
  );
}

Object.assign(window, { Shipments, NewShipment, ShipmentCard, Cell, ReviewRow });
