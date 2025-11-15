// // medicines.js
// import { renderShell, ensureAuth, MOCK_MEDICINES, createSchedule } from './app.js';

// document.addEventListener('DOMContentLoaded', ()=>{
//   try{ ensureAuth(); } catch(e){ return; }
//   renderShell('medicines','Set Monthly Medicine');

//   const content = document.getElementById('page-content');
//   content.innerHTML = `
//     <div class="card-surface">
//       <form id="setup-form">
//         <label>Select Medicine
//           <select id="med-select">${MOCK_MEDICINES.map(m=>`<option value="${m.id}">${m.name} — ${m.price.toFixed(2)}</option>`).join('')}</select>
//         </label>
//         <label>Quantity per month
//           <input id="med-qty" type="number" min="1" value="1" />
//         </label>
//         <label>Deduction date (1-31)
//           <input id="med-date" type="number" min="1" max="31" value="1" />
//         </label>
//         <div style="height:10px"></div>
//         <button class="btn primary" id="save-schedule" type="button">Save Schedule (first deduction immediate)</button>
//       </form>
//     </div>
//   `;

//   document.getElementById('save-schedule').addEventListener('click', ()=>{
//     const medId = document.getElementById('med-select').value;
//     const qty = Number(document.getElementById('med-qty').value || 1);
//     const date = Number(document.getElementById('med-date').value || 1);
//     createSchedule({ medicineId: medId, quantity: qty, deductionDate: date });
//     // navigate to schedules
//     location.href = 'schedules.html';
//   });
// });
