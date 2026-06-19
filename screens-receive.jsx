/* ============================================================
   RECEIVE — Clenny (Receiver) confirms pending shipments
   Confirm Received  ·  Report Issue (stores note + disputed)
   ============================================================ */

function ReceiveCard({ s, onConfirm, onReport, busy, role }) {
  const [open, setOpen] = React.useState(false);
  const showActions = role?.name === "Clenny";
  return (
    <div className="list-card">
      <button className="lc-head" onClick={() => setOpen(o => !o)}>
        <div className="lc-ico" style={{ background: "var(--warn-bg)", color: "var(--warn)" }}>
          <Icon name="inbox" size={19} />
        </div>
        <div className="lc-main">
          <div className="lc-title">{s.brand} <ShipStatus status={s.status} /></div>
          <div className="lc-sub">{boxWord(s.boxes)} · {fmt(s.cans)} cans · from {s.sender}</div>
        </div>
        <div className="lc-amt">{money(s.grandTotal)}<span className="sub">{relTime(s.createdAt)}</span></div>
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
        </div>
      )}

      {showActions && (
        <div className="lc-actions">
          <button className="btn btn-danger" onClick={() => onReport(s)} disabled={busy}>
            <Icon name="alert" size={15} />Report Issue
          </button>
          <button className="btn btn-primary" onClick={() => onConfirm(s)} disabled={busy}>
            <Icon name="check" size={15} />Confirm Received
          </button>
        </div>
      )}
    </div>
  );
}

function Receive({ shipments, loading, showToast, refresh, role }) {
  const pending = shipments.filter(s => s.status === "pending");
  const [busy, setBusy] = React.useState(false);
  const [issueFor, setIssueFor] = React.useState(null);
  const [note, setNote] = React.useState("");

  const confirm = async (s) => {
    setBusy(true);
    try {
      await DB.shipments.receive(s.id);
      await refresh();
      showToast(`${s.brand} shipment received`);
    } catch (e) { showToast("Couldn't update — check connection"); }
    setBusy(false);
  };

  const openIssue = (s) => { setIssueFor(s); setNote(""); };
  const submitIssue = async () => {
    if (!issueFor) return;
    setBusy(true);
    try {
      await DB.shipments.dispute(issueFor.id, note.trim());
      await refresh();
      showToast("Issue reported to Clanny");
      setIssueFor(null);
    } catch (e) { showToast("Couldn't report — check connection"); }
    setBusy(false);
  };

  return (
    <div className="page fade-in">
      <div className="mb16">
        <div className="page-title">Receive</div>
        <div className="page-desc">
          {pending.length} shipment{pending.length !== 1 ? "s" : ""} from Clanny awaiting confirmation
        </div>
      </div>

      {role && role.name !== "Clenny" && (
        <div className="card card-pad mb16" style={{ borderColor: "var(--accent-line)", background: "var(--accent-softer)" }}>
          <div className="center gap10">
            <Icon name="alert" size={16} className="muted" />
            <span style={{ fontSize: 12.5, color: "var(--text-2)" }}>
              Receiving is Clenny's role. You're signed in as {role.name} — you can review, but Clenny confirms.
            </span>
          </div>
        </div>
      )}

      {loading ? <SkeletonList count={4} /> :
        pending.length > 0 ? pending.map(s => (
          <ReceiveCard key={s.id} s={s} busy={busy} onConfirm={confirm} onReport={openIssue} role={role} />
        )) : (
          <div className="empty">
            <Icon name="check" size={30} />
            <div className="empty-title">All caught up</div>
            <div className="empty-desc">No pending shipments to receive</div>
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
              <textarea className="input" rows={4} placeholder="Describe the issue…"
                value={note} onChange={e => setNote(e.target.value)} autoFocus />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", height: 48 }}
              onClick={submitIssue} disabled={busy || !note.trim()}>
              <Icon name="alert" size={15} />{busy ? "Reporting…" : "Submit Issue"}
            </button>
          </>
        )}
      </Sheet>

      <div className="m-foot">© {new Date().getFullYear()} Clenny Minor · All Rights Reserved</div>
    </div>
  );
}

Object.assign(window, { Receive, ReceiveCard });
