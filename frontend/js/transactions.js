// // transactions.js
// import { renderShell, ensureAuth, getState, formatCurrency, formatDate } from './app.js';

// document.addEventListener('DOMContentLoaded', ()=>{
//   try{ ensureAuth(); } catch(e){ return; }
//   renderShell('transactions','Transactions');

//   const root = document.getElementById('page-content');
//   const state = getState();

//   if(!state.transactions || state.transactions.length===0){
//     root.innerHTML = `<div class="card-surface"><div class="small muted">No transactions yet.</div></div>`;
//     return;
//   }

//   root.innerHTML = `
//     <div class="card-surface">
//       <div class="list">
//         ${[...state.transactions].reverse().map(tx=>`
//           <div class="tx">
//             <div>
//               <div>${tx.description}</div>
//               <div class="small">${formatDate(tx.date)}</div>
//             </div>
//             <div class="small">${tx.amount>0?'+':''}${formatCurrency(tx.amount)}</div>
//           </div>
//         `).join('')}
//       </div>
//     </div>
//   `;
// });
