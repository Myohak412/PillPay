const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // Import PostgreSQL driver

const app = express();
app.use(cors());
app.use(express.json());

// ================= DATABASE CONNECTION =================
// 
const pool = new Pool({
  user: "postgres",       // Default user
  host: "localhost",      // Localhost
  database: "pillpay",    // The DB name you created in pgAdmin
  password: "password",       // <--- CHANGE THIS TO YOUR PGADMIN PASSWORD
  port: 5432,             // Default port
});

// Test the connection when app starts
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  console.log("✅ Connected to PostgreSQL Database");
  release();
});

// ================= ADMIN AUTH =================
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  // Admin is still hardcoded for simplicity in this demo
  if (email === "admin@pillpay.com" && password === "admin123") {
    return res.json({ ok: true, role: "admin" });
  }
  return res.status(401).json({ ok: false, message: "Invalid credentials" });
});

// ================= ADMIN MEDICINES =================
// Get all medicines
app.get("/api/admin/medicines", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM medicines ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create medicine
app.post("/api/admin/medicines", async (req, res) => {
  const { name, price, stock } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO medicines (name, price, stock) VALUES ($1, $2, $3) RETURNING *",
      [name, price, stock]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete medicine
app.delete("/api/admin/medicines/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM medicines WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================= USER APIS =================



app.post("/api/user/signup", async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    // This query takes the examiner's input and saves it to the DB
    const result = await pool.query(
      "INSERT INTO users (name, email, password, phone, wallet_balance) VALUES ($1, $2, $3, $4, 0) RETURNING *",
      [name, email, password, phone]
    );
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation error
        res.status(400).json({ ok: false, message: "Email already exists!" });
    } else {
        res.status(500).json({ ok: false, message: "Database error" });
    }
  }
});
// User Login
app.post("/api/user/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND password = $2", 
      [email, password]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ ok: false, message: "Invalid credentials" });
    }

    const u = result.rows[0];
    res.json({
      ok: true,
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        // PostgreSQL returns decimals as strings sometimes, so we parseFloat
        walletBalance: parseFloat(u.wallet_balance) 
      },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get Wallet
app.get("/api/user/:id/wallet", async (req, res) => {
  try {
    const userRes = await pool.query("SELECT wallet_balance FROM users WHERE id = $1", [req.params.id]);
    const txnRes = await pool.query("SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC", [req.params.id]);
    
    if (userRes.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json({
      walletBalance: parseFloat(userRes.rows[0].wallet_balance),
      transactions: txnRes.rows,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add Money to Wallet
app.post("/api/user/:id/wallet/add", async (req, res) => {
  const userId = req.params.id;
  const { amount } = req.body;
  
  try {
    // 1. Update User Balance
    await pool.query(
      "UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2",
      [amount, userId]
    );

    // 2. Add Transaction Record
    const txnRes = await pool.query(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'credit', $2, 'Added to e-wallet') RETURNING *",
      [userId, amount]
    );

    // 3. Get updated balance
    const userRes = await pool.query("SELECT wallet_balance FROM users WHERE id = $1", [userId]);

    res.json({
      walletBalance: parseFloat(userRes.rows[0].wallet_balance),
      transaction: txnRes.rows[0],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================= NOTIFICATIONS =================

// Get Admin Notifications (Joined with User Name)
app.get("/api/admin/notifications", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, u.name as "userName" 
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.from_role = 'user' 
      ORDER BY n.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
app.post("/api/admin/orders/:id/approve", async (req, res) => {
  const orderId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Get Order details (Including address and medicine name)
    const orderRes = await client.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    const order = orderRes.rows[0];
    if (!order) throw new Error("Order not found");

    const amount = parseFloat(order.total_amount);

    // 2. Check and Deduct User Balance
    const userRes = await client.query("SELECT wallet_balance FROM users WHERE id = $1", [order.user_id]);
    const currentBalance = parseFloat(userRes.rows[0].wallet_balance);

    if (currentBalance < amount) {
        throw new Error("Insufficient funds in user wallet!");
    }

    await client.query("UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2", [amount, order.user_id]);

    // 3. Mark Order as Approved
    await client.query("UPDATE orders SET status = 'Approved' WHERE id = $1", [orderId]);

    // 4. Create the NOTIFICATION for the User (The message you wanted)
    const userMessage = `Payment of ₹${amount.toFixed(2)} deducted. Your order for ${order.medicine_name} is confirmed and will be delivered to: ${order.address}`;
    
    await client.query(
      "INSERT INTO notifications (user_id, from_role, message, order_id, status) VALUES ($1, 'admin', $2, $3, 'UNREAD')",
      [order.user_id, userMessage, orderId]
    );

    // 5. Add to Transactions table for user history
    await client.query(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'debit', $2, $3)",
      [order.user_id, amount, `Order #${orderId} Payment`]
    );

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get User Notifications
app.get("/api/user/:id/notifications", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM notifications WHERE user_id = $1 AND from_role = 'admin' ORDER BY created_at DESC", [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================= ORDERS =================

// Create Order
app.post("/api/user/:id/orders", async (req, res) => {
  const userId = req.params.id;
  const { medicineId, quantity, address, reminderDate } = req.body;

  try {
    // Get Medicine Info
    const medRes = await pool.query("SELECT * FROM medicines WHERE id = $1", [medicineId]);
    const med = medRes.rows[0];
    const total = med.price * quantity;

    // Create Order
    const orderRes = await pool.query(
      "INSERT INTO orders (user_id, medicine_id, medicine_name, quantity, total_amount, address, reminder_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending') RETURNING *",
      [userId, medicineId, med.name, quantity, total, address, reminderDate]
    );
    const order = orderRes.rows[0];

    // Create Notification for Admin
    await pool.query(
      "INSERT INTO notifications (user_id, from_role, message, order_id, status) VALUES ($1, 'user', $2, $3, 'UNREAD')",
      [userId, `New Order: ${med.name} x${quantity}`, order.id]
    );

    res.json({ ok: true, order });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get User Orders
app.get("/api/user/:id/orders", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC", [req.params.id]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================= ADMIN ORDERS & APPROVAL =================

// Get All Orders (Joined with User info)
app.get("/api/admin/orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, u.name as "userName", u.email as "userEmail"
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Approve Order
app.post("/api/admin/orders/:id/approve", async (req, res) => {
  const orderId = req.params.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Start Transaction

    // 1. Get Order & User
    const orderRes = await client.query("SELECT * FROM orders WHERE id = $1", [orderId]);
    const order = orderRes.rows[0];
    if (!order) throw new Error("Order not found");

    const userRes = await client.query("SELECT wallet_balance FROM users WHERE id = $1", [order.user_id]);
    const balance = parseFloat(userRes.rows[0].wallet_balance);
    const cost = parseFloat(order.total_amount);

    if (balance < cost) {
      throw new Error("User has insufficient wallet balance");
    }

    // 2. Deduct Money
    await client.query("UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2", [cost, order.user_id]);

    // 3. Mark Order Approved
    await client.query("UPDATE orders SET status = 'Approved' WHERE id = $1", [orderId]);

    // 4. Create Transaction Record
    await client.query(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'debit', $2, $3)",
      [order.user_id, cost, `Order #${orderId} Approved`]
    );

    // 5. Notify User
    await client.query(
      "INSERT INTO notifications (user_id, from_role, message, order_id) VALUES ($1, 'admin', $2, $3)",
      [order.user_id, `Your order #${orderId} has been approved and shipped.`, orderId]
    );

    await client.query('COMMIT'); // Save
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK'); // Undo if error
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Admin Transactions
app.get("/api/admin/transactions", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.name as "userName", u.email as "userEmail"
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ================= START SERVER =================
const PORT = 4000;
app.listen(PORT, () => {
  console.log("PillPay API (PostgreSQL) running at http://localhost:" + PORT);
});