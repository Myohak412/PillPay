// // =============== SIMPLE TOAST ===============

// ================= GLOBAL CONFIG & UI =================
const API_BASE = "http://localhost:4000/api/user";

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 p-3 rounded-lg text-white text-sm z-50 ${
        type === "success" ? "bg-green-600" : "bg-red-600"
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}


async function displayUserNotifications() {
  const user = JSON.parse(localStorage.getItem("pillpay_user"));
  const container = document.getElementById("notifications-list"); // Ensure this ID exists in your HTML
  if (!container || !user) return;

  const res = await fetch(`http://localhost:4000/api/user/${user.id}/notifications`);
  const notifications = await res.json();

  if (notifications.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-sm">No new notifications</p>';
    return;
  }

  container.innerHTML = notifications.map(n => `
    <div class="p-3 mb-2 bg-white/5 border-l-4 border-green-500 rounded">
      <p class="text-white text-sm">${n.message}</p>
      <span class="text-[10px] text-gray-400">${new Date(n.created_at).toLocaleString()}</span>
    </div>
  `).join("");
}
// ================= AUTHENTICATION =================
async function loginUserBackend(email, password) {
    const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    return res.json();
}

async function signupUser() {
    const name = document.getElementById("name")?.value;
    const email = document.getElementById("email")?.value;
    const phone = document.getElementById("phone")?.value;
    const password = document.getElementById("password")?.value;

    if (!name || !email || !phone || !password) {
        showToast("All fields are required!", "error");
        return;
    }

    try {
        const res = await fetch("http://localhost:4000/api/user/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, phone, password }),
        });
        
        const data = await res.json();

        if (data.ok) {
            showToast("Signup successful! You are now in the DB.", "success");
            // We save the user object so we can use their ID later
            localStorage.setItem("pillpay_user", JSON.stringify(data.user));
            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);
        } else {
            showToast(data.message, "error");
        }
    } catch (err) {
        showToast("Server is offline. Data not saved.", "error");
    }
}

// ================= WALLET & BALANCE =================
async function loadWallet() {
    const user = JSON.parse(localStorage.getItem("pillpay_user"));
    if (!user || !user.id) return;

    const balEl = document.getElementById("wallet-balance");
    const dashBalEl = document.getElementById("user-wallet");

    try {
        const res = await fetch(`${API_BASE}/${user.id}/wallet`);
        const data = await res.json();
        const balance = parseFloat(data.walletBalance || 0);

        if (balEl) balEl.textContent = `₹${balance.toLocaleString()}`;
        if (dashBalEl) dashBalEl.textContent = `₹${balance.toLocaleString()}`;

        user.walletBalance = balance;
        localStorage.setItem("pillpay_user", JSON.stringify(user));
    } catch (err) {
        console.error("Wallet sync error:", err);
    }
}

async function addMoneyToWallet() {
    const user = JSON.parse(localStorage.getItem("pillpay_user"));
    if (!user?.id) return showToast("Session error, login again", "error");

    const amountStr = prompt("Enter amount to add to e-wallet:");
    const amount = parseFloat(amountStr);

    if (!amount || amount <= 0) return showToast("Invalid amount", "error");

    try {
        const res = await fetch(`${API_BASE}/${user.id}/wallet/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        showToast("Amount securely added! ✅", "success");
        loadWallet();
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ================= ORDERS SYSTEM =================
async function initOrderPage() {
    const user = JSON.parse(localStorage.getItem("pillpay_user"));
    if (!user) return window.location.href = "login.html";

    loadUserOrders();

    // Fill Dropdown with Database Medicines
    const sel = document.getElementById("order-medicine");
    if (sel) {
        try {
            const res = await fetch("http://localhost:4000/api/admin/medicines");
            const meds = await res.json();
            sel.innerHTML = '<option value="">Select medicine</option>' +
                meds.map(m => `<option value="${m.id}">${m.name} — ₹${parseFloat(m.price).toFixed(2)}</option>`).join("");
        } catch (err) {
            sel.innerHTML = '<option>Failed to load medicines</option>';
        }
    }

    // Handle Form Submission
    const form = document.getElementById("order-form");
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const medicineId = document.getElementById("order-medicine").value;
            const quantity = parseInt(document.getElementById("order-qty").value);
            const address = document.getElementById("order-address").value.trim();
            const reminderDate = document.getElementById("order-reminder").value;

            if (!medicineId || quantity < 10 || !address) {
                return showToast("Fill all fields (Min qty 10)", "error");
            }

            try {
                const res = await fetch(`${API_BASE}/${user.id}/orders`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ medicineId, quantity, address, reminderDate }),
                });
                const data = await res.json();
                if (data.ok) {
                    showToast("Order sent to pharmacy ✅", "success");
                    form.reset();
                    loadUserOrders();
                }
            } catch (err) { showToast("Order failed", "error"); }
        });
    }
}

async function loadUserOrders() {
    const user = JSON.parse(localStorage.getItem("pillpay_user"));
    const listEl = document.getElementById("order-list");
    if (!listEl || !user?.id) return;

    try {
        const res = await fetch(`${API_BASE}/${user.id}/orders`);
        const orders = await res.json();

        if (orders.length === 0) {
            listEl.innerHTML = '<p class="text-white/70 text-sm">No orders yet.</p>';
            return;
        }

        listEl.innerHTML = orders.map(o => `
            <div class="mb-3 p-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm">
                <div class="flex justify-between items-center mb-1">
                    <span class="font-semibold">${o.medicine_name} x${o.quantity}</span>
                    <span class="text-xs font-bold ${o.status === 'Approved' ? 'text-green-400' : 'text-yellow-300'}">
                        ${o.status.toUpperCase()}
                    </span>
                </div>
                <p class="text-white/60 text-xs">Total: ₹${parseFloat(o.total_amount).toFixed(2)}</p>
                <p class="text-white/50 text-[10px] mt-1">${new Date(o.created_at).toLocaleString()}</p>
            </div>
        `).join("");
    } catch (err) { console.error("Order load error"); }
}

// ================= PROFILE & DASHBOARD =================
function initProfilePage() {
    const user = JSON.parse(localStorage.getItem("pillpay_user")) || {};
    const elements = {
        "profile-name": user.name || "User",
        "profile-name-detail": user.name || "User",
        "profile-email": user.email || "-",
        "profile-phone": user.phone || "-",
        "profile-wallet": `₹${parseFloat(user.walletBalance || 0).toLocaleString()}`
    };
    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }
}

// ================= PAGE INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname.split("/").pop();

    // Logout logic
    document.querySelectorAll(".logout-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "login.html";
        });
    });

    // Page Specific Inits
    if (path === "login.html" || path === "") {
        document.getElementById("login-form")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            try {
                const data = await loginUserBackend(email, password);
                localStorage.setItem("pillpay_user", JSON.stringify(data.user));
                showToast("Login successful!", "success");
                setTimeout(() => window.location.href = "dashboard.html", 1000);
            } catch (err) { showToast("Invalid credentials", "error"); }
        });
    }

    if (path === "dashboard.html") {
        const user = JSON.parse(localStorage.getItem("pillpay_user"));
        if (document.getElementById("user-name") && user) document.getElementById("user-name").textContent = user.name;
        loadWallet();
    }
    if (path === "wallet.html") {
        loadWallet();
        document.getElementById("add-money-btn")?.addEventListener("click", addMoneyToWallet);
    }
    if (path === "orders.html") initOrderPage();
    if (path === "profile.html") initProfilePage();
});
// function showToast(message, type = "success") {
//   const toast = document.createElement("div");
//   toast.className = `fixed top-4 right-4 p-3 rounded-lg text-white text-sm z-50 ${
//     type === "success" ? "bg-green-600" : "bg-red-600"
//   }`;
//   toast.textContent = message;
//   document.body.appendChild(toast);
//   setTimeout(() => toast.remove(), 2500);
// }

// // =============== SIGNUP (LOCAL ONLY) ===============
// function signupUser() {
//   const name = document.getElementById("name")?.value;
//   const email = document.getElementById("email")?.value;
//   const phone = document.getElementById("phone")?.value;
//   const password = document.getElementById("password")?.value;

//   if (!name || !email || !phone || !password) {
//     showToast("All fields required!", "error");
//     return;
//   }

//   const user = {
//     name,
//     email,
//     phone,
//     password,
//     mainBalance: 20000,
//     walletBalance: 0,
//   };

//   localStorage.setItem("pillpay_user", JSON.stringify(user));
//   showToast("Signup successful! Please login now.", "success");
//   window.location.href = "login.html";
// }

// // =============== LOGIN (BACKEND + LOCAL FALLBACK) ===============
// function loginUserBackend(email, pwd) {
//   return fetch("http://localhost:4000/api/user/login", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, password: pwd }),
//   }).then((res) => {
//     if (!res.ok) throw new Error("Invalid");
//     return res.json();
//   });
// }

// // =============== WALLET HELPERS ===============
// function loadWallet() {
//   const user = JSON.parse(localStorage.getItem("pillpay_user"));
//   if (!user) return;

//   const balEl = document.getElementById("wallet-balance");
//   if (!balEl) return;

//   if (user.id) {
//     fetch(`http://localhost:4000/api/user/${user.id}/wallet`)
//       .then((res) => res.json())
//       .then((data) => {
//         console.log("Wallet API data:", data);
//         balEl.textContent = `₹${data.walletBalance.toLocaleString()}`;
//         const updatedUser = {
//           ...user,
//           mainBalance: data.mainBalance,
//           walletBalance: data.walletBalance,
//         };
//         localStorage.setItem("pillpay_user", JSON.stringify(updatedUser));
//       })
//       .catch(() => {
//         balEl.textContent = `₹${(user.walletBalance ?? 0).toLocaleString()}`;
//       });
//   } else {
//     balEl.textContent = `₹${(user.walletBalance ?? 0).toLocaleString()}`;
//   }
// }

// function addMoneyToWallet() {
//   const user = JSON.parse(localStorage.getItem("pillpay_user"));
//   if (!user) {
//     showToast("Please login again", "error");
//     window.location.href = "login.html";
//     return;
//   }

//   const amountStr = prompt("Enter amount to add to e-wallet:");
//   const amount = Number(amountStr);
//   if (!amount || amount <= 0) {
//     showToast("Enter a valid amount", "error");
//     return;
//   }

//   if (user.id) {
//     fetch(`http://localhost:4000/api/user/${user.id}/wallet/add`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ amount }),
//     })
//       .then((res) => res.json())
//       .then((data) => {
//         console.log("Wallet add API data:", data);
//         if (data.error) {
//           showToast(data.error, "error");
//           return;
//         }

//         const updatedUser = {
//           ...user,
//           mainBalance: data.mainBalance,
//           walletBalance: data.walletBalance,
//         };
//         localStorage.setItem("pillpay_user", JSON.stringify(updatedUser));
//         console.log("Updated user in storage:", updatedUser);

//         const balEl = document.getElementById("wallet-balance");
//         if (balEl) {
//           balEl.textContent = `₹${data.walletBalance.toLocaleString()}`;
//         }

//         showToast("Amount securely added to e-wallet ✅", "success");
//       })
//       .catch(() => {
//         showToast("Failed to add money", "error");
//       });
//   } else {
//     const updatedUser = {
//       ...user,
//       mainBalance: (user.mainBalance ?? 20000) - amount,
//       walletBalance: (user.walletBalance ?? 0) + amount,
//     };
//     localStorage.setItem("pillpay_user", JSON.stringify(updatedUser));

//     const balEl = document.getElementById("wallet-balance");
//     if (balEl) {
//       balEl.textContent = `₹${updatedUser.walletBalance.toLocaleString()}`;
//     }

//     showToast("Amount securely added to e-wallet ✅", "success");
//   }
// }

// // =============== DASHBOARD ===============
// function initDashboard() {
//   const user = JSON.parse(localStorage.getItem("pillpay_user"));
//   if (!user) return;

//   const nameEl = document.getElementById("user-name");
//   const walletEl = document.getElementById("user-wallet");

//   if (nameEl) nameEl.textContent = user.name || "";
//   if (walletEl) {
//     walletEl.textContent = `₹${(user.walletBalance ?? 0).toLocaleString()}`;
//   }

//   if (user.id) {
//     fetch(`http://localhost:4000/api/user/${user.id}/wallet`)
//       .then((res) => res.json())
//       .then((data) => {
//         const updatedUser = {
//           ...user,
//           mainBalance: data.mainBalance,
//           walletBalance: data.walletBalance,
//         };
//         localStorage.setItem("pillpay_user", JSON.stringify(updatedUser));
//         if (walletEl) {
//           walletEl.textContent = `₹${data.walletBalance.toLocaleString()}`;
//         }
//       })
//       .catch(() => {});
//   }
// }

// // =============== ORDERS HISTORY ===============
// function loadUserOrders() {
//   const user = JSON.parse(localStorage.getItem("pillpay_user"));
//   if (!user) return;

//   fetch(`http://localhost:4000/api/user/${user.id}/orders`)
//     .then((res) => res.json())
//     .then((data) => {
//       const listEl = document.getElementById("order-list");
//       if (!listEl) return;

//       const orders = data.orders || data;
//       if (!orders || orders.length === 0) {
//         listEl.innerHTML =
//           '<p class="text-white/70 text-sm">No orders yet. Place your first order below.</p>';
//         return;
//       }

//       listEl.innerHTML = orders
//         .map((o) => {
//           const statusColor =
//             o.status === "APPROVED" ? "text-green-400" : "text-yellow-300";
//           const date = o.createdAt
//             ? new Date(o.createdAt).toLocaleString()
//             : "";
//           const reminder = o.reminderDate
//             ? new Date(o.reminderDate).toLocaleDateString()
//             : "-";
//           return `
//           <div class="mb-3 p-3 rounded-xl bg-white/10 border border-white/10 text-white text-sm">
//             <div class="flex justify-between items-center mb-1">
//               <span class="font-semibold">${o.medicineName || "Medicine"} x${o.quantity}</span>
//               <span class="${statusColor} text-xs font-semibold">${o.status}</span>
//             </div>
//             <p class="text-white/60 text-xs">Total: ₹${o.totalAmount}</p>
//             <p class="text-white/60 text-xs">Reminder: ${reminder}</p>
//             <p class="text-white/50 text-[11px] mt-1">${date}</p>
//           </div>
//         `;
//         })
//         .join("");
//     })
//     .catch(() => {
//       const listEl = document.getElementById("order-list");
//       if (listEl) {
//         listEl.innerHTML =
//           '<p class="text-red-300 text-sm">Failed to load orders.</p>';
//       }
//     });
// }

// // =============== ORDERS (USER PLACE ORDER) ===============
// function initOrderPage() {
//   const user = JSON.parse(localStorage.getItem("pillpay_user"));
//   if (!user) {
//     window.location.href = "login.html";
//     return;
//   }

//   loadUserOrders();

//   // Load medicines into dropdown
//   const sel = document.getElementById("order-medicine");
//   if (sel) {
//     sel.innerHTML = '<option value="">Select medicine</option>';

//     fetch("http://localhost:4000/api/admin/medicines")
//       .then((res) => res.json())
//       .then((meds) => {
//         if (!Array.isArray(meds) || meds.length === 0) {
//           sel.innerHTML =
//             '<option value="">No medicines available</option>';
//           return;
//         }

//         sel.innerHTML =
//           '<option value="">Select medicine</option>' +
//           meds
//             .map((m) => {
//               const id = m.id || m.id?.split?.(":")?.[1] || "";
//               const name = m.name || "Medicine";
//               const price = m.price ?? "-";
//               return `<option value="${id}">${name} — ₹${price}</option>`;
//             })
//             .join("");
//       })
//       .catch((err) => {
//         console.error("Failed to load medicines:", err);
//         sel.innerHTML =
//           '<option value="">Failed to load medicines</option>';
//       });
//   }

//   const form = document.getElementById("order-form");
//   if (form) {
//     form.addEventListener("submit", (e) => {
//       e.preventDefault();
//       const medicineId = document.getElementById("order-medicine").value;
//       const quantity = Number(
//         document.getElementById("order-qty").value
//       );
//       const reminderDate =
//         document.getElementById("order-reminder").value;
//       const address = document
//         .getElementById("order-address")
//         .value.trim();

//       if (!medicineId || !quantity || quantity < 10 || !address) {
//         showToast(
//           "Fill all fields, quantity at least 10",
//           "error"
//         );
//         return;
//       }

//       fetch(
//         `http://localhost:4000/api/user/${user.id}/orders`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             medicineId,
//             quantity,
//             reminderDate,
//             address,
//           }),
//         }
//       )
//         .then((res) => res.json())
//         .then((data) => {
//           if (!data.ok) {
//             showToast(data.error || "Order failed", "error");
//             return;
//           }
//           showToast("Order sent to pharmacy ✅", "success");
//           loadUserOrders();
//         })
//         .catch(() => {
//           showToast("Order failed", "error");
//         });
//     });
//   }
// }
// // =============== LOGOUT ===============
// function logoutUser() {
//   localStorage.removeItem("pillpay_user");
//   localStorage.removeItem("pillpay_session");
//   showToast("Logged out safely 👋", "success");
//   window.location.href = "login.html";
// }

// // =============== PAGE INIT ===============
// document.addEventListener("DOMContentLoaded", () => {
//   const path = window.location.pathname.split("/").pop();

//   // attach logout to any .logout-btn on any page
//   const logoutBtn = document.querySelector(".logout-btn");
//   if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);

//   // login.html
//   if (path === "login.html" || path === "") {
//     const form = document.getElementById("login-form");
//     if (form) {
//       form.addEventListener("submit", (e) => {
//         e.preventDefault();
//         const email = document.getElementById("email").value;
//         const pwd = document.getElementById("password").value;

//         loginUserBackend(email, pwd)
//           .then((data) => {
//             if (!data.ok) throw new Error("Invalid");
//             const u = data.user;
//             localStorage.setItem("pillpay_user", JSON.stringify(u));
//             localStorage.setItem(
//               "pillpay_session",
//               JSON.stringify({ loggedIn: true, role: "user" })
//             );
//             showToast("Login successful! 👋", "success");
//             window.location.href = "dashboard.html";
//           })
//           .catch(() => {
//             const localUser = JSON.parse(localStorage.getItem("pillpay_user"));
//             if (localUser && localUser.email === email && localUser.password === pwd) {
//               localStorage.setItem(
//                 "pillpay_session",
//                 JSON.stringify({ loggedIn: true, role: "user" })
//               );
//               showToast("Login successful! 👋", "success");
//               window.location.href = "dashboard.html";
//             } else {
//               showToast("Invalid credentials!", "error");
//             }
//           });
//       });
//     }
//   }

//   if (path === "dashboard.html") {
//     initDashboard();
//   }

//   if (path === "wallet.html") {
//     loadWallet();
//     const btn = document.getElementById("add-money-btn");
//     if (btn) btn.addEventListener("click", addMoneyToWallet);
//   }

//   if (path === "orders.html") {
//     initOrderPage();
//   }

//   if (path === "profile.html") {
//     initProfilePage();
//   }
// });

// // =============== PROFILE (VIEW) ===============
// function initProfilePage() {
//   const user = JSON.parse(localStorage.getItem("pillpay_user")) || {};

//   const name = user.name || "User";
//   document.getElementById("profile-name").textContent = name;
//   document.getElementById("profile-name-detail").textContent = name;
//   document.getElementById("profile-email").textContent = user.email || "-";
//   document.getElementById("profile-phone").textContent = user.phone || "-";
//   document.getElementById("profile-wallet").textContent =
//     `₹${(user.walletBalance ?? 0).toLocaleString()}`;
// }
