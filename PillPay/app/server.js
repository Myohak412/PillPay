// C:\mini-project-25\Sem-I\PillPayProject\PillPay\app\server.js
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// ----- SurrealDB config -----
const SURREAL_URL = "http://localhost:8000/sql";
const SURREAL_NS = "PillPay";
const SURREAL_DB = "PillPayDB";
const SURREAL_AUTH = "root:root";

// Generic SurrealDB query helper
async function surrealQuery(query, vars = {}) {
  const res = await fetch(SURREAL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Basic " + Buffer.from(SURREAL_AUTH).toString("base64"),
      NS: SURREAL_NS,
      DB: SURREAL_DB,
    },
    body: JSON.stringify({ query, vars }),
  });

  const data = await res.json(); // SurrealDB HTTP /sql returns array of results [web:59]

  console.log("RAW Surreal response:", JSON.stringify(data));

  if (!Array.isArray(data) || !data[0]) {
    throw new Error("Bad SurrealDB response");
  }

  return data[0].result || [];
}

// ============ ADMIN MEDICINES API ============

// GET all medicines
app.get("/api/admin/medicines", async (req, res) => {
  try {
    const rows = await surrealQuery("SELECT * FROM medicine;");
    console.log("ROWS from Surreal:", rows);
    res.json(rows || []); // frontend expects an array
  } catch (e) {
    console.error("GET /api/admin/medicines error:", e);
    res.status(500).json({ error: "Failed to fetch medicines" });
  }
});

// CREATE medicine
app.post("/api/admin/medicines", async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    const rows = await surrealQuery(
      "CREATE medicine CONTENT { name: $name, price: $price, stock: $stock };",
      { name, price, stock }
    );
    res.json(rows);
  } catch (e) {
    console.error("POST /api/admin/medicines error:", e);
    res.status(500).json({ error: "Failed to create medicine" });
  }
});

// DELETE medicine
app.delete("/api/admin/medicines/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await surrealQuery(
      "DELETE type::thing('medicine', $id);",
      { id }
    );
    res.json(rows);
  } catch (e) {
    console.error("DELETE /api/admin/medicines/:id error:", e);
    res.status(500).json({ error: "Failed to delete medicine" });
  }
});

// ============ SIMPLE ADMIN LOGIN (DEMO) ============

app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;

  // Hardcoded admin for now
  if (email === "admin@pillpay.com" && password === "admin123") {
    return res.json({ ok: true, role: "admin" });
  }

  return res.status(401).json({ ok: false, message: "Invalid credentials" });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log("PillPay API running at http://localhost:" + PORT);
});
