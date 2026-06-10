/* ============================================================
   LOGIN — split brand / form, role-aware
   ============================================================ */
function Login({ onLogin }) {
  const [role, setRole] = React.useState("Owner");
  const [email, setEmail] = React.useState("owner@cctobacco.co");
  const roles = [
    { k: "Owner", desc: "Full access · profitability, team, all operations", icon: "reports" },
    { k: "Sales Rep", desc: "Invoices, customers, payments, delivery", icon: "invoice" },
    { k: "Warehouse", desc: "Inventory, shipments, receiving", icon: "pkg" },
  ];
  return (
    <div className="login-grid">
      {/* brand panel */}
      <div className="login-brand" style={{
        position: "relative", overflow: "hidden", borderRight: "1px solid var(--border)",
        background: "radial-gradient(900px 500px at 25% 20%, rgba(62,207,142,0.10), transparent 60%), linear-gradient(160deg,#0c0c0e,#0a0a0b)",
        padding: "54px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.4, background: "repeating-linear-gradient(135deg, rgba(255,255,255,0.015) 0 1px, transparent 1px 22px)" }} />
        <div className="center gap12" style={{ position: "relative" }}>
          <div className="brand-mark" style={{ width: 38, height: 38, fontSize: 17 }}>CC</div>
          <div>
            <div className="brand-name" style={{ fontSize: 16 }}>CC Tobacco</div>
            <div className="brand-sub">Distribution OS</div>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 16 }}>Operational since 2014</div>
          <h1 style={{ fontSize: 38, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.12, maxWidth: 460 }}>
            Every case, every customer,<br />every dollar — in one place.
          </h1>
          <p style={{ color: "var(--text-2)", fontSize: 15, marginTop: 18, maxWidth: 420, lineHeight: 1.6 }}>
            The operations system for modern tobacco distribution. Inventory, receiving, invoicing, payments and profitability — built for speed.
          </p>
          <div className="center gap16" style={{ marginTop: 34 }}>
            {[["$318k", "revenue this month"], ["742", "cases in stock"], ["8", "active customers"]].map(([a, b]) => (
              <div key={b}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em" }}>{a}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{b}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", fontSize: 12, color: "var(--text-4)" }}>© 2026 CC Tobacco Co. · SOC 2 Type II · TTB licensed</div>
      </div>

      {/* form panel */}
      <div style={{ display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ width: "100%", maxWidth: 380 }} className="fade-in">
          <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>Sign in</h2>
          <p style={{ color: "var(--text-3)", fontSize: 13.5, margintop: 6, marginTop: 6 }}>Welcome back. Choose your role to continue.</p>

          <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 8 }}>
            {roles.map(r => (
              <button key={r.k} onClick={() => setRole(r.k)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: "var(--radius-sm)",
                border: "1px solid " + (role === r.k ? "var(--accent-line)" : "var(--border-2)"),
                background: role === r.k ? "var(--accent-softer)" : "var(--panel)",
                textAlign: "left", transition: ".14s",
              }}>
                <div className="stat-ico" style={{ background: role === r.k ? "var(--accent-soft)" : "var(--panel-3)", color: role === r.k ? "var(--accent)" : "var(--text-2)" }}>
                  <Icon name={r.icon} size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.k}</div>
                  <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 1 }}>{r.desc}</div>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid " + (role === r.k ? "var(--accent)" : "var(--border-3)"), display: "grid", placeItems: "center" }}>
                  {role === r.k && <div style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--accent)" }} />}
                </div>
              </button>
            ))}
          </div>

          <div className="field" style={{ marginTop: 18 }}>
            <label className="label">Email</label>
            <input className="input" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label className="label center between"><span>Password</span><a style={{ color: "var(--accent)", fontWeight: 500 }}>Forgot?</a></label>
            <input className="input" type="password" defaultValue="••••••••••" />
          </div>

          <button className="btn btn-primary" style={{ width: "100%", height: 42, marginTop: 22, fontSize: 14 }} onClick={() => onLogin(role)}>
            Continue as {role} <Icon name="arrowR" size={16} />
          </button>
          <div className="center gap8" style={{ marginTop: 16, justifyContent: "center", color: "var(--text-4)", fontSize: 12 }}>
            <Icon name="lock" size={13} /> Secured with 256-bit encryption
          </div>
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { Login });
