// // schedules.js
// import { renderShell, ensureAuth, getState, deleteSchedule, formatCurrency } from './app.js';

// document.addEventListener('DOMContentLoaded', ()=>{
//   try{ ensureAuth(); } catch(e){ return; }
//   renderShell('schedules','My Schedules');

//   const root = document.getElementById('page-content');
//   const state = getState();
//   if(!state.schedules || state.schedules.length===0){
//     root.innerHTML = `<div class="card-surface"><div class="small muted">You have no active medicine schedules.</div></div>`;
//     return;
//   }

//   root.innerHTML = `
//     <div class="card-surface">
//       <div class="list">
//         ${state.schedules.map(s=>`
//           <div style="display:flex;justify-content:space-between;align-items:center">
//             <div>
//               <div style="font-weight:600">${s.medicineName}</div>
//               <div class="small">Qty: ${s.quantity} • ${formatCurrency(s.monthlyCost)} / month • Deduct on: ${s.deductionDate}th</div>
//             </div>
//             <div style="display:flex;gap:8px;align-items:center">
//               <button data-id="${s.id}" class="btn">Edit</button>
//               <button data-id="${s.id}" class="btn" id="del-${s.id}">Delete</button>
//             </div>
//           </div>
//         `).join('')}
//       </div>
//     </div>
//   `;

//   state.schedules.forEach(s=>{
//     const del = document.getElementById(`del-${s.id}`);
//     if(del){
//       del.addEventListener('click', ()=>{
//         if(confirm('Delete schedule?')){ deleteSchedule(s.id); location.reload(); }
//       });
//     }
//   });
// });
