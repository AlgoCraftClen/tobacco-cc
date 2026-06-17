/* ============================================================
   DATA — CC Tobacco OS (mobile shipment tracker)
   Unit ladder (SPEC — never alter):
     1 Box  = 6 Cases
     1 Case = 18 Rolls
     1 Roll = 5 Cans
   Derived: 1 Box = 108 Rolls = 540 Cans · 1 Case = 90 Cans
   ============================================================ */
(function () {
  /* ---- Roles ------------------------------------------------ */
  // Clanny is ALWAYS the Sender. Clenny is ALWAYS the Receiver.
  const SENDER   = "Clanny";
  const RECEIVER = "Clenny";
  const ROLES = {
    Clanny: { name: "Clanny", role: "Sender",   av: "av-3", greetingRole: "Sender" },
    Clenny: { name: "Clenny", role: "Receiver", av: "av-1", greetingRole: "Receiver" },
  };
  const roleOf = (name) => ROLES[name] || null;

  /* ---- Brands ---------------------------------------------- */
  const BRANDS = ["Grizzly", "Cope"];

  /* ---- Unit ladder ----------------------------------------- */
  // Hierarchy: Box > Case > Roll > Can
  const UNITS = ["Box", "Case", "Roll", "Can"];
  // Canonical conversion to Cans (smallest unit)
  const TO_CANS = { Box: 540, Case: 90, Roll: 5, Can: 1 };
  // From one Box
  const BOX_TO = { Case: 6, Roll: 108, Can: 540 };
  // From one Case
  const CASE_TO = { Roll: 18, Can: 90 };
  // From one Roll
  const ROLL_TO = { Can: 5 };

  // Given a number of boxes, return the full unit breakdown.
  const boxesToUnits = (boxes) => {
    const b = Number(boxes) || 0;
    return { boxes: b, cases: b * BOX_TO.Case, rolls: b * BOX_TO.Roll, cans: b * BOX_TO.Can };
  };

  // Given a per-can price, return per-unit pricing.
  const priceLadder = (canPrice) => {
    const c = Number(canPrice) || 0;
    return {
      perCan:  c,
      perRoll: c * ROLL_TO.Can,        // × 5
      perCase: c * TO_CANS.Case,       // × 90
      perBox:  c * TO_CANS.Box,        // × 540
    };
  };

  // Partnership economics: 50/50 cost + profit split with settlement.
  // contributed = capital each paid in (shipments by sender + purchases by partner)
  // collected   = resale revenue each took in (sold shipment totals, by receiver)
  const computeStake = (shipments, purchases) => {
    const contributed = { Clanny: 0, Clenny: 0 };
    const collected   = { Clanny: 0, Clenny: 0 };
    (shipments || []).forEach(s => {
      contributed[s.sender] = (contributed[s.sender] || 0) + (Number(s.grandTotal) || 0);
      if ((Number(s.saleTotal) || 0) > 0)
        collected[s.receiver] = (collected[s.receiver] || 0) + Number(s.saleTotal);
    });
    (purchases || []).forEach(p => {
      contributed[p.partner] = (contributed[p.partner] || 0) + (Number(p.total) || 0);
    });
    const cost     = contributed.Clanny + contributed.Clenny;
    const revenue  = collected.Clanny + collected.Clenny;
    const profit   = revenue - cost;
    const sharePer = profit / 2;                       // each partner's 50% entitlement
    const net = {                                       // current cash position (Σ = profit)
      Clanny: collected.Clanny - contributed.Clanny,
      Clenny: collected.Clenny - contributed.Clenny,
    };
    const adjClanny = sharePer - net.Clanny;           // >0 ⇒ Clanny should receive
    let settlement = null;
    if (Math.round(adjClanny * 100) > 0)      settlement = { from: "Clenny", to: "Clanny", amount: adjClanny };
    else if (Math.round(adjClanny * 100) < 0) settlement = { from: "Clanny", to: "Clenny", amount: -adjClanny };
    const soldCount      = (shipments || []).filter(s => (Number(s.saleTotal) || 0) > 0).length;
    const unsoldReceived = (shipments || []).filter(s => s.status === "received" && !((Number(s.saleTotal) || 0) > 0)).length;
    return { cost, revenue, profit, sharePer, contributed, collected, net, settlement, soldCount, unsoldReceived };
  };

  window.DATA = {
    SENDER, RECEIVER, ROLES, roleOf, BRANDS,
    UNITS, TO_CANS, BOX_TO, CASE_TO, ROLL_TO,
    boxesToUnits, priceLadder, computeStake,

    // Live caches (populated from Supabase at runtime)
    shipments: [],
    purchases: [],
  };
})();
