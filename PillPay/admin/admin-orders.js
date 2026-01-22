async function loadAdminOrders() {
  const res = await fetch("http://localhost:4000/api/admin/orders");
  const orders = await res.json();

  const container = document.getElementById("ordersContainer");
  if (!container) return; // page that doesn't use orders, do nothing

  container.innerHTML = "";

  if (!orders.length) {
    container.innerHTML = "<p>No orders yet.</p>";
    return;
  }

  orders.forEach(o => {
    const div = document.createElement("div");
    div.className = "order-card";
    div.innerHTML = `
      <p><strong>Order #${o.id}</strong></p>
      <p>User: ${o.userName} (${o.userEmail})</p>
      <p>Medicine: ${o.medicineName}</p>
      <p>Quantity: ${o.quantity}</p>
      <p>Status: ${o.status}</p>
      ${o.status === "Pending" ? `
        <button class="approve-btn" data-id="${o.id}">
          Approve & Auto Deduct
        </button>
      ` : ""}
    `;
    container.appendChild(div);
  });
}

document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("approve-btn")) {
    const orderId = e.target.getAttribute("data-id");

    try {
      const res = await fetch(`http://localhost:4000/api/admin/orders/${orderId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to approve order");
        return;
      }

      alert("Amount auto-deducted from user wallet and order approved.");
      loadAdminOrders();
    } catch (err) {
      console.error(err);
      alert("Network error while approving order");
    }
  }
});

window.addEventListener("DOMContentLoaded", loadAdminOrders);
