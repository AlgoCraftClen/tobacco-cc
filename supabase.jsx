/* ============================================================
   SUPABASE — client + CRUD for CC Tobacco OS (mobile)
   Tables: shipments_v2 · purchases
   ============================================================ */
(function () {
  const { createClient } = window.supabase;

  const SB = createClient(
    "https://njpkqemgpbstrbsaxpbz.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qcGtxZW1ncGJzdHJic2F4cGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExMjc3NDYsImV4cCI6MjA5NjcwMzc0Nn0.IKEqP0XW7hcVi-p65hUTyS2pApv7gZLt2dlMiwKbuX8"
  );

  /* ---- Shipments (shipments_v2) -------------------------- */
  function rowToShipment(r) {
    return {
      id: r.id,
      brand: r.brand || "Grizzly",
      boxes: Number(r.boxes) || 0,
      cases: Number(r.cases) || 0,
      rolls: Number(r.rolls) || 0,
      cans:  Number(r.cans)  || 0,
      pricePerCan: Number(r.price_per_can) || 0,
      subtotal:    Number(r.subtotal) || 0,
      miscCost:    Number(r.misc_cost) || 0,
      miscDesc:    r.misc_desc || "",
      grandTotal:  Number(r.grand_total) || 0,
      sender:   r.sender   || "Clanny",
      receiver: r.receiver || "Clenny",
      status:   r.status   || "pending",
      notes:    r.notes    || "",
      createdAt:  r.created_at  || null,
      receivedAt: r.received_at || null,
      saleTotal:       Number(r.sale_total) || 0,
      salePricePerCan: Number(r.sale_price_per_can) || 0,
      soldAt:          r.sold_at || null,
    };
  }
  function shipmentToRow(s) {
    return {
      brand: s.brand || "Grizzly",
      boxes: s.boxes || 0,
      cases: s.cases || 0,
      rolls: s.rolls || 0,
      cans:  s.cans  || 0,
      price_per_can: s.pricePerCan || 0,
      subtotal:    s.subtotal || 0,
      misc_cost:   s.miscCost || 0,
      misc_desc:   s.miscDesc || "",
      grand_total: s.grandTotal || 0,
      sender:   s.sender   || "Clanny",
      receiver: s.receiver || "Clenny",
      status:   s.status   || "pending",
      notes:    s.notes    || "",
    };
  }

  /* ---- Purchases ----------------------------------------- */
  function rowToPurchase(r) {
    return {
      id: r.id,
      partner: r.partner || "Clanny",
      brand:   r.brand   || "Grizzly",
      cans:    Number(r.cans) || 0,
      pricePerCan: Number(r.price_per_can) || 0,
      total:   Number(r.total) || 0,
      createdAt: r.created_at || null,
    };
  }
  function purchaseToRow(p) {
    return {
      partner: p.partner || "Clanny",
      brand:   p.brand   || "Grizzly",
      cans:    p.cans    || 0,
      price_per_can: p.pricePerCan || 0,
      total:   p.total   || 0,
    };
  }

  /* ---- Contributions ------------------------------------- */
  function rowToContribution(r) {
    return {
      id: r.id, partner: r.partner || "Clanny",
      amount: Number(r.amount) || 0,
      description: r.description || "",
      createdAt: r.created_at || null,
    };
  }
  function contributionToRow(c) {
    return { partner: c.partner || "Clanny", amount: c.amount || 0, description: c.description || "" };
  }

  /* ---- Expenses ------------------------------------------ */
  function rowToExpense(r) {
    return {
      id: r.id, partner: r.partner || "Clanny",
      amount: Number(r.amount) || 0,
      category: r.category || "",
      description: r.description || "",
      shipmentId: r.shipment_id || null,
      createdAt: r.created_at || null,
    };
  }
  function expenseToRow(e) {
    return {
      partner: e.partner || "Clanny", amount: e.amount || 0,
      category: e.category || "", description: e.description || "",
      shipment_id: e.shipmentId || null,
    };
  }

  /* ---- Public API ---------------------------------------- */
  window.DB = {
    shipments: {
      list: async () => {
        const { data, error } = await SB.from("shipments_v2").select("*").order("created_at", { ascending: false });
        if (error) { console.error("shipments.list:", error); return []; }
        return (data || []).map(rowToShipment);
      },
      insert: async (s) => {
        const { data, error } = await SB.from("shipments_v2").insert(shipmentToRow(s)).select().single();
        if (error) { console.error("shipments.insert:", error); throw error; }
        return rowToShipment(data);
      },
      update: async (id, fields) => {
        const { error } = await SB.from("shipments_v2").update(fields).eq("id", id);
        if (error) { console.error("shipments.update:", error); throw error; }
      },
      receive: async (id) => {
        const { error } = await SB.from("shipments_v2")
          .update({ status: "received", received_at: new Date().toISOString() }).eq("id", id);
        if (error) { console.error("shipments.receive:", error); throw error; }
      },
      dispute: async (id, note) => {
        const { error } = await SB.from("shipments_v2")
          .update({ status: "disputed", notes: note || "", received_at: new Date().toISOString() }).eq("id", id);
        if (error) { console.error("shipments.dispute:", error); throw error; }
      },
      recordSale: async (id, { salePricePerCan, saleTotal }) => {
        const { error } = await SB.from("shipments_v2")
          .update({ sale_price_per_can: salePricePerCan || 0, sale_total: saleTotal || 0, sold_at: new Date().toISOString() })
          .eq("id", id);
        if (error) { console.error("shipments.recordSale:", error); throw error; }
      },
      delete: async (id) => {
        const { error } = await SB.from("shipments_v2").delete().eq("id", id);
        if (error) { console.error("shipments.delete:", error); throw error; }
      },
    },
    purchases: {
      list: async () => {
        const { data, error } = await SB.from("purchases").select("*").order("created_at", { ascending: false });
        if (error) { console.error("purchases.list:", error); return []; }
        return (data || []).map(rowToPurchase);
      },
      insert: async (p) => {
        const { data, error } = await SB.from("purchases").insert(purchaseToRow(p)).select().single();
        if (error) { console.error("purchases.insert:", error); throw error; }
        return rowToPurchase(data);
      },
      delete: async (id) => {
        const { error } = await SB.from("purchases").delete().eq("id", id);
        if (error) { console.error("purchases.delete:", error); throw error; }
      },
    },
    contributions: {
      list: async () => {
        const { data, error } = await SB.from("contributions").select("*").order("created_at", { ascending: false });
        if (error) { console.error("contributions.list:", error); return []; }
        return (data || []).map(rowToContribution);
      },
      insert: async (c) => {
        const { data, error } = await SB.from("contributions").insert(contributionToRow(c)).select().single();
        if (error) { console.error("contributions.insert:", error); throw error; }
        return rowToContribution(data);
      },
      delete: async (id) => {
        const { error } = await SB.from("contributions").delete().eq("id", id);
        if (error) { console.error("contributions.delete:", error); throw error; }
      },
    },
    expenses: {
      list: async () => {
        const { data, error } = await SB.from("expenses").select("*").order("created_at", { ascending: false });
        if (error) { console.error("expenses.list:", error); return []; }
        return (data || []).map(rowToExpense);
      },
      insert: async (e) => {
        const { data, error } = await SB.from("expenses").insert(expenseToRow(e)).select().single();
        if (error) { console.error("expenses.insert:", error); throw error; }
        return rowToExpense(data);
      },
      delete: async (id) => {
        const { error } = await SB.from("expenses").delete().eq("id", id);
        if (error) { console.error("expenses.delete:", error); throw error; }
      },
    },
  };
})();
