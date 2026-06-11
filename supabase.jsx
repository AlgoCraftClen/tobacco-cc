/* ============================================================
   SUPABASE — client + CRUD helpers for CC Tobacco OS
   ============================================================ */
(function () {
  const { createClient } = window.supabase;

  const SB = createClient(
    "https://njpkqemgpbstrbsaxpbz.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcGtxZW1ncGJzdHJic2F4cGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjc3NDYsImV4cCI6MjA5NjcwMzc0Nn0.IKEqP0XW7hcVi-p65hUTyS2pApv7gZLt2dlMiwKbuX8"
  );

  /* ---- Products ------------------------------------------ */
  function rowToProduct(r) {
    return {
      id: r.id, name: r.name, brand: r.brand || "—",
      cat: r.cat || "Grizzly", sku: r.sku || "",
      baseUnit: r.base_unit || "Case",
      casePrice: Number(r.case_price) || 0,
      cost: Number(r.cost) || 0,
      onHand: Number(r.on_hand) || 0,
      reorder: Number(r.reorder) || 0,
      par: Number(r.par) || 0,
      sold30: Number(r.sold_30) || 0,
      status: r.status || "ok",
    };
  }
  function productToRow(p) {
    return {
      id: p.id, name: p.name, brand: p.brand || "",
      cat: p.cat || "Cigarettes", sku: p.sku || "",
      base_unit: p.baseUnit || "Case",
      case_price: p.casePrice || 0,
      cost: p.cost || 0,
      on_hand: p.onHand || 0,
      reorder: p.reorder || 0,
      par: p.par || 0,
      sold_30: p.sold30 || 0,
      status: p.status || "ok",
    };
  }

  /* ---- Customers ----------------------------------------- */
  function rowToCustomer(r) {
    return {
      id: r.id, name: r.name, contact: r.contact || "—",
      type: r.type || "Retailer", city: r.city || "—",
      phone: r.phone || "—", terms: r.terms || "Net 15",
      balance: Number(r.balance) || 0,
      overdue: Number(r.overdue) || 0,
      limit: Number(r.credit_limit) || 0,
      since: r.since || "", lastOrder: r.last_order || "—",
      ytd: Number(r.ytd) || 0,
      rep: r.rep || "—", risk: r.risk || "low",
    };
  }
  function customerToRow(c) {
    return {
      id: c.id, name: c.name, contact: c.contact || "",
      type: c.type || "Retailer", city: c.city || "",
      phone: c.phone || "", terms: c.terms || "Net 15",
      balance: c.balance || 0, overdue: c.overdue || 0,
      credit_limit: c.limit || 0,
      since: c.since || "", last_order: c.lastOrder || "—",
      ytd: c.ytd || 0, rep: c.rep || "—", risk: c.risk || "low",
    };
  }

  /* ---- Shipments ----------------------------------------- */
  function rowToShipment(r) {
    return {
      id: r.id, supplier: r.supplier, po: r.po || "",
      carrier: r.carrier || "TBD",
      cases: Number(r.cases) || 0,
      value: Number(r.value) || 0,
      eta: r.eta || "TBD", dock: r.dock || "—",
      lines: Number(r.lines) || 0,
      status: r.status || "in_transit",
    };
  }
  function shipmentToRow(s) {
    return {
      id: s.id, supplier: s.supplier, po: s.po || "",
      carrier: s.carrier || "TBD",
      cases: s.cases || 0, value: s.value || 0,
      eta: s.eta || "TBD", dock: s.dock || "—",
      lines: s.lines || 0, status: s.status || "in_transit",
    };
  }

  /* ---- Invoices ------------------------------------------ */
  function rowToInvoice(r) {
    return {
      id: r.id, customer: r.customer || "", cid: r.cid || "",
      date: r.date || "", due: r.due || "",
      total: Number(r.total) || 0,
      status: r.status || "sent",
      items: Number(r.items) || 0, rep: r.rep || "—",
    };
  }
  function invoiceToRow(i) {
    return {
      id: i.id, customer: i.customer || "", cid: i.cid || "",
      date: i.date || "", due: i.due || "",
      total: i.total || 0, status: i.status || "sent",
      items: i.items || 0, rep: i.rep || "—",
    };
  }

  /* ---- Public API ---------------------------------------- */
  window.DB = {
    products: {
      list: async () => {
        const { data, error } = await SB.from("products").select("*").order("created_at", { ascending: false });
        if (error) console.error("products.list:", error);
        return (data || []).map(rowToProduct);
      },
      insert: async (p) => {
        const { error } = await SB.from("products").insert(productToRow(p));
        if (error) console.error("products.insert:", error);
      },
      delete: async (id) => {
        const { error } = await SB.from("products").delete().eq("id", id);
        if (error) console.error("products.delete:", error);
      },
      update: async (id, fields) => {
        const { error } = await SB.from("products").update(fields).eq("id", id);
        if (error) console.error("products.update:", error);
      },
      save: async (p) => {
        const { error } = await SB.from("products").update(productToRow(p)).eq("id", p.id);
        if (error) console.error("products.save:", error);
      },
    },
    customers: {
      list: async () => {
        const { data, error } = await SB.from("customers").select("*").order("created_at", { ascending: false });
        if (error) console.error("customers.list:", error);
        return (data || []).map(rowToCustomer);
      },
      insert: async (c) => {
        const { error } = await SB.from("customers").insert(customerToRow(c));
        if (error) console.error("customers.insert:", error);
      },
      delete: async (id) => {
        const { error } = await SB.from("customers").delete().eq("id", id);
        if (error) console.error("customers.delete:", error);
      },
    },
    shipments: {
      list: async () => {
        const { data, error } = await SB.from("shipments").select("*").order("created_at", { ascending: false });
        if (error) console.error("shipments.list:", error);
        return (data || []).map(rowToShipment);
      },
      insert: async (s) => {
        const { error } = await SB.from("shipments").insert(shipmentToRow(s));
        if (error) console.error("shipments.insert:", error);
      },
      delete: async (id) => {
        const { error } = await SB.from("shipments").delete().eq("id", id);
        if (error) console.error("shipments.delete:", error);
      },
      update: async (id, fields) => {
        const { error } = await SB.from("shipments").update(fields).eq("id", id);
        if (error) console.error("shipments.update:", error);
      },
    },
    invoices: {
      list: async () => {
        const { data, error } = await SB.from("invoices").select("*").order("created_at", { ascending: false });
        if (error) console.error("invoices.list:", error);
        return (data || []).map(rowToInvoice);
      },
      insert: async (i) => {
        const { error } = await SB.from("invoices").insert(invoiceToRow(i));
        if (error) console.error("invoices.insert:", error);
      },
      delete: async (id) => {
        const { error } = await SB.from("invoices").delete().eq("id", id);
        if (error) console.error("invoices.delete:", error);
      },
      update: async (id, fields) => {
        const { error } = await SB.from("invoices").update(fields).eq("id", id);
        if (error) console.error("invoices.update:", error);
      },
    },
  };
})();
