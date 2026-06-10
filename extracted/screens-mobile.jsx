/* ============================================================
   MOBILE DELIVERY MODE — driver route flow (phone frame)
   ============================================================ */
function MobileDelivery({ go, showToast }) {
  const STOPS = [
    { id: 1, name: "Highland Wholesale Club", addr: "212 Industrial Ave, Paterson", window: "9:00–9:30", cases: 18, total: 24180, items: [["Marlboro Gold", "Case", 6], ["Newport Menthol", "Case", 4], ["Elf Bar BC5000", "Box", 8]], pay: "On account", status: "done" },
    { id: 2, name: "Liberty Gas & Convenience", addr: "88 Springfield Ave, Newark", window: "9:45–10:15", cases: 9, total: 8940, items: [["Zyn Cool Mint 6mg", "Box", 6], ["Camel Crush", "Case", 3]], pay: "Collect $8,940", status: "done" },
    { id: 3, name: "Metro Tobacco Outlet", addr: "1400 Oak Tree Rd, Edison", window: "10:30–11:00", cases: 12, total: 12650, items: [["Grizzly Wintergreen", "Box", 4], ["Copenhagen Long Cut", "Box", 5], ["Bic Lighter Tray", "Box", 3]], pay: "On account", status: "active" },
    { id: 4, name: "Eastside Smoke & Vape", addr: "55 Hamilton St, Trenton", window: "11:30–12:00", cases: 6, total: 8420, items: [["Swisher Sweets", "Box", 4], ["Black & Mild", "Box", 2]], pay: "Collect $8,420", status: "next" },
    { id: 5, name: "Sunrise Deli & Grocery", addr: "300 Newark Ave, Jersey City", window: "12:30–1:00", cases: 8, total: 6730, items: [["Juul Virginia", "Box", 5], ["Zyn Citrus 3mg", "Box", 3]], pay: "Collect $4,810", status: "next" },
    { id: 6, name: "Quick Stop Mini Market", addr: "19 Mt Ephraim Ave, Camden", window: "1:30–2:00", cases: 5, total: 3240, items: [["Elf Bar BC5000", "Box", 5]], pay: "COD $3,240", status: "next" },
  ];
  const [stops, setStops] = React.useState(STOPS);
  const [view, setView] = React.useState("route"); // route | stop | pay
  const [activeId, setActiveId] = React.useState(3);
  const [payMethod, setPayMethod] = React.useState("Cash");
  const active = stops.find(s => s.id === activeId);
  const doneCount = stops.filter(s => s.status === "done").length;
  const remaining = stops.filter(s => s.status !== "done");
  const collected = 33120;

  const openStop = (s) => { setActiveId(s.id); setView("stop"); };
  const markDelivered = () => {
    setStops(ss => {
      const next = ss.map(s => s.id === activeId ? { ...s, status: "done" } : s);
      const firstPending = next.find(s => s.status === "next" || s.status === "active");
      if (firstPending) firstPending.status = "active";
      return [...next];
    });
    showToast?.(`${active.name} delivered`);
    setView("route");
  };

  const ACCENT = "var(--accent)";
  const [scale, setScale] = React.useState(1);
  React.useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 36) / 820));
    fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <div style={{ height: "100vh", display: "grid", placeItems: "center", background: "radial-gradient(700px 500px at 50% 0%, rgba(62,207,142,0.06), transparent), #060607", position: "relative" }}>
      <button className="btn btn-sm" style={{ position: "absolute", top: 22, left: 22, zIndex: 5 }} onClick={() => go("dashboard")}><Icon name="chevL" size={14} />Exit Delivery Mode</button>
      <div style={{ position: "absolute", top: 24, right: 24, textAlign: "right", zIndex: 5 }}>
        <div className="faint" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>Driver</div>
        <div className="center gap8" style={{ marginTop: 4 }}><Avatar name="Marco Alvarez" cls="av-1" size={26} /><span style={{ fontSize: 13, fontWeight: 500 }}>Marco Alvarez</span></div>
        <div className="faint mono" style={{ fontSize: 11, marginTop: 6 }}>North NJ · Van 4 · 58 cases loaded</div>
      </div>

      <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
      <IOSDevice dark width={390} height={820}>
        <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0b", color: "var(--text)", fontFamily: "var(--font)" }}>
          {/* app header */}
          <div style={{ padding: "52px 20px 14px", flexShrink: 0, borderBottom: "1px solid var(--border)", background: "linear-gradient(180deg,#0c0c0e,#0a0a0b)" }}>
            {view === "route" ? (
              <>
                <div className="between">
                  <div><div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>Today's Route</div><div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>Tue Jun 10 · North NJ</div></div>
                  <div className="brand-mark" style={{ width: 30, height: 30, fontSize: 13 }}>CC</div>
                </div>
                <div className="center gap10" style={{ marginTop: 16 }}>
                  <div style={{ flex: 1 }}><div className="between" style={{ fontSize: 11.5, marginBottom: 6 }}><span className="faint">Progress</span><span className="mono" style={{ fontWeight: 600 }}>{doneCount}/{stops.length} stops</span></div><Meter value={doneCount} max={stops.length} height={7} /></div>
                </div>
              </>
            ) : view === "stop" ? (
              <div className="center gap12">
                <button className="icon-btn" style={{ width: 34, height: 34, background: "var(--panel-2)" }} onClick={() => setView("route")}><Icon name="chevL" size={18} /></button>
                <div><div style={{ fontSize: 16, fontWeight: 600 }}>Stop {active.id} of {stops.length}</div><div className="faint" style={{ fontSize: 12 }}>{active.window}</div></div>
              </div>
            ) : (
              <div className="center gap12">
                <button className="icon-btn" style={{ width: 34, height: 34, background: "var(--panel-2)" }} onClick={() => setView("stop")}><Icon name="chevL" size={18} /></button>
                <div><div style={{ fontSize: 16, fontWeight: 600 }}>{view === "pay" ? "Collect Payment" : "Proof of Delivery"}</div><div className="faint" style={{ fontSize: 12 }}>{active.name}</div></div>
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
            {view === "route" && (
              <>
                <div className="grid g-2" style={{ gap: 10, marginBottom: 14 }}>
                  <div className="card card-pad" style={{ padding: 13 }}><div className="faint" style={{ fontSize: 11 }}>Collected today</div><div className="mono" style={{ fontSize: 19, fontWeight: 600, color: ACCENT, marginTop: 3 }}>{money(collected)}</div></div>
                  <div className="card card-pad" style={{ padding: 13 }}><div className="faint" style={{ fontSize: 11 }}>Remaining</div><div className="mono" style={{ fontSize: 19, fontWeight: 600, marginTop: 3 }}>{remaining.length} stops</div></div>
                </div>
                <div className="col" style={{ gap: 10 }}>
                  {stops.map(s => (
                    <button key={s.id} onClick={() => openStop(s)} style={{
                      textAlign: "left", padding: 14, borderRadius: 13, position: "relative",
                      border: "1px solid " + (s.status === "active" ? "var(--accent-line)" : "var(--border)"),
                      background: s.status === "active" ? "var(--accent-softer)" : "var(--panel)", opacity: s.status === "done" ? 0.6 : 1,
                    }}>
                      <div className="center gap12">
                        <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "grid", placeItems: "center", fontWeight: 600, fontSize: 13,
                          background: s.status === "done" ? "var(--pos-bg)" : s.status === "active" ? "var(--accent)" : "var(--panel-3)",
                          color: s.status === "done" ? "var(--pos)" : s.status === "active" ? "var(--accent-ink)" : "var(--text-2)" }}>
                          {s.status === "done" ? <Icon name="check" size={16} strokeWidth={2.5} /> : s.id}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                          <div className="faint" style={{ fontSize: 12, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.addr}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>{s.window.split("–")[0]}</div>
                          <div className="faint mono" style={{ fontSize: 11 }}>{s.cases} cases</div>
                        </div>
                      </div>
                      {s.status === "active" && <div className="center gap6" style={{ marginTop: 10, fontSize: 11.5, color: ACCENT, fontWeight: 600 }}><span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />NEXT STOP · {s.pay}</div>}
                    </button>
                  ))}
                </div>
              </>
            )}

            {view === "stop" && active && (
              <div className="fade-in">
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{active.name}</div>
                <div className="center gap6 faint" style={{ fontSize: 13, marginTop: 4 }}><Icon name="pin" size={14} />{active.addr}</div>
                <div className="center gap10" style={{ marginTop: 14 }}>
                  <button className="btn" style={{ flex: 1, height: 46 }}><Icon name="route" size={16} style={{ color: ACCENT }} />Navigate</button>
                  <button className="btn" style={{ flex: 1, height: 46 }}><Icon name="phone" size={16} style={{ color: ACCENT }} />Call store</button>
                </div>

                <div className="card" style={{ marginTop: 16 }}>
                  <div className="card-hd" style={{ padding: "12px 14px" }}><h3 style={{ fontSize: 13 }}>Items to deliver</h3><div className="right"><span className="faint mono" style={{ fontSize: 11.5 }}>{active.cases} cases</span></div></div>
                  <div style={{ padding: "4px 0" }}>
                    {active.items.map((it, i) => (
                      <div key={i} className="between" style={{ padding: "11px 14px", borderTop: i ? "1px solid var(--border)" : "none" }}>
                        <div className="center gap10"><div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--panel-3)", display: "grid", placeItems: "center" }}><Icon name="box" size={14} className="muted" /></div><span style={{ fontSize: 13.5, fontWeight: 500 }}>{it[0]}</span></div>
                        <div className="center gap8"><UnitChip unit={it[1]} /><span className="mono" style={{ fontSize: 14, fontWeight: 600 }}>×{it[2]}</span></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card card-pad" style={{ marginTop: 14, padding: 14 }}>
                  <div className="between"><span className="faint" style={{ fontSize: 12.5 }}>Invoice total</span><span className="mono" style={{ fontSize: 22, fontWeight: 600 }}>{money(active.total)}</span></div>
                  <div className="between mt8"><span className="faint" style={{ fontSize: 12.5 }}>Payment</span><Badge kind={active.pay.startsWith("Collect") || active.pay.startsWith("COD") ? "warn" : "neutral"}>{active.pay}</Badge></div>
                </div>
              </div>
            )}

            {view === "pay" && active && (
              <div className="fade-in">
                <div className="center" style={{ justifyContent: "center", flexDirection: "column", padding: "10px 0 26px" }}>
                  <div className="faint" style={{ fontSize: 12 }}>Amount due</div>
                  <div className="mono" style={{ fontSize: 40, fontWeight: 600, letterSpacing: "-0.03em" }}>{money(active.total)}</div>
                </div>
                <div className="col" style={{ gap: 10 }}>
                  {[["Cash", "dollar"], ["Card", "wallet"], ["Check", "invoice"], ["On account", "clock"]].map(([m, ic]) => (
                    <button key={m} onClick={() => setPayMethod(m)} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, border: "1px solid " + (payMethod === m ? "var(--accent-line)" : "var(--border-2)"), background: payMethod === m ? "var(--accent-softer)" : "var(--panel)" }}>
                      <Icon name={ic} size={18} style={{ color: payMethod === m ? ACCENT : "var(--text-3)" }} />
                      <span style={{ fontSize: 14.5, fontWeight: 500, flex: 1, textAlign: "left" }}>{m}</span>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid " + (payMethod === m ? ACCENT : "var(--border-3)"), display: "grid", placeItems: "center" }}>{payMethod === m && <div style={{ width: 9, height: 9, borderRadius: "50%", background: ACCENT }} />}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {view === "proof" && active && (
              <div className="fade-in">
                <div className="ph" style={{ height: 150, marginTop: 4, flexDirection: "column", gap: 8 }}>
                  <Icon name="camera" size={26} />
                  <span>tap to photograph the drop-off</span>
                </div>
                <div className="label" style={{ marginTop: 16, marginBottom: 8 }}>Signature</div>
                <div className="ph" style={{ height: 96, alignItems: "flex-end", justifyContent: "flex-start", padding: 12 }}>
                  <span style={{ fontFamily: "cursive", fontSize: 22, color: "var(--text-3)", opacity: 0.6 }}>sign here</span>
                </div>
                <label className="center gap8" style={{ marginTop: 16, fontSize: 13, color: "var(--text-2)" }}>
                  <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: ACCENT }} />All {active.cases} cases delivered in full
                </label>
              </div>
            )}
          </div>
          <div style={{ flexShrink: 0, padding: "12px 16px 26px", borderTop: "1px solid var(--border)", background: "rgba(10,10,11,0.9)", backdropFilter: "blur(10px)" }}>
            {view === "route" && <button className="btn btn-primary" style={{ width: "100%", height: 50, fontSize: 15 }} onClick={() => openStop(active)}>Go to Stop {active.id} <Icon name="arrowR" size={17} /></button>}
            {view === "stop" && (
              <div className="center gap10">
                {(active.pay.startsWith("Collect") || active.pay.startsWith("COD")) && <button className="btn" style={{ flex: 1, height: 50, fontSize: 14.5 }} onClick={() => setView("pay")}><Icon name="wallet" size={17} />Collect</button>}
                <button className="btn btn-primary" style={{ flex: 1.4, height: 50, fontSize: 14.5 }} onClick={() => setView("proof")}><Icon name="check" size={17} strokeWidth={2.4} />Mark Delivered</button>
              </div>
            )}
            {view === "proof" && (
              <button className="btn btn-primary" style={{ width: "100%", height: 50, fontSize: 15 }} onClick={markDelivered}><Icon name="check" size={17} strokeWidth={2.4} />Confirm Delivery</button>
            )}
            {view === "pay" && (
              <button className="btn btn-primary" style={{ width: "100%", height: 50, fontSize: 15 }} onClick={() => { showToast?.(`${money(active.total)} collected · ${payMethod}`); setView("stop"); }}>
                <Icon name="check" size={17} strokeWidth={2.4} />Confirm {money(active.total)}
              </button>
            )}
          </div>
        </div>
      </IOSDevice>
      </div>

      <div className="faint" style={{ position: "absolute", bottom: 20, fontSize: 11.5 }}>Press <span className="kbd">Esc</span> to exit · live route updates sync to dispatch</div>
    </div>
  );
}
Object.assign(window, { MobileDelivery });
