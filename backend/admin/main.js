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
  try {
    // Fetch Medicines
    const medRes = await fetch(`${API_BASE}/medicines`);
    const meds = await medRes.json();
    
    // Fetch Orders
    const orderRes = await fetch(`${API_BASE}/orders`);
    const orders = await orderRes.json();

    // Calculate Stats
    const medCount = meds.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    
    // Calculate Revenue from Approved Orders
    const revenue = orders
      .filter(o => o.status === 'Approved' || o.status === 'Shipped')
      .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

    // Update UI
    if(document.getElementById("admin-medicines-count")) 
      document.getElementById("admin-medicines-count").textContent = medCount;
    if(document.getElementById("admin-orders-count")) 
      document.getElementById("admin-orders-count").textContent = pendingOrders;
    if(document.getElementById("admin-revenue")) 
      document.getElementById("admin-revenue").textContent = "₹" + revenue.toFixed(2);

  } catch (err) {
    console.error("Dashboard error:", err);
  }
}


// ============ MEDICINES (DB) ====
async function renderMedicines() {
  const box = document.getElementById("medicines-list");
  if (!box) return;

  try {
    const res = await fetch(`${API_BASE}/medicines`);
    const meds = await res.json();

    if (meds.length === 0) {
      box.innerHTML = '<p class="text-white/60 text-sm">No medicines found.</p>';
      return;
    }

    box.innerHTML = meds.map(m => `
      <div class="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
        <div>
          <p class="text-white font-medium">${m.name}</p>
          <p class="text-white/60 text-xs">
            Price: ₹${parseFloat(m.price).toFixed(2)} • Stock: ${m.stock}
          </p>
        </div>
        <button onclick="deleteMedicine(${m.id})" class="text-red-400 text-xs hover:text-red-300">
          Remove
        </button>
      </div>`).join("");
  } catch (e) {
    box.innerHTML = '<p class="text-red-400">Failed to load medicines.</p>';
  }
}async function addMedicine() {
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

// function renderOrders() {
//   const box = document.getElementById("orders-list");
//   if (!box) return;

//   const orders = getDemoOrders();
//   box.innerHTML = orders
//     .map(
//       (o) => `
//     <div class="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
//       <div>
//         <p class="text-white font-medium">Order #${o.id}</p>
//         <p class="text-white/60 text-xs">${o.user} • ₹${o.amount}</p>
//       </div>
//       <span class="text-xs px-2 py-1 rounded-full ${
//         o.status === "Pending"
//           ? "bg-yellow-500/20 text-yellow-300"
//           : "bg-blue-500/20 text-blue-300"
//       }">${o.status}</span>
//     </div>`
//     )
//     .join("");
// }
async function renderOrders() {
  const box = document.getElementById("orders-list");
  if (!box) return;

  try {
    const res = await fetch(`${API_BASE}/orders`);
    const orders = await res.json();

    if (orders.length === 0) {
      box.innerHTML = '<p class="text-white/60">No orders found.</p>';
      return;
    }

    box.innerHTML = orders.map(o => `
      <div class="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10 mb-2">
        <div>
          <p class="text-white font-medium">Order #${o.id}</p>
          <p class="text-white/60 text-xs">${o.userName} • ${o.medicineName} (x${o.quantity})</p>
          <p class="text-white/80 font-bold text-sm">₹${o.amount}</p>
        </div>
        <div class="text-right">
          <span class="block text-xs px-2 py-1 rounded-full mb-2 ${
            o.status === "Pending" ? "bg-yellow-500/20 text-yellow-300" : "bg-blue-500/20 text-blue-300"
          }">${o.status}</span>
          
          ${o.status === 'Pending' ? `
            <button onclick="approveOrder(${o.id})" class="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-500">
              Approve
            </button>` : ''}
        </div>
      </div>
    `).join("");

  } catch (err) {
    console.error(err);
    box.innerHTML = '<p class="text-red-400">Failed to load orders.</p>';
  }
}

// --- APPROVE ORDER FUNCTION ---
async function approveOrder(id) {
    if(!confirm("Approve this order? This will deduct money from user's wallet.")) return;

    try {
        const res = await fetch(`${API_BASE}/orders/${id}/approve`, { method: 'POST' });
        const data = await res.json();
        
        if(res.ok) {
            alert("Order Approved & Wallet Deducted!");
            renderOrders(); // Refresh list
        } else {
            alert("Error: " + data.error);
        }
    } catch(e) {
        alert("Network error");
    }
}
// ============ TRANSACTIONS DEMO ==
function getDemoTransactions() {
  return [
    { id: 1, type: "credit", desc: "Order #101", amount: 230, date: "05 Dec 2025" },
    { id: 2, type: "credit", desc: "Order #102", amount: 480, date: "05 Dec 2025" },
  ];
}

// --- APPROVE ORDER FUNCTION ---
async function approveOrder(id) {
    if(!confirm("Approve this order? This will deduct money from user's wallet.")) return;

    try {
        const res = await fetch(`${API_BASE}/orders/${id}/approve`, { method: 'POST' });
        const data = await res.json();
        
        if(res.ok) {
            alert("Order Approved & Wallet Deducted!");
            renderOrders(); // Refresh list
        } else {
            alert("Error: " + data.error);
        }
    } catch(e) {
        alert("Network error");
    }
}

