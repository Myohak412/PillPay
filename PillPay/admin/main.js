// admin/main.js

// ============ CONFIG ============
const API_BASE = "http://localhost:4000/api/admin";

// ============ AUTH ==============
const ADMIN_DEMO = {
  email: "admin@pillpay.com",
  password: "admin123",
};

function adminLogin() {
  const email = document.getElementById("admin-email").value;
  const pwd = document.getElementById("admin-password").value;

  if (email === ADMIN_DEMO.email && pwd === ADMIN_DEMO.password) {
    localStorage.setItem(
      "pillpay_admin_session",
      JSON.stringify({ loggedIn: true })
    );
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid admin credentials");
  }
}

function adminCheckAuth() {
  const s = JSON.parse(localStorage.getItem("pillpay_admin_session"));
  const current = location.pathname.split("/").pop();
  if (!s?.loggedIn && current !== "login.html") {
    window.location.href = "login.html";
  }
}

function adminLogout() {
  localStorage.removeItem("pillpay_admin_session");
  window.location.href = "login.html";
}

// small helper
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

// ============ DASHBOARD =========
async function renderAdminDashboard() {
  const meds = await fetchJSON(`${API_BASE}/medicines`).catch(() => []);
  const orders = getDemoOrders();
  const txns = getDemoTransactions();

  const medCount = meds.length || 0;
  const orderCount = orders.length || 0;
  const revenue = txns
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + t.amount, 0);

  const mEl = document.getElementById("admin-medicines-count");
  const oEl = document.getElementById("admin-orders-count");
  const rEl = document.getElementById("admin-revenue");
  if (mEl) mEl.textContent = medCount;
  if (oEl) oEl.textContent = orderCount;
  if (rEl) rEl.textContent = "₹" + revenue;
}

// ============ MEDICINES (DB) ====
async function renderMedicines() {
  const box = document.getElementById("medicines-list");
  if (!box) return;

  let meds = [];
  try {
    meds = await fetchJSON(`${API_BASE}/medicines`);
    console.log("Medicines from API:", meds);
  } catch (e) {
    console.error(e);
  }

  if (!Array.isArray(meds) || meds.length === 0) {
    box.innerHTML =
      '<p class="text-white/60 text-sm">No medicines yet. Add one above.</p>';
    return;
  }

  box.innerHTML = meds
    .map(
      (m) => `
      <div class="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
        <div>
          <p class="text-white font-medium">${m.name}</p>
          <p class="text-white/60 text-xs">Price: ₹${m.price} • Stock: ${m.stock}</p>
          <p class="text-white/30 text-[10px] mt-1">ID: ${m.id}</p>
        </div>
        <button onclick="deleteMedicine('${m.id}')"" class="text-red-400 text-xs hover:text-red-300">
          Remove
        </button>
      </div>`
    )
    .join("");
}

async function addMedicine() {
  const name = document.getElementById("med-name").value;
  const price = Number(document.getElementById("med-price").value);
  const stock = Number(document.getElementById("med-stock").value);

  if (!name || !price || !stock) {
    alert("All fields required");
    return;
  }

  await fetchJSON(`${API_BASE}/medicines`, {
    method: "POST",
    body: JSON.stringify({ name, price, stock }),
  });

  document.getElementById("med-name").value = "";
  document.getElementById("med-price").value = "";
  document.getElementById("med-stock").value = "";

  renderMedicines();
}

function seedDemoMedicines() {
  alert("Demo medicines are already in SurrealDB. Just click refresh.");
}

async function deleteMedicine(idPart) {
  await fetchJSON(`${API_BASE}/medicines/${idPart}`, { method: "DELETE" });
  renderMedicines();
}


// ============ ORDERS (DEMO) =====
function getDemoOrders() {
  return [
    { id: 101, user: "John Doe", amount: 230, status: "Pending" },
    { id: 102, user: "Sara Lee", amount: 480, status: "Shipped" },
  ];
}

function renderOrders() {
  const box = document.getElementById("orders-list");
  if (!box) return;

  const orders = getDemoOrders();
  box.innerHTML = orders
    .map(
      (o) => `
    <div class="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
      <div>
        <p class="text-white font-medium">Order #${o.id}</p>
        <p class="text-white/60 text-xs">${o.user} • ₹${o.amount}</p>
      </div>
      <span class="text-xs px-2 py-1 rounded-full ${
        o.status === "Pending"
          ? "bg-yellow-500/20 text-yellow-300"
          : "bg-blue-500/20 text-blue-300"
      }">${o.status}</span>
    </div>`
    )
    .join("");
}

// ============ TRANSACTIONS DEMO ==
function getDemoTransactions() {
  return [
    { id: 1, type: "credit", desc: "Order #101", amount: 230, date: "05 Dec 2025" },
    { id: 2, type: "credit", desc: "Order #102", amount: 480, date: "05 Dec 2025" },
  ];
}

function renderTransactions() {
  const box = document.getElementById("txn-list");
  if (!box) return;

  const txns = getDemoTransactions();
  box.innerHTML = txns
    .map(
      (t) => `
    <div class="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
      <div>
        <p class="text-white font-medium">${t.desc}</p>
        <p class="text-white/60 text-xs">${t.date}</p>
      </div>
      <div class="text-right">
        <p class="${
          t.type === "credit" ? "text-green-300" : "text-red-300"
        } font-semibold">
          ${t.type === "credit" ? "+" : "-"}₹${t.amount}
        </p>
        <p class="text-white/40 text-[10px] uppercase">${t.type}</p>
      </div>
    </div>`
    )
    .join("");
}
