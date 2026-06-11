/* ============================================================
   DATA — CC Tobacco Distribution OS  (sample data, no backend)
   Unit ladder: 1 Case = 4 Boxes · 1 Box = 19 Rolls · 1 Roll = 5 Cans
   Total: 1 Case = 380 Cans
   ============================================================ */
(function () {
  const UNITS = ["Case", "Box", "Roll", "Can"];
  // Canonical conversion to Cans
  const LADDER = { Case: 380, Box: 95, Roll: 5, Can: 1 };
  // Case → 4 Boxes → 76 Rolls → 380 Cans
  const CASE_TO = { Box: 4, Roll: 76, Can: 380 };

  // ---- Products ------------------------------------------------
  const products = [];

  // ---- Customers -----------------------------------------------
  const customers = [];

  // ---- Shipments (inbound) -------------------------------------
  const shipments = [];
  const shipmentLines = [];

  // ---- Invoices / Sales Records --------------------------------
  const invoices = [];
  const invoiceLines = [];

  // ---- KPIs ----------------------------------------------------
  const kpis = {
    revenue: 0, revenueTrend: 0,
    profit: 0,  profitTrend: 0, margin: 0,
    invValue: 0, invTrend: 0,
    balances: 0, overdue: 0,
    ordersToday: 0, casesOut: 0,
  };

  const revSeries    = [];
  const profitSeries = [];
  const cashflow     = [];
  const categoryMix  = [];
  const topProducts  = [];
  const activity     = [];

  window.DATA = {
    UNITS, LADDER, CASE_TO,
    products, customers, shipments, shipmentLines,
    invoices, invoiceLines,
    kpis, revSeries, profitSeries, cashflow, categoryMix, topProducts, activity,
  };
})();
