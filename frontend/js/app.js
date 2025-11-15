// // app.js (ES module) - shared utilities + state manager
// const STORAGE_KEY = 'pillpay_state_v1';

// // Default mock medicines
// export const MOCK_MEDICINES = [
//   { id: 'med1', name: 'Metformin', price: 50.00 },
//   { id: 'med2', name: 'Amlodipine', price: 30.50 },
//   { id: 'med3', name: 'Atorvastatin', price: 75.25 },
//   { id: 'med4', name: 'Losartan', price: 45.00 },
//   { id: 'med5', name: 'Omeprazole', price: 20.75 },
// ];

// // default state
// const DEFAULT_STATE = {
//   isAuthenticated: false,
//   user: { name: 'Demo User', email: 'user@example.com' },
//   walletBalance: 2000.00,
//   schedules: [],
//   orders: [],
//   transactions: [],
// };

// let _state = loadState();

// // helpers
// export function formatCurrency(amount){ return `₹${Number(amount).toFixed(2)}`; }
// export function formatDate(d){ return new Date(d).toLocaleDateString('en-IN'); }

// function loadState(){
//   try{
//     const s = localStorage.getItem(STORAGE_KEY);
//     if(!s) return {...DEFAULT_STATE};
//     return JSON.parse(s);
//   }catch(e){
//     console.warn('state load failed', e);
//     return {...DEFAULT_STATE};
//   }
// }
// function saveState(){
//   localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
// }

// // external getters/setters
// export function getState(){ return _state; }
// export function setState(next){ _state = {..._state, ...next}; saveState(); }

// // state mutators for common actions
// export function loginSimulate({ name, email }){
//   _state.isAuthenticated = true;
//   _state.user = { name, email };
//   saveState();
// }
// export function logout(){
//   _state.isAuthenticated = false;
//   // optionally reset other demo data or keep
//   saveState();
// }
// export function addMoney(amount){
//   _state.walletBalance = Number(_state.walletBalance) + Number(amount);
//   _state.transactions.push({
//     id: crypto.randomUUID(),
//     date: new Date().toISOString(),
//     description: 'Add Money',
//     amount: Number(amount)
//   });
//   saveState();
// }
// export function createSchedule({ medicineId, quantity, deductionDate }){
//   const med = MOCK_MEDICINES.find(m=>m.id===medicineId);
//   const monthlyCost = med.price * Number(quantity);
//   // create schedule
//   const schedule = {
//     id: crypto.randomUUID(),
//     medicineId, medicineName: med.name,
//     quantity: Number(quantity),
//     monthlyCost,
//     deductionDate,
//     status: 'Active'
//   };
//   _state.schedules.push(schedule);
//   // deduct
//   _state.walletBalance -= monthlyCost;
//   _state.transactions.push({
//     id: crypto.randomUUID(),
//     date: new Date().toISOString(),
//     description: `Auto-Deduction (${med.name})`,
//     amount: -monthlyCost
//   });
//   _state.orders.push({
//     id: crypto.randomUUID(),
//     date: new Date().toISOString(),
//     medicineName: med.name,
//     amount: monthlyCost,
//     status: 'Scheduled'
//   });
//   saveState();
//   return schedule;
// }
// export function deleteSchedule(id){
//   _state.schedules = _state.schedules.filter(s=>s.id!==id);
//   saveState();
// }
// export function createTransaction(tx){ _state.transactions.push(tx); saveState(); }
// export function createOrder(order){ _state.orders.push(order); saveState(); }

// // UI helpers (render sidebar + topbar to #app-root)
// export function renderShell(activeKey='dashboard', title='') {
//   const root = document.getElementById('app-root');
//   if(!root) return;
//   root.innerHTML = `
//     <div class="container">
//       <aside class="sidebar">
//         <div class="brand">PillPay</div>
//         <div class="small muted">Hi, ${escapeHtml(_state.user.name)}</div>
//         <div class="nav" role="navigation">
//           <a href="dashboard.html" class="${activeKey==='dashboard'?'active':''}">Dashboard</a>
//           <a href="wallet.html" class="${activeKey==='wallet'?'active':''}">Wallet <span class="small">${formatCurrency(_state.walletBalance)}</span></a>
//           <a href="medicines.html" class="${activeKey==='medicines'?'active':''}">Set Medicine</a>
//           <a href="schedules.html" class="${activeKey==='schedules'?'active':''}">Schedules <span class="small">(${_state.schedules.length})</span></a>
//           <a href="orders.html" class="${activeKey==='orders'?'active':''}">Orders</a>
//           <a href="transactions.html" class="${activeKey==='transactions'?'active':''}">Transactions</a>
//           <a id="signout" href="#" class="muted">Logout</a>
//         </div>
//         <div class="footer-note small">Demo project — data saved locally (localStorage).</div>
//       </aside>
//       <main class="content">
//         <div class="topbar">
//           <div><h2>${escapeHtml(title)}</h2></div>
//           <div class="kv"><div class="small">Wallet</div>&nbsp;<div class="value">${formatCurrency(_state.walletBalance)}</div></div>
//         </div>
//         <section id="page-content" style="margin-top:12px"></section>
//       </main>
//     </div>
//   `;
//   // sign out listener
//   const signout = document.getElementById('signout');
//   if(signout){
//     signout.addEventListener('click',(e)=>{
//       e.preventDefault();
//       logout();
//       location.href = 'login.html';
//     });
//   }
// }

// // small escape for insertion
// export function escapeHtml(str=''){
//   return String(str)
//     .replaceAll('&','&amp;')
//     .replaceAll('<','&lt;')
//     .replaceAll('>','&gt;')
//     .replaceAll('"','&quot;')
//     .replaceAll("'","&#39;");
// }

// // expose a simple ensureAuth helper
// export function ensureAuth(){
//   if(!_state.isAuthenticated){
//     location.href = 'login.html';
//     throw new Error('Redirect to login');
//   }
// }
