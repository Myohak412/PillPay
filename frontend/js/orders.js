// // orders.js
// import { renderShell, ensureAuth, getState, formatCurrency, formatDate } from './app.js';

// document.addEventListener('DOMContentLoaded', ()=>{
//   try{ ensureAuth(); } catch(e){ return; }
//   renderShell('orders','Orders');

//   const root = document.getElementById('page-content');
//   const state = getState();

//   if(!state.orders || state.orders.length===0){
//     root.innerHTML = `<div class="card-surface"><div class="small muted">No orders found.</div></div>`;
//     return;
//   }

//   root.innerHTML = `
//     <div class="card-surface">
//       <table style="width:100%;border-collapse:collapse">
//         <thead><tr style="text-align:left"><th>Date</th><th>Medicine</th><th>Amount</th><th>Status</th></tr></thead>
//         <tbody>
//           ${state.orders.map(o=>`<tr>
//             <td class="small">${formatDate(o.date)}</td>
//             <td>${o.medicineName}</td>
//             <td>${formatCurrency(o.amount)}</td>
//             <td class="small">${o.status}</td>
//           </tr>`).join('')}
//         </tbody>
//       </table>
//     </div>
//   `;
// });
