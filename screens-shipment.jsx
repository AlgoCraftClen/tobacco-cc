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
function ReviewRow({ k, v, total }) {
  return (
    <div className={"review-row" + (total ? " total" : "")}>
      <span className="rk">{k}</span><span className="rv">{v}</span>
    </div>
  );
}

/* ---- Expandable shipment card (reused by list + history) ---- */
function ShipmentCard({ s, defaultOpen }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
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
          <div className="kv mt12"><span className="k">Route</span><span className="v">{s.sender} → {s.receiver}</span></div>
          {s.notes && <div className="kv"><span className="k">Issue note</span><span className="v" style={{ color: "var(--danger)" }}>{s.notes}</span></div>}
          {s.receivedAt && <div className="kv"><span className="k">{s.status === "disputed" ? "Flagged" : "Received"}</span><span className="v">{fmtDate(s.receivedAt)}</span></div>}
        </div>
      )}
    </div>
  );
}

/* ---- Shipments list (tab) ---- */
function Shipments({ shipments, loading, go, role }) {
  const [filter, setFilter] = React.useState("all");
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
        filtered.length > 0 ? filtered.map(s => <ShipmentCard key={s.id} s={s} />) : (
          <div className="empty">
            <Icon name="send" size={30} />
            <div className="empty-title">No shipments {filter !== "all" ? `(${filter})` : "yet"}</div>
            <div className="empty-desc">{role && role.name === "Clanny" ? "Tap New Shipment to send one" : "Shipments from Clanny will appear here"}</div>
          </div>
        )}

      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

/* ---- 4-step send workflow ---- */
function NewShipment({ go, showToast, refresh, role }) {
  const [step, setStep] = React.useState(1);
  const [brand, setBrand] = React.useState("");
  const [boxes, setBoxes] = React.useState("");
  const [canPrice, setCanPrice] = React.useState("");
  const [miscCost, setMiscCost] = React.useState("");
  const [miscDesc, setMiscDesc] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const u = DATA.boxesToUnits(boxes);
  const lad = DATA.priceLadder(canPrice);
  const subtotal = u.cans * (Number(canPrice) || 0);
  const grandTotal = subtotal + (Number(miscCost) || 0);

  const canNext =
    step === 1 ? (brand && Number(boxes) > 0) :
    step === 2 ? (Number(canPrice) > 0) : true;

  const submit = async () => {
    setSaving(true);
    try {
      await DB.shipments.insert({
        brand, boxes: u.boxes, cases: u.cases, rolls: u.rolls, cans: u.cans,
        pricePerCan: Number(canPrice) || 0, subtotal,
        miscCost: Number(miscCost) || 0, miscDesc,
        grandTotal, sender: "Clanny", receiver: "Clenny", status: "pending",
      });
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
          <div className="step-hint">Pick a brand, then enter the number of boxes.</div>

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
            <input className="bignum" type="number" inputMode="numeric" min="0" placeholder="0"
              value={boxes} onChange={e => setBoxes(e.target.value)} />
          </div>

          {Number(boxes) > 0 && (
            <div className="calc-grid">
              <Cell k={<span><span className="uq uq-case" /> Cases</span>} v={fmt(u.cases)} />
              <Cell k={<span><span className="uq uq-roll" /> Rolls</span>} v={fmt(u.rolls)} />
              <Cell k={<span><span className="uq uq-can" /> Cans</span>} v={fmt(u.cans)} accent />
              <Cell k="Per box" v="540 cans" />
            </div>
          )}
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
          <div className="steplabel">Step 3 · Miscellaneous Costs</div>
          <div className="step-q">Any extra costs?</div>
          <div className="step-hint">Optional — shipping, freight, handling. Leave blank to skip.</div>

          <div className="field mb16">
            <label className="label">Cost amount</label>
            <div className="bignum-wrap">
              <span className="bignum-cur">$</span>
              <input className="bignum prefixed" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00"
                value={miscCost} onChange={e => setMiscCost(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="label">Description</label>
            <input className="input" style={{ height: 46, fontSize: 15 }} placeholder="e.g. Freight"
              value={miscDesc} onChange={e => setMiscDesc(e.target.value)} />
          </div>

          <div className="review-card mt20">
            <ReviewRow k="Subtotal" v={money(subtotal)} />
            <ReviewRow k={miscDesc || "Misc cost"} v={money(Number(miscCost) || 0)} />
            <ReviewRow k="Grand total" v={money(grandTotal)} total />
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
            {Number(miscCost) > 0 && <ReviewRow k={miscDesc || "Misc cost"} v={money(Number(miscCost))} />}
            <ReviewRow k="Grand total" v={money(grandTotal)} total />
          </div>
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
