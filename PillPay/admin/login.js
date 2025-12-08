// C:\mini-project-25\Sem-I\PillPayProject\PillPay\admin\login.js
const API_BASE = "http://localhost:4000/api/admin";

async function adminLogin(event) {
  event.preventDefault();

  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      window.location.href = "dashboard.html";
    } else {
      alert("Invalid email or password");
    }
  } catch (err) {
    console.error("adminLogin error:", err);
    alert("Login failed. Please try again.");
  }
}
