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

  /* ---- Shipment finance ----------------------------------- */
  const PARTNERS = [SENDER, RECEIVER];
  const PRODUCT_FUNDING_CATEGORY = "Product funding";
  const EXPENSE_KINDS = {
    PRODUCT: "product_funding",
    SHIPMENT: "shipment_cost",
    DISTRIBUTION: "distribution_cost",
    GENERAL: "general_expense",
  };
  const num = (v) => Number(v) || 0;
  const cleanPartner = (partner) => PARTNERS.includes(partner) ? partner : SENDER;
  const emptyPartners = () => ({ Clanny: 0, Clenny: 0 });
  const emptyFunding = () => ({
    Clanny: { amount: 0, cans: 0, rolls: 0 },
    Clenny: { amount: 0, cans: 0, rolls: 0 },
  });
  const parseExpenseMeta = (expense) => {
    const text = String((expense && expense.description) || "").trim();
    if (!text || text[0] !== "{") return null;
    try { return JSON.parse(text); }
    catch (e) { return null; }
  };
  const makeExpenseDescription = (kind, data) => JSON.stringify({ kind, ...(data || {}) });
  const expenseKind = (expense) => {
    const meta = parseExpenseMeta(expense);
    if (meta && meta.kind) return meta.kind;
    const cat = String((expense && expense.category) || "").toLowerCase();
    if (cat === PRODUCT_FUNDING_CATEGORY.toLowerCase()) return EXPENSE_KINDS.PRODUCT;
    if (cat.indexOf("distribution") === 0) return EXPENSE_KINDS.DISTRIBUTION;
    if (expense && expense.shipmentId) return EXPENSE_KINDS.SHIPMENT;
    return EXPENSE_KINDS.GENERAL;
  };
  const isProductFunding = (expense) => expenseKind(expense) === EXPENSE_KINDS.PRODUCT;
  const displayExpenseCategory = (expense) => {
    const meta = parseExpenseMeta(expense);
    return (meta && meta.category) || expense.category || expense.description || "Cost";
  };
  const expensesForShipment = (expenses, shipmentId) =>
    (expenses || []).filter(e => shipmentId && e.shipmentId === shipmentId);

  const productFundingForShipment = (shipment, expenses) => {
    const funding = emptyFunding();
    const rows = expensesForShipment(expenses, shipment && shipment.id).filter(isProductFunding);
    rows.forEach(row => {
      const partner = cleanPartner(row.partner);
      const meta = parseExpenseMeta(row) || {};
      const amount = num(row.amount);
      const cans = num(meta.cans) || (num(shipment && shipment.pricePerCan) > 0 ? amount / num(shipment.pricePerCan) : 0);
      funding[partner].amount += amount;
      funding[partner].cans += cans;
      funding[partner].rolls += num(meta.rolls) || (cans / TO_CANS.Roll);
    });

    const fallbackTotal = num(shipment && shipment.subtotal) || num(shipment && shipment.grandTotal);
    if (!rows.length && fallbackTotal > 0) {
      funding[SENDER].amount = fallbackTotal;
      funding[SENDER].cans = num(shipment && shipment.cans);
      funding[SENDER].rolls = funding[SENDER].cans / TO_CANS.Roll;
    }

    const totalAmount = funding.Clanny.amount + funding.Clenny.amount;
    const totalCans = funding.Clanny.cans + funding.Clenny.cans;
    return { rows, funding, totalAmount, totalCans };
  };

  const shipmentFinance = (shipment, expenses) => {
    const product = productFundingForShipment(shipment, expenses);
    const related = expensesForShipment(expenses, shipment && shipment.id);
    const costRows = related.filter(e => !isProductFunding(e));
    const costsPaid = emptyPartners();
    const shipmentCostsPaid = emptyPartners();
    const distributionCostsPaid = emptyPartners();
    costRows.forEach(row => {
      const partner = cleanPartner(row.partner);
      const amount = num(row.amount);
      const kind = expenseKind(row);
      costsPaid[partner] += amount;
      if (kind === EXPENSE_KINDS.DISTRIBUTION) distributionCostsPaid[partner] += amount;
      else shipmentCostsPaid[partner] += amount;
    });

    const revenue = num(shipment && shipment.saleTotal);
    const productTotal = product.totalAmount || num(shipment && shipment.subtotal) || num(shipment && shipment.grandTotal);
    const fundedCans = product.totalCans || num(shipment && shipment.cans);
    const revenueShare = emptyPartners();
    const productProfit = emptyPartners();
    const netGain = emptyPartners();
    PARTNERS.forEach(partner => {
      const ratio = fundedCans > 0
        ? (product.funding[partner].cans / fundedCans)
        : (productTotal > 0 ? product.funding[partner].amount / productTotal : 0);
      revenueShare[partner] = revenue * ratio;
      productProfit[partner] = revenueShare[partner] - product.funding[partner].amount;
      netGain[partner] = productProfit[partner] - costsPaid[partner];
    });

    const extraCosts = costsPaid.Clanny + costsPaid.Clenny;
    const shipmentCosts = shipmentCostsPaid.Clanny + shipmentCostsPaid.Clenny;
    const distributionCosts = distributionCostsPaid.Clanny + distributionCostsPaid.Clenny;
    return {
      productRows: product.rows,
      costRows,
      funding: product.funding,
      productTotal,
      fundedCans,
      extraCosts,
      shipmentCosts,
      distributionCosts,
      costsPaid,
      shipmentCostsPaid,
      distributionCostsPaid,
      allInTotal: productTotal + extraCosts,
      revenue,
      revenueShare,
      productProfit,
      netGain,
      grossProfit: revenue - productTotal,
      netProfit: revenue - productTotal - extraCosts,
    };
  };

  // Partnership accounting:
  //  - shipment product funding is recorded per partner and follows the shipment
  //  - sales revenue is shared by each partner's funded product percentage per shipment
  //  - shipment/distribution costs stay separate and reduce the payer's net gain
  const computePartnership = (shipments, purchases, expenses, contributions) => {
    const contributed = emptyPartners();
    const productFunded = emptyPartners();
    const costsPaid = emptyPartners();
    const shipmentCostsPaid = emptyPartners();
    const distributionCostsPaid = emptyPartners();
    const revenueShare = emptyPartners();
    const productProfit = emptyPartners();
    const netGain = emptyPartners();
    let revenue = 0, productTotal = 0, extraCosts = 0, shipmentCosts = 0, distributionCosts = 0, manualPurchases = 0;

    (contributions || []).forEach(c => {
      const partner = cleanPartner(c.partner);
      contributed[partner] += num(c.amount);
    });

    // Older manually logged purchases still count as product funded, but new funding should come from shipments.
    (purchases || []).forEach(p => {
      const partner = cleanPartner(p.partner);
      const amount = num(p.total);
      manualPurchases += amount;
      productFunded[partner] += amount;
      netGain[partner] -= amount;
    });

    (shipments || []).forEach(s => {
      const f = shipmentFinance(s, expenses);
      revenue += f.revenue;
      productTotal += f.productTotal;
      extraCosts += f.extraCosts;
      shipmentCosts += f.shipmentCosts;
      distributionCosts += f.distributionCosts;
      PARTNERS.forEach(partner => {
        productFunded[partner] += f.funding[partner].amount;
        costsPaid[partner] += f.costsPaid[partner];
        shipmentCostsPaid[partner] += f.shipmentCostsPaid[partner];
        distributionCostsPaid[partner] += f.distributionCostsPaid[partner];
        revenueShare[partner] += f.revenueShare[partner];
        productProfit[partner] += f.productProfit[partner];
        netGain[partner] += f.netGain[partner];
      });
    });

    const generalExpenses = (expenses || [])
      .filter(e => !e.shipmentId && !isProductFunding(e))
      .reduce((sum, e) => {
        const partner = cleanPartner(e.partner);
        const amount = num(e.amount);
        costsPaid[partner] += amount;
        netGain[partner] -= amount;
        return sum + amount;
      }, 0);
    extraCosts += generalExpenses;

    const totalExpenses = productTotal + manualPurchases + extraCosts;
    const totalContributions = contributed.Clanny + contributed.Clenny;
    const netProfit = revenue - totalExpenses;
    const netPosition = { Clanny: netGain.Clanny, Clenny: netGain.Clenny };

    return {
      revenue, productTotal, manualPurchases, extraCosts, shipmentCosts, distributionCosts,
      totalExpenses, totalContributions, netProfit, contributed,
      productFunded, costsPaid, shipmentCostsPaid, distributionCostsPaid,
      revenueShare, productProfit, netGain, netPosition,
    };
  };

  window.DATA = {
    SENDER, RECEIVER, ROLES, roleOf, BRANDS,
    UNITS, TO_CANS, BOX_TO, CASE_TO, ROLL_TO,
    boxesToUnits, priceLadder,
    PRODUCT_FUNDING_CATEGORY, EXPENSE_KINDS,
    makeExpenseDescription, parseExpenseMeta, expenseKind, isProductFunding,
    displayExpenseCategory, expensesForShipment, productFundingForShipment, shipmentFinance,
    computePartnership,

    // Live caches (populated from Supabase at runtime)
    shipments: [],
    purchases: [],
  };
})();
