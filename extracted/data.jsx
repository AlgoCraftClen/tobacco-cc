/* ============================================================
   DATA — CC Tobacco Distribution OS  (sample data, no backend)
   Unit ladder: 1 Case = 6 Boxes · 1 Box = 10 Rolls · 1 Roll = 5 Cans
   Total: 1 Case = 300 Cans
   ============================================================ */
(function () {
  const UNITS = ["Case", "Box", "Roll", "Can"];
  // Canonical conversion to Cans
  const LADDER = { Case: 300, Box: 50, Roll: 5, Can: 1 };
  // Case → 6 Boxes → 60 Rolls → 300 Cans
  const CASE_TO = { Box: 6, Roll: 60, Can: 300 };

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
