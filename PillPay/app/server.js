// app/server.js
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ================= IN-MEMORY DATA =================

// demo users (you can add examiner later)
let users = [
  {
    id: 1,
    name: "Mohak",
    email: "mohak@pillpay.com",
    password: "user123",
    mainBalance: 20000,
    walletBalance: 0,
  },
  {
    id: 2,
    name: "Examiner Madam",
    email: "examiner@college.com",
    password: "exam123",
    mainBalance: 20000,
    walletBalance: 0,
  },
];

// demo medicines
let medicines = [
  { id: 1, name: "Paracetamol 500mg", price: 20, stock: 100 },
  { id: 2, name: "Dolo 650", price: 25, stock: 80 },
  { id: 3, name: "Ibuprofen 400mg", price: 30, stock: 60 },
];

// wallet transactions and orders
let walletTxns = []; // { id, userId, type, amount, description, date }
let orders = [];     // { id, userId, medicineId, quantity, address, reminderDate, status }
let notifications = []; // { id, userId, fromRole, message, date }

// simple id counters
let nextMedId = medicines.length + 1;
let nextTxnId = 1;
let nextOrderId = 1;
let nextNotifId = 1;

// ================= ADMIN AUTH =====================

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;

  if (email === "admin@pillpay.com" && password === "admin123") {
    return res.json({ ok: true, role: "admin" });
  }
  return res.status(401).json({ ok: false, message: "Invalid credentials" });
});

// ================= ADMIN MEDICINES ===============

// get all medicines
app.get("/api/admin/medicines", (req, res) => {
  return res.json(medicines);
});

// create medicine
app.post("/api/admin/medicines", (req, res) => {
  const { name, price, stock } = req.body;
  if (!name || price == null || stock == null) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const med = {
    id: nextMedId++,
    name,
    price: Number(price),
    stock: Number(stock),
  };
  medicines.push(med);
  return res.json(med);
});

// delete medicine
app.delete("/api/admin/medicines/:id", (req, res) => {
  const id = Number(req.params.id);
  const before = medicines.length;
  medicines = medicines.filter((m) => m.id !== id);
  const deleted = before !== medicines.length;
  return res.json({ ok: deleted });
});

// =============== USER APIS (BASIC, for later) ===============

// demo user login
app.post("/api/user/login", (req, res) => {
  const { email, password } = req.body;
  const u = users.find((x) => x.email === email && x.password === password);
  if (!u) return res.status(401).json({ ok: false, message: "Invalid credentials" });
  return res.json({
    ok: true,
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      mainBalance: u.mainBalance,
      walletBalance: u.walletBalance,
    },
  });
});

// get wallet + balances for a user
app.get("/api/user/:id/wallet", (req, res) => {
  const userId = Number(req.params.id);
  const u = users.find((x) => x.id === userId);
  if (!u) return res.status(404).json({ error: "User not found" });

  const txns = walletTxns.filter((t) => t.userId === userId);
  return res.json({
    mainBalance: u.mainBalance,
    walletBalance: u.walletBalance,
    transactions: txns,
  });
});

// add money to wallet
app.post("/api/user/:id/wallet/add", (req, res) => {
  const userId = Number(req.params.id);
  const { amount } = req.body;
  const amt = Number(amount);
  const u = users.find((x) => x.id === userId);
  if (!u) return res.status(404).json({ error: "User not found" });
  if (!amt || amt <= 0) return res.status(400).json({ error: "Invalid amount" });
  if (u.mainBalance < amt) return res.status(400).json({ error: "Not enough main balance" });

  u.mainBalance -= amt;
  u.walletBalance += amt;

  const txn = {
    id: nextTxnId++,
    userId,
    type: "credit",
    amount: amt,
    description: "Added to e-wallet",
    date: new Date().toISOString(),
  };
  walletTxns.push(txn);

  return res.json({
    mainBalance: u.mainBalance,
    walletBalance: u.walletBalance,
    transaction: txn,
  });
});

// create order from user
app.post("/api/user/:id/orders", (req, res) => {
  const userId = Number(req.params.id);
  const { medicineId, quantity, address, reminderDate } = req.body;
  const qty = Number(quantity);
  const u = users.find((x) => x.id === userId);
  const med = medicines.find((m) => m.id === Number(medicineId));

  if (!u || !med) return res.status(400).json({ error: "User or medicine not found" });
  if (qty < 10) return res.status(400).json({ error: "Quantity must be at least 10" });

  const order = {
    id: nextOrderId++,
    userId,
    medicineId: med.id,
    quantity: qty,
    address,
    reminderDate,
    status: "Pending",
  };
  orders.push(order);

  const notif = {
    id: nextNotifId++,
    userId,
    fromRole: "user",
    message: `New order #${order.id} for ${med.name} x ${qty}`,
    date: new Date().toISOString(),
  };
  notifications.push(notif);

  return res.json({ ok: true, order });
});

// get orders for a user
app.get("/api/user/:id/orders", (req, res) => {
  const userId = Number(req.params.id);
  const list = orders.filter((o) => o.userId === userId);
  return res.json(list);
});

// ================= ADMIN ORDERS / WALLET ================

// admin: get all orders with basic user + medicine info
app.get("/api/admin/orders", (req, res) => {
  const full = orders.map((o) => {
    const u = users.find((x) => x.id === o.userId);
    const m = medicines.find((x) => x.id === o.medicineId);
    return {
      ...o,
      userName: u ? u.name : "",
      userEmail: u ? u.email : "",
      medicineName: m ? m.name : "",
    };
  });
  return res.json(full);
});

// admin: approve order and auto-deduct from wallet
app.post("/api/admin/orders/:id/approve", (req, res) => {
  const id = Number(req.params.id);
  const order = orders.find((o) => o.id === id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const u = users.find((x) => x.id === order.userId);
  const m = medicines.find((x) => x.id === order.medicineId);
  if (!u || !m) return res.status(400).json({ error: "User or medicine missing" });

  const amount = m.price * order.quantity;
  if (u.walletBalance < amount) {
    return res.status(400).json({ error: "Not enough wallet balance" });
  }

  u.walletBalance -= amount;

  const txn = {
    id: nextTxnId++,
    userId: u.id,
    type: "debit",
    amount,
    description: `Order #${order.id} for ${m.name}`,
    date: new Date().toISOString(),
  };
  walletTxns.push(txn);

  order.status = "Approved";

  const notif = {
    id: nextNotifId++,
    userId: u.id,
    fromRole: "admin",
    message: `Your order #${order.id} is approved`,
    date: new Date().toISOString(),
  };
  notifications.push(notif);

  return res.json({ ok: true, order, txn });
});

// admin: all wallet transactions
app.get("/api/admin/transactions", (req, res) => {
  const full = walletTxns.map((t) => {
    const u = users.find((x) => x.id === t.userId);
    return { ...t, userName: u ? u.name : "", userEmail: u ? u.email : "" };
  });
  return res.json(full);
});

// user notifications
app.get("/api/user/:id/notifications", (req, res) => {
  const userId = Number(req.params.id);
  const list = notifications.filter((n) => n.userId === userId);
  return res.json(list);
});

// admin notifications (from all users)
app.get("/api/admin/notifications", (req, res) => {
  const list = notifications.filter((n) => n.fromRole === "user");
  return res.json(list);
});

// =================== START SERVER ===================
const PORT = 4000;
app.listen(PORT, () => {
  console.log("PillPay API (in-memory) running at http://localhost:" + PORT);
});
