// // wallet.js
// import { renderShell, ensureAuth, addMoney as addMoneyAPI, getState, formatCurrency } from './app.js';

// document.addEventListener('DOMContentLoaded', ()=>{
//   try{ ensureAuth(); } catch(e){ return; }
//   renderShell('wallet','Wallet');

//   const root = document.getElementById('page-content');
//   root.innerHTML = `
//     <div class="card-surface">
//       <h4>Add Money</h4>
//       <div style="margin-top:12px">
//         <label>Amount
//           <input id="add-amount" type="number" min="1" value="500" />
//         </label>
//         <div style="height:12px"></div>
//         <button id="add-btn" class="btn primary">Add Money</button>
//       </div>
//     </div>

//     <div style="height:12px"></div>
//     <div class="card-surface">
//       <h4>Transactions</h4>
//       <div id="tx-list" style="margin-top:12px"></div>
//     </div>
//   `;

//   const state = getState();
//   const txList = document.getElementById('tx-list');
//   if(state.transactions.length===0) txList.innerHTML = `<div class="small muted">No transactions yet.</div>`;
//   else txList.innerHTML = state.transactions.slice().reverse().map(tx=>`
//     <div class="tx">
//       <div>
//         <div>${tx.description}</div>
//         <div class="small">${new Date(tx.date).toLocaleString()}</div>
//       </div>
//       <div class="small">${tx.amount>0?'+':''}${formatCurrency(tx.amount)}</div>
//     </div>
//   `).join('');

//   const btn = document.getElementById('add-btn');
//   btn.addEventListener('click', ()=>{
//     const amt = Number(document.getElementById('add-amount').value || 0);
//     if(!amt || amt <= 0){ alert('Enter valid amount'); return; }
//     addMoneyAPI(amt);
//     location.reload(); // simple refresh to reflect updated state
//   });
// });
