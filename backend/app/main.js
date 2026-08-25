// --- DEMO USER DATA ---
let state = JSON.parse(localStorage.getItem("pillpay") || "{}");

if (!state.user) {
  state = {
    user: { email: "demo@pillpay.test", wallet: 1200 },
    cart: [],
    medicines: [
      { id: 101, name: "Paracetamol", price: 40 },
      { id: 102, name: "Vitamin D3", price: 250 }
    ],
    transactions: [],
    orders: [],
    reminders: []
  };
  save();
}

function save() { localStorage.setItem("pillpay", JSON.stringify(state)); }

// --- LOGIN ---
function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  if (email === "demo@pillpay.test" && pass === "1234") {
    location.href = "dashboard.html";
  } else alert("Invalid credentials");
}

// --- LOAD WALLET ---
const walletEl = document.getElementById("wallet");
if (walletEl) walletEl.textContent = "₹" + state.user.wallet;

// --- TOP UP ---
function topup(amount) {
  state.user.wallet += amount;
  state.transactions.push({
    type: "Top Up",
    amount,
    date: new Date().toLocaleString()
  });
  save();
  location.reload();
}

// --- STORE RENDER ---
const list = document.getElementById("med-list");
if (list) {
  list.innerHTML = "";
  state.medicines.forEach(m => {
    list.innerHTML += `
      <div class="bg-white p-4 rounded-2xl shadow mb-3">
        <p class="font-semibold">${m.name}</p>
        <p>₹${m.price}</p>
        <button onclick="add(${m.id})" class="mt-2 bg-indigo-600 text-white px-3 py-2 rounded-xl">Add</button>
      </div>`;
  });
}

// --- ADD TO CART ---
function add(id) {
  state.cart.push(id);
  save();
  alert("Added to cart!");
}

// --- CART RENDER ---
const cartEl = document.getElementById("cart-items");
if (cartEl) {
  if (state.cart.length === 0) cartEl.innerHTML = "Cart is empty";
  else cartEl.innerHTML = "";
  state.cart.forEach(id => {
    const m = state.medicines.find(x => x.id === id);
    cartEl.innerHTML += `<div class="mb-2 bg-white p-3 rounded-xl shadow">${m.name} — ₹${m.price}</div>`;
  });
}

// --- CHECKOUT ---
function checkout() {
  let total = 0;
  state.cart.forEach(id => total += state.medicines.find(x => x.id === id).price);

  if (state.user.wallet >= total) {
    state.user.wallet -= total;
    state.transactions.push({
      type: "Payment",
      amount: total,
      date: new Date().toLocaleString()
    });

    state.orders.push({
      id: Date.now(),
      status: "Preparing",
      total
    });

    state.cart = [];
    save();
    alert("Order placed!");
    location.href = "orders.html";
  } else {
    alert("Not enough balance");
  }
}

// --- TRANSACTIONS PAGE ---
const txEl = document.getElementById("tx-list");
if (txEl) {
  if (state.transactions.length === 0) {
    txEl.innerHTML = "No transactions";
  } else {
    txEl.innerHTML = "";
    state.transactions.forEach(t => {
      txEl.innerHTML += `
        <div class="bg-white p-3 rounded-xl shadow mb-2">
          <p>${t.type}: ₹${t.amount}</p>
          <p class="text-xs text-gray-500">${t.date}</p>
        </div>`;
    });
  }
}

// --- ORDERS PAGE ---
const orderEl = document.getElementById("order-list");
if (orderEl) {
  if (state.orders.length === 0) orderEl.innerHTML = "No orders yet";
  else {
    orderEl.innerHTML = "";
    state.orders.forEach(o => {
      orderEl.innerHTML += `
        <div class="bg-white p-3 rounded-xl shadow mb-2">
          <p>Order #${o.id}</p>
          <p class="text-sm">${o.status}</p>
          <p class="text-sm font-bold">₹${o.total}</p>
        </div>`;
    });
  }
}

// --- REMINDERS PAGE ---
const remEl = document.getElementById("rem-list");
if (remEl) {
  renderReminders();
}

function renderReminders() {
  if (state.reminders.length === 0) remEl.innerHTML = "No reminders";
  else {
    remEl.innerHTML = "";
    state.reminders.forEach(r => {
      remEl.innerHTML += `
        <div class="bg-white p-3 rounded-xl shadow mb-2">
          ${r.name} at ${r.time}
        </div>`;
    });
  }
}

function addReminder() {
  const name = document.getElementById("rem-name").value;
  const time = document.getElementById("rem-time").value;
  if (!name || !time) return alert("Enter details");

  state.reminders.push({ name, time });
  save();
  renderReminders();
  document.getElementById("rem-name").value = "";
  alert("Reminder added!");
}
