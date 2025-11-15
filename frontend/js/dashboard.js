// // dashboard.js
// import { renderShell, getState, formatCurrency, formatDate, ensureAuth } from './app.js';

// document.addEventListener('DOMContentLoaded', ()=>{
//   try { ensureAuth(); } catch(e){ return; }
//   renderShell('dashboard','Dashboard');

//   const root = document.getElementById('page-content');
//   const state = getState();

//   root.innerHTML = `
//     <div class="card-surface">
//       <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
//         <div>
//           <div class="small">Welcome back</div>
//           <h3 style="margin:6px 0 0">${state.user.name}</h3>
//           <div class="muted">Manage wallet & monthly medicines</div>
//         </div>
//         <div>
//           <div class="kv">
//             <div class="small">Balance</div>
//             <div class="value" style="margin-left:12px">${formatCurrency(state.walletBalance)}</div>
//           </div>
//         </div>
//       </div>
//     </div>

//     <div style="height:12px"></div>

//     <div class="card-surface">
//       <h4>Quick Actions</h4>
//       <div style="display:flex;gap:10px;margin-top:12px">
//         <a class="btn primary" href="wallet.html">Add Money</a>
//         <a class="btn" href="medicines.html">Set Monthly Medicine</a>
//         <a class="btn" href="schedules.html">My Schedules (${state.schedules.length})</a>
//       </div>
//     </div>

//     <div style="height:12px"></div>

//     <div class="card-surface">
//       <h4>Recent Transactions</h4>
//       <div style="margin-top:10px" id="recent-tx"></div>
//     </div>
//   `;

//   // render recent tx
//   const txCont = document.getElementById('recent-tx');
//   const txs = [...state.transactions].slice(-5).reverse();
//   if(txs.length===0) txCont.innerHTML = `<div class="small muted">No recent transactions.</div>`;
//   else{
//     txCont.innerHTML = txs.map(tx=>`
//       <div class="tx">
//         <div>
//           <div>${tx.description}</div>
//           <div class="small">${formatDate(tx.date)}</div>
//         </div>
//         <div class="small">${tx.amount>0?'+':''}${formatCurrency(tx.amount)}</div>
//       </div>
//     `).join('');
//   }
// });
