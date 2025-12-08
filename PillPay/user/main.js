// =============== SIMPLE TOAST ===============
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `fixed top-4 right-4 p-3 rounded-lg text-white text-sm z-50 ${
    type === "success" ? "bg-green-600" : "bg-red-600"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2500);
}

// =============== SIGNUP (LOCAL ONLY) ===============
function signupUser() {
  const name = document.getElementById("name")?.value;
  const email = document.getElementById("email")?.value;
  const phone = document.getElementById("phone")?.value;
  const password = document.getElementById("password")?.value;

  if (!name || !email || !phone || !password) {
    showToast("All fields required!", "error");
    return;
  }

  const user = {
    name,
    email,
    phone,
    password,
    mainBalance: 20000,
    walletBalance: 0,
  };

  // store only user; do NOT set session here
  localStorage.setItem("pillpay_user", JSON.stringify(user));

  showToast("Signup successful! Please login now.", "success");
  window.location.href = "login.html";
}
// =============== LOGIN (BACKEND + LOCAL FALLBACK) ===============
function loginUserBackend(email, pwd) {
  // tries in-memory backend users (mohak, examiner)
  return fetch("http://localhost:4000/api/user/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pwd }),
  }).then((res) => {
    if (!res.ok) throw new Error("Invalid");
    return res.json();
  });
}

// =============== WALLET HELPERS ===============
function loadWallet() {
  const user = JSON.parse(localStorage.getItem("pillpay_user"));
  if (!user) return;

  const balEl = document.getElementById("wallet-balance");
  if (!balEl) return;

  // If user has id (backend user), use API; else use local only
  if (user.id) {
    fetch(`http://localhost:4000/api/user/${user.id}/wallet`)
      .then((res) => res.json())
      .then((data) => {
        balEl.textContent = `₹${data.walletBalance.toLocaleString()}`;
        const updatedUser = {
          ...user,
          mainBalance: data.mainBalance,
          walletBalance: data.walletBalance,
        };
        localStorage.setItem("pillpay_user", JSON.stringify(updatedUser));
      })
      .catch(() => {
        balEl.textContent = `₹${(user.walletBalance ?? 0).toLocaleString()}`;
      });
  } else {
    // local-only signup user
    balEl.textContent = `₹${(user.walletBalance ?? 0).toLocaleString()}`;
  }
}

function addMoneyToWallet() {
  const user = JSON.parse(localStorage.getItem("pillpay_user"));
  if (!user) {
    showToast("Please login again", "error");
    window.location.href = "login.html";
    return;
  }

  const amountStr = prompt("Enter amount to add to e-wallet:");
  const amount = Number(amountStr);
  if (!amount || amount <= 0) {
    showToast("Enter a valid amount", "error");
    return;
  }

  // Backend user with id: use API
  if (user.id) {
    fetch(`http://localhost:4000/api/user/${user.id}/wallet/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          showToast(data.error, "error");
          return;
        }

        const updatedUser = {
          ...user,
          mainBalance: data.mainBalance,
          walletBalance: data.walletBalance,
        };
        localStorage.setItem("pillpay_user", JSON.stringify(updatedUser));

        const balEl = document.getElementById("wallet-balance");
        if (balEl) {
          balEl.textContent = `₹${data.walletBalance.toLocaleString()}`;
        }

        showToast("Amount securely added to e-wallet ✅", "success");
      })
      .catch(() => {
        showToast("Failed to add money", "error");
      });
  } else {
    // Local-only user: just adjust local balances
    const updatedUser = {
      ...user,
      mainBalance: (user.mainBalance ?? 20000) - amount,
      walletBalance: (user.walletBalance ?? 0) + amount,
    };
    localStorage.setItem("pillpay_user", JSON.stringify(updatedUser));

    const balEl = document.getElementById("wallet-balance");
    if (balEl) {
      balEl.textContent = `₹${updatedUser.walletBalance.toLocaleString()}`;
    }

    showToast("Amount securely added to e-wallet ✅", "success");
  }
}

// =============== PAGE INIT (LOGIN + WALLET) ===============
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname.split("/").pop();

  // login.html
  if (path === "login.html" || path === "") {
    const form = document.getElementById("login-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const pwd = document.getElementById("password").value;

        // 1) Try backend demo users
        loginUserBackend(email, pwd)
          .then((data) => {
            if (!data.ok) throw new Error("Invalid");
            const u = data.user; // {id, name, email, mainBalance, walletBalance}
            localStorage.setItem("pillpay_user", JSON.stringify(u));
            localStorage.setItem(
              "pillpay_session",
              JSON.stringify({ loggedIn: true, role: "user" })
            );
            showToast("Login successful! 👋", "success");
            window.location.href = "wallet.html";
          })
          .catch(() => {
            // 2) Fallback: local signed-up user
            const localUser = JSON.parse(localStorage.getItem("pillpay_user"));
            if (localUser && localUser.email === email && localUser.password === pwd) {
              localStorage.setItem(
                "pillpay_session",
                JSON.stringify({ loggedIn: true, role: "user" })
              );
              showToast("Login successful! 👋", "success");
              window.location.href = "wallet.html";
            } else {
              showToast("Invalid credentials!", "error");
            }
          });
      });
    }
  }

  // wallet.html
  if (path === "wallet.html") {
    loadWallet();
    const btn = document.getElementById("add-money-btn");
    if (btn) {
      btn.addEventListener("click", addMoneyToWallet);
    }
  }
});
