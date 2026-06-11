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
  const products = [
    { id: "P-1042", name: "Marlboro Gold", cat: "Cigarettes", brand: "Philip Morris",
      sku: "MB-GLD-200", baseUnit: "Case", casePrice: 4250, cost: 3180,
      onHand: 184, reorder: 60, par: 240, sold30: 96, status: "ok" },
    { id: "P-1043", name: "Newport Menthol", cat: "Cigarettes", brand: "ITG Brands",
      sku: "NP-MEN-200", baseUnit: "Case", casePrice: 4180, cost: 3040,
      onHand: 42, reorder: 50, par: 200, sold30: 88, status: "low" },
    { id: "P-1051", name: "Camel Crush", cat: "Cigarettes", brand: "RJ Reynolds",
      sku: "CM-CRS-200", baseUnit: "Case", casePrice: 4090, cost: 2980,
      onHand: 121, reorder: 55, par: 180, sold30: 64, status: "ok" },
    { id: "P-2210", name: "Grizzly Wintergreen", cat: "Smokeless", brand: "American Snuff",
      sku: "GZ-WNT-CAN", baseUnit: "Can", casePrice: 1980, cost: 1410,
      onHand: 9, reorder: 24, par: 96, sold30: 71, status: "critical" },
    { id: "P-2215", name: "Copenhagen Long Cut", cat: "Smokeless", brand: "US Smokeless",
      sku: "CP-LNG-CAN", baseUnit: "Can", casePrice: 2140, cost: 1560,
      onHand: 56, reorder: 30, par: 110, sold30: 58, status: "ok" },
    { id: "P-3320", name: "Zyn Cool Mint 6mg", cat: "Nicotine Pouch", brand: "Swedish Match",
      sku: "ZN-CLM-6", baseUnit: "Can", casePrice: 2860, cost: 1990,
      onHand: 38, reorder: 40, par: 140, sold30: 132, status: "low" },
    { id: "P-3322", name: "Zyn Citrus 3mg", cat: "Nicotine Pouch", brand: "Swedish Match",
      sku: "ZN-CIT-3", baseUnit: "Can", casePrice: 2860, cost: 1990,
      onHand: 74, reorder: 40, par: 140, sold30: 97, status: "ok" },
    { id: "P-4410", name: "Swisher Sweets Original", cat: "Cigars", brand: "Swisher Intl.",
      sku: "SW-ORG-BOX", baseUnit: "Box", casePrice: 1640, cost: 1080,
      onHand: 96, reorder: 40, par: 160, sold30: 61, status: "ok" },
    { id: "P-4415", name: "Black & Mild Wood Tip", cat: "Cigars", brand: "Middleton",
      sku: "BM-WD-BOX", baseUnit: "Box", casePrice: 1720, cost: 1180,
      onHand: 28, reorder: 35, par: 140, sold30: 53, status: "low" },
    { id: "P-5500", name: "Juul Virginia Tobacco", cat: "Vapor", brand: "Juul Labs",
      sku: "JL-VA-PK", baseUnit: "Can", casePrice: 3120, cost: 2280,
      onHand: 64, reorder: 30, par: 120, sold30: 44, status: "ok" },
    { id: "P-5512", name: "Elf Bar BC5000 Blue Razz", cat: "Vapor", brand: "Elf Bar",
      sku: "EB-5K-BLU", baseUnit: "Can", casePrice: 2740, cost: 1820,
      onHand: 142, reorder: 50, par: 200, sold30: 168, status: "ok" },
    { id: "P-6601", name: "Bic Lighter Tray", cat: "Accessories", brand: "Bic",
      sku: "BC-LTR-50", baseUnit: "Box", casePrice: 740, cost: 410,
      onHand: 211, reorder: 60, par: 300, sold30: 119, status: "ok" },
  ];

  // ---- Customers -----------------------------------------------
  const customers = [
    { id: "C-201", name: "Eastside Smoke & Vape", contact: "Raj Patel", type: "Retailer",
      city: "Trenton, NJ", phone: "(609) 555-0142", terms: "Net 15",
      balance: 8420, overdue: 0, limit: 15000, since: "2021", lastOrder: "2d ago", ytd: 142800, rep: "M. Alvarez", risk: "low" },
    { id: "C-202", name: "Liberty Gas & Convenience", contact: "Sam Cho", type: "C-Store",
      city: "Newark, NJ", phone: "(973) 555-0188", terms: "Net 30",
      balance: 21340, overdue: 6200, limit: 25000, since: "2019", lastOrder: "1d ago", ytd: 318400, rep: "M. Alvarez", risk: "med" },
    { id: "C-203", name: "Corner Mart 24/7", contact: "Dana Reyes", type: "C-Store",
      city: "Elizabeth, NJ", phone: "(908) 555-0119", terms: "Net 15",
      balance: 14860, overdue: 14860, limit: 18000, since: "2020", lastOrder: "9d ago", ytd: 96200, rep: "T. Okafor", risk: "high" },
    { id: "C-204", name: "Highland Wholesale Club", contact: "Omar Haddad", type: "Wholesaler",
      city: "Paterson, NJ", phone: "(862) 555-0173", terms: "Net 30",
      balance: 47200, overdue: 0, limit: 60000, since: "2018", lastOrder: "Today", ytd: 612000, rep: "M. Alvarez", risk: "low" },
    { id: "C-205", name: "Quick Stop Mini Market", contact: "Lena Brooks", type: "Retailer",
      city: "Camden, NJ", phone: "(856) 555-0150", terms: "COD",
      balance: 0, overdue: 0, limit: 8000, since: "2022", lastOrder: "4d ago", ytd: 54300, rep: "T. Okafor", risk: "low" },
    { id: "C-206", name: "Sunrise Deli & Grocery", contact: "Victor Nunez", type: "Retailer",
      city: "Jersey City, NJ", phone: "(201) 555-0166", terms: "Net 15",
      balance: 6730, overdue: 1920, limit: 12000, since: "2021", lastOrder: "6d ago", ytd: 88900, rep: "T. Okafor", risk: "med" },
    { id: "C-207", name: "Metro Tobacco Outlet", contact: "Priya Singh", type: "Retailer",
      city: "Edison, NJ", phone: "(732) 555-0134", terms: "Net 30",
      balance: 18900, overdue: 0, limit: 30000, since: "2017", lastOrder: "3d ago", ytd: 274500, rep: "M. Alvarez", risk: "low" },
    { id: "C-208", name: "Bayview Convenience", contact: "Frank Russo", type: "C-Store",
      city: "Bayonne, NJ", phone: "(201) 555-0177", terms: "Net 15",
      balance: 11240, overdue: 3400, limit: 16000, since: "2020", lastOrder: "5d ago", ytd: 134200, rep: "T. Okafor", risk: "med" },
  ];

  // ---- Shipments (inbound) -------------------------------------
  const shipments = [
    { id: "SH-3391", supplier: "Philip Morris USA", eta: "Today, 2:00 PM", status: "arriving",
      lines: 8, cases: 64, value: 184200, carrier: "PMUSA Freight", po: "PO-88412", dock: "Bay 2" },
    { id: "SH-3390", supplier: "Swedish Match Dist.", eta: "Arrived 9:12 AM", status: "verifying",
      lines: 5, cases: 38, value: 96400, carrier: "Old Dominion", po: "PO-88410", dock: "Bay 1" },
    { id: "SH-3388", supplier: "RJ Reynolds Trading", eta: "Tomorrow, 11 AM", status: "in_transit",
      lines: 6, cases: 52, value: 142800, carrier: "XPO Logistics", po: "PO-88401", dock: "—" },
    { id: "SH-3385", supplier: "Swisher Intl.", eta: "Jun 12", status: "in_transit",
      lines: 4, cases: 30, value: 51200, carrier: "Estes Express", po: "PO-88388", dock: "—" },
    { id: "SH-3380", supplier: "US Smokeless Tobacco", eta: "Received Jun 6", status: "received",
      lines: 7, cases: 44, value: 88600, carrier: "Old Dominion", po: "PO-88370", dock: "Bay 1" },
    { id: "SH-3377", supplier: "Elf Bar Wholesale", eta: "Received Jun 4", status: "received",
      lines: 3, cases: 60, value: 109800, carrier: "FedEx Freight", po: "PO-88361", dock: "Bay 3" },
    { id: "SH-3375", supplier: "ITG Brands", eta: "Received Jun 3", status: "received",
      lines: 5, cases: 40, value: 96200, carrier: "XPO Logistics", po: "PO-88355", dock: "Bay 2" },
  ];

  const shipmentLines = [
    { product: "Zyn Cool Mint 6mg",    sku: "ZN-CLM-6",   expected: 12, received: 12, unit: "Case", state: "ok" },
    { product: "Zyn Citrus 3mg",       sku: "ZN-CIT-3",   expected: 10, received: 10, unit: "Case", state: "ok" },
    { product: "Grizzly Wintergreen",  sku: "GZ-WNT-CAN", expected: 8,  received: 6,  unit: "Case", state: "short" },
    { product: "Copenhagen Long Cut",  sku: "CP-LNG-CAN", expected: 6,  received: 6,  unit: "Case", state: "ok" },
    { product: "Bic Lighter Tray",     sku: "BC-LTR-50",  expected: 2,  received: 0,  unit: "Case", state: "pending" },
  ];

  // ---- Invoices / Sales Records --------------------------------
  const invoices = [
    { id: "INV-7741", customer: "Highland Wholesale Club",  cid: "C-204", date: "Jun 10", due: "Jul 10", total: 24180, status: "paid",    items: 6, rep: "M. Alvarez" },
    { id: "INV-7740", customer: "Liberty Gas & Convenience",cid: "C-202", date: "Jun 10", due: "Jul 10", total: 8940,  status: "sent",    items: 4, rep: "M. Alvarez" },
    { id: "INV-7738", customer: "Metro Tobacco Outlet",     cid: "C-207", date: "Jun 9",  due: "Jul 9",  total: 12650, status: "sent",    items: 5, rep: "M. Alvarez" },
    { id: "INV-7736", customer: "Corner Mart 24/7",         cid: "C-203", date: "May 24", due: "Jun 8",  total: 14860, status: "overdue", items: 7, rep: "T. Okafor" },
    { id: "INV-7733", customer: "Eastside Smoke & Vape",    cid: "C-201", date: "Jun 8",  due: "Jun 23", total: 8420,  status: "sent",    items: 3, rep: "M. Alvarez" },
    { id: "INV-7731", customer: "Bayview Convenience",      cid: "C-208", date: "Jun 7",  due: "Jun 22", total: 5610,  status: "partial", items: 4, rep: "T. Okafor" },
    { id: "INV-7728", customer: "Quick Stop Mini Market",   cid: "C-205", date: "Jun 6",  due: "Jun 6",  total: 3240,  status: "paid",    items: 2, rep: "T. Okafor" },
    { id: "INV-7725", customer: "Sunrise Deli & Grocery",   cid: "C-206", date: "Jun 4",  due: "Jun 19", total: 6730,  status: "partial", items: 5, rep: "T. Okafor" },
    { id: "INV-7722", customer: "Highland Wholesale Club",  cid: "C-204", date: "Jun 2",  due: "Jul 2",  total: 23020, status: "paid",    items: 8, rep: "M. Alvarez" },
  ];

  const invoiceLines = [
    { product: "Marlboro Gold",          sku: "MB-GLD-200", unit: "Case", qty: 3, price: 4250 },
    { product: "Newport Menthol",        sku: "NP-MEN-200", unit: "Case", qty: 2, price: 4180 },
    { product: "Zyn Cool Mint 6mg",      sku: "ZN-CLM-6",   unit: "Box",  qty: 6, price: 286  },
    { product: "Elf Bar BC5000 Blue Razz",sku: "EB-5K-BLU", unit: "Box",  qty: 4, price: 274  },
  ];

  // ---- KPIs ----------------------------------------------------
  const kpis = {
    revenue: 318420, revenueTrend: 12.4,
    profit: 86240,   profitTrend: 8.1, margin: 27.1,
    invValue: 742800, invTrend: -3.2,
    balances: 128690, overdue: 26380,
    ordersToday: 14, casesOut: 286,
  };

  const revSeries    = [58,61,57,64,69,66,72,70,76,81,79,86].map(v => v * 1000);
  const profitSeries = [14,16,15,17,19,18,20,19,21,23,22,24].map(v => v * 1000);
  const cashflow = [
    { m: "Jan", in: 248, out: 196 }, { m: "Feb", in: 262, out: 204 },
    { m: "Mar", in: 271, out: 212 }, { m: "Apr", in: 289, out: 221 },
    { m: "May", in: 304, out: 233 }, { m: "Jun", in: 318, out: 241 },
  ];
  const categoryMix = [
    { name: "Cigarettes",     val: 142, color: "#5b8def" },
    { name: "Nicotine Pouch", val: 78,  color: "#c8893a" },
    { name: "Vapor",          val: 54,  color: "#c08bf0" },
    { name: "Smokeless",      val: 31,  color: "#4ab87a" },
    { name: "Cigars",         val: 13,  color: "#4fc4cf" },
  ];
  const topProducts = [
    { name: "Elf Bar BC5000 Blue Razz", rev: 46200, units: 168, trend: 14 },
    { name: "Zyn Cool Mint 6mg",        rev: 37800, units: 132, trend: 9  },
    { name: "Marlboro Gold",            rev: 34000, units: 96,  trend: 4  },
    { name: "Zyn Citrus 3mg",           rev: 27700, units: 97,  trend: 6  },
    { name: "Newport Menthol",          rev: 24600, units: 88,  trend: -2 },
  ];
  const activity = [
    { who: "M. Alvarez", av: "av-1", act: "created invoice", obj: "INV-7740",          meta: "Liberty Gas · $8,940",       time: "12m" },
    { who: "Derek V.",   av: "av-3", act: "received shipment",obj: "SH-3380",           meta: "44 cases · US Smokeless",    time: "1h" },
    { who: "System",     av: "av-2", act: "flagged low stock", obj: "Grizzly Wintergreen",meta: "9 cans · below reorder",  time: "2h" },
    { who: "Highland WC",av: "av-5", act: "paid",              obj: "INV-7741",          meta: "$24,180 · ACH",             time: "3h" },
    { who: "T. Okafor",  av: "av-6", act: "created invoice",   obj: "INV-7736",          meta: "Corner Mart · $14,860",     time: "5h" },
  ];

  window.DATA = {
    UNITS, LADDER, CASE_TO,
    products, customers, shipments, shipmentLines,
    invoices, invoiceLines,
    kpis, revSeries, profitSeries, cashflow, categoryMix, topProducts, activity,
  };
})();
