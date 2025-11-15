document.addEventListener('DOMContentLoaded', function () {
  // Get elements
  const amountInput = document.querySelector('input[placeholder="Enter Amount"]');
  const balanceDisplay = document.querySelector('.text-3xl.font-extrabold');
  const addFundsButton = document.querySelector('button.w-full.bg-blue-400');
  const presetBtns = document.querySelectorAll('.amount-btn');

  // Start with balance from localStorage or default
  function getBalance() {
    return parseFloat(localStorage.getItem("pillpay_balance") || "1250.75");
  }
  function setBalance(amount) {
    localStorage.setItem("pillpay_balance", amount.toFixed(2));
  }

  balanceDisplay.textContent = `$${getBalance().toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;

  // Preset buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.textContent.replace('$','').trim();
      if (!isNaN(text)) amountInput.value = text;
      else amountInput.value = '';
    });
  });

  // Add Funds
  addFundsButton.addEventListener('click', function(e) {
    e.preventDefault();
    const addAmount = parseFloat(amountInput.value);
    if (isNaN(addAmount) || addAmount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }
    const current = getBalance() + addAmount;
    setBalance(current);
    balanceDisplay.textContent = `$${current.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    amountInput.value = '';
    alert("Funds added successfully!");
  });
});
