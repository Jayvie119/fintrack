let transactions = [];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// --- UTILITIES ---
function fmt(n) { return '₱' + Math.abs(n).toLocaleString('en-PH', {minimumFractionDigits:2}); }
function fmtSigned(n) { return (n>=0?'+':'−') + '₱' + Math.abs(n).toLocaleString('en-PH', {minimumFractionDigits:2,maximumFractionDigits:2}); }
function getMonthKey(d) { const dt = new Date(d); return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0'); }
function getMonthLabel(k) { const [y,m]=k.split('-'); return MONTHS[parseInt(m)-1]+' '+y.slice(2); }

function getLast6Months() {
    return [...new Set(transactions.map(t=>getMonthKey(t.date)))].sort().slice(-6);
}

function switchTab(name) {
    document.querySelectorAll('.ft-tab').forEach(el => el.classList.toggle('active', el.innerText.toLowerCase() === name));
    document.querySelectorAll('.ft-section').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    
    // Re-trigger specific charts for the active tab to fix canvas resize bugs
    setTimeout(() => {
        if (name === 'dashboard') { renderDonut(transactions), renderBar(transactions), renderNetLine(transactions), renderSavingsBar(transactions); }
  
    }, 60);
}

function computeMetrics() {
  const totalIncome = transactions.filter(t=>t.amount>0).reduce((s,t)=>s+t.amount,0);
  const totalExp = transactions.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  const net = totalIncome - totalExp;
  const curMo = getMonthKey(new Date().toISOString().slice(0,10));
  const moTxns = transactions.filter(t=>getMonthKey(t.date)===curMo);
  const moExp = moTxns.filter(t=>t.amount<0).reduce((s,t)=>s+Math.abs(t.amount),0);
  return {totalIncome, totalExp, net, moExp};
}

function renderMetrics() {
  const {totalIncome,totalExp,net,moExp} = computeMetrics();
  document.getElementById('metrics-row').innerHTML = `
    <div class="ft-metric"><div class="ft-metric-label">Total Income</div><div class="ft-metric-value pos">${fmt(totalIncome)}</div><div class="ft-metric-sub">All time</div></div>
    <div class="ft-metric"><div class="ft-metric-label">Total Expenses</div><div class="ft-metric-value neg">${fmt(totalExp)}</div><div class="ft-metric-sub">All time</div></div>
    <div class="ft-metric"><div class="ft-metric-label">Net Balance</div><div class="ft-metric-value ${net>=0?'pos':'neg'}">${fmtSigned(net)}</div><div class="ft-metric-sub">All time</div></div>
    <div class="ft-metric"><div class="ft-metric-label">This Month</div><div class="ft-metric-value neg">${fmt(moExp)}</div><div class="ft-metric-sub">Expenses</div></div>
  `;
}

function renderRecentTable() {
  const sorted = [...transactions].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
  document.getElementById('recent-table').innerHTML = tableHTML(sorted, false);
}

function tableHTML(rows, showDelete) {
    if(!rows.length) return '<div class="ft-empty">No transactions found.</div>';
    
    return `<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th style="text-align:right">Amount</th>${showDelete?'<th></th>':''}</tr></thead><tbody>`
      + rows.map(t => `<tr>
        <td>${t.date}</td> 
        <td>${t.description}</td> 
        <td><span class="badge badge-${t.category.toLowerCase()}">${t.category}</span></td> 
        <td style="text-align:right;font-weight:500;color:${t.amount>=0?'var(--ft-accent2)':'var(--ft-danger)'}">${t.amount>=0?'+':''}${fmt(t.amount)}</td>
        ${showDelete?`<td><button class="delete-btn" onclick="deleteTransaction(${t.id})">Delete</button></td>`:''}
      </tr>`).join('')
      + '</tbody></table>'; 
}

function renderCategoryBreakdown() {
  const cats = ['Food','Transport','Housing','Health','Utilities','Entertainment','Other'];
  const vals = cats.map(c => transactions.filter(t => t.category === c && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0));
  const total = vals.reduce((a, b) => a + b, 0);
  const pairs = cats.map((c, i) => ({ c, v: vals[i] })).filter(x => x.v > 0).sort((a, b) => b.v - a.v);
  
  const container = document.getElementById('cat-breakdown');
  if(!container) return;

  container.innerHTML = pairs.map(x => `
    <div class="ft-cat-item">
      <div>
        <div style="font-size:12.5px;font-weight:500;">${x.c}</div>
        <div class="ft-cat-bar-wrap" style="width:140px;">
            <div class="ft-cat-bar" style="width:${total ? Math.round(x.v / total * 100) : 0}%; background:${CAT_COLORS[x.c] || '#7a7f94'};"></div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="color:var(--ft-danger);font-weight:500;">${fmt(x.v)}</div>
        <div style="color:var(--ft-muted);font-size:11px;">${total ? Math.round(x.v / total * 100) : 0}%</div>
      </div>
    </div>`).join('') || '<div class="ft-empty">No expenses yet.</div>';
}

function renderTrendsMetrics() {
  const {totalIncome,totalExp,net} = computeMetrics();
  const rate = totalIncome>0 ? ((totalIncome-totalExp)/totalIncome*100).toFixed(1) : 0;
  const avgMoIncome = (totalIncome / (getLast6Months().length||1)).toFixed(0);
  document.getElementById('trends-metrics').innerHTML = `
    <div class="ft-metric"><div class="ft-metric-label">Savings Rate</div><div class="ft-metric-value pos">${rate}%</div><div class="ft-metric-sub">All time avg</div></div>
    <div class="ft-metric"><div class="ft-metric-label">Avg Monthly Income</div><div class="ft-metric-value">${fmt(parseFloat(avgMoIncome))}</div><div class="ft-metric-sub">Last 6 months</div></div>
    <div class="ft-metric"><div class="ft-metric-label">Net Balance</div><div class="ft-metric-value ${net>=0?'pos':'neg'}">${fmtSigned(net)}</div><div class="ft-metric-sub">Cumulative</div></div>
  `;
}

function renderAllTable() {
  const cat = document.getElementById('filter-cat').value;
  const q = (document.getElementById('filter-search').value||'').toLowerCase();
  let rows = [...transactions].sort((a,b)=>b.date.localeCompare(a.date));
  if(cat) rows = rows.filter(t=>t.category===cat);
  if(q) rows = rows.filter(t=>t.description.toLowerCase().includes(q)||t.category.toLowerCase().includes(q));
  document.getElementById('all-table').innerHTML = tableHTML(rows, true);
}

async function deleteTransaction(id) {
    if(!confirm("Delete this transaction?")) return;
    try {
        await db.deleteTransaction(id);
        transactions = await db.getTransactions();
        renderAll();
    } catch(e) { alert("Error deleting"); }
}

// --- APP LOGIC ---
async function init() {
    const { data: { session } } = await _supabase.auth.getSession();
    
    if (!session) {
        // Not logged in? Redirect to login page
        window.location.href = 'login.html';
        return; 
    } try {
        const userName = session.user.user_metadata.full_name || "User";
        document.querySelector('.ft-logo-wrapper').insertAdjacentHTML('afterend', `<span class="user-welcome">Hello, ${userName}</span>`);
        transactions = await db.getTransactions();
        document.getElementById('inp-date').value = new Date().toISOString().slice(0,10);
        renderAll();
    } catch (err) {
        console.error("Failed to load:", err);
    }

    _supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            window.location.href = 'login.html';
        }
    });

}

async function addTransaction() {
    const date = document.getElementById('inp-date').value;
    const desc = document.getElementById('inp-desc').value.trim();
    const raw = parseFloat(document.getElementById('inp-amount').value);
    const cat = document.getElementById('inp-cat').value;

    if(!date || !desc || isNaN(raw) || raw === 0) return alert('Please fill in all fields correctly.');

    const { data, error: authError } = await _supabase.auth.getSession();

    if (authError || !data.session) {
        console.error("Auth error:", authError);
        window.location.href = 'login.html';
        return;
    }

    // MAPPING: Local variables -> Supabase Column Names
    const newTxn = { 
        date: date, 
        description: desc, 
        amount: cat === 'Income' ? Math.abs(raw) : -Math.abs(raw), 
        category: cat,    
        user_id: data.session.user.id 
    };

    try {
        await db.addTransaction(newTxn);
        transactions = await db.getTransactions(); 
        renderAll();
        
        // Clear UI
        document.getElementById('inp-desc').value = '';
        document.getElementById('inp-amount').value = '';
    } catch(e) { 
        console.error("Database mismatch:", e);
        alert("Check console: columns might still be mismatched."); 
    }
}

async function deleteTransaction(id) {
    if (!confirm("Are you sure you want to delete this?")) return;

    try {
        // 1. Tell Supabase to kill it
        await db.deleteTransaction(id);
        
        // 2. RE-FETCH the fresh data from the source
        // This is the most important step!
        transactions = await db.getTransactions(); 
        
        // 3. Re-draw EVERYTHING
        renderAll(); 
        
        console.log(`Deleted transaction ID: ${id} and refreshed UI.`);
    } catch (e) {
        console.error("Delete failed:", e);
        alert("Failed to delete from database. Check your RLS policies!");
    }
}

let renderTimeout;
function renderAll() {
    renderMetrics();
    renderRecentTable();
    renderAllTable();
    renderCategoryBreakdown();
    renderTrendsMetrics();

    // Re-triggering charts
    // We pass 'transactions' into them so charts.js doesn't have to guess
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(() => {
        renderDonut(transactions); 
        renderBar(transactions); 
        renderNetLine(transactions); 
        renderSavingsBar(transactions);
        renderCatLine(transactions);
    }, 100);
}

// --- EXPORT ---
function exportCSV() {
    if (!transactions.length) return alert('No transactions to export.');

    const header = ['date', 'description', 'amount', 'category'];
    const rows = transactions.map(t => [
        t.date,
        `"${t.description.replace(/"/g, '""')}"`,
        t.amount,
        t.category
    ]);

    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// --- IMPORT ---
const VALID_CATEGORIES = ['Income', 'Food', 'Transport', 'Housing', 'Health', 'Utilities', 'Entertainment', 'Other'];

async function importCSV(event) {
    const file = event.target.files[0];
    // Reset input so the same file can be re-imported if needed
    event.target.value = '';
    if (!file) return;

    const text = await file.text();
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return showImportModal(0, 0, ['File is empty or has no data rows.']);

    // Normalize header: lowercase, strip quotes/spaces
    const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const colDate = header.indexOf('date');
    const colDesc = header.indexOf('description');
    const colAmt  = header.indexOf('amount');
    const colCat  = header.indexOf('category');

    if ([colDate, colDesc, colAmt, colCat].includes(-1)) {
        return showImportModal(0, 0, [
            'Missing required columns. Expected: date, description, amount, category'
        ]);
    }

    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return (window.location.href = 'login.html');

    let imported = 0;
    let skipped  = 0;
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle quoted fields with commas inside them
        const cols = parseCSVLine(line);
        const date = (cols[colDate] || '').trim();
        const desc = (cols[colDesc] || '').trim();
        const rawAmt = parseFloat((cols[colAmt] || '').trim());
        const cat  = cols[colCat] ? cols[colCat].trim() : '';

        // Validate
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            errors.push(`Row ${i}: invalid date "${date}" — use YYYY-MM-DD`);
            skipped++; continue;
        }
        if (!desc) {
            errors.push(`Row ${i}: description is empty`);
            skipped++; continue;
        }
        if (isNaN(rawAmt) || rawAmt === 0) {
            errors.push(`Row ${i}: invalid amount "${cols[colAmt]}"`);
            skipped++; continue;
        }
        if (!VALID_CATEGORIES.includes(cat)) {
            errors.push(`Row ${i}: unknown category "${cat}"`);
            skipped++; continue;
        }

        try {
            await db.addTransaction({ date, description: desc, amount: rawAmt, category: cat, user_id: session.user.id });
            imported++;
        } catch (e) {
            errors.push(`Row ${i}: database error — ${e.message}`);
            skipped++;
        }
    }

    if (imported > 0) {
        transactions = await db.getTransactions();
        renderAll();
    }

    showImportModal(imported, skipped, errors);
}

function parseCSVLine(line) {
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
            else { inQuotes = !inQuotes; }
        } else if (ch === ',' && !inQuotes) {
            cols.push(cur); cur = '';
        } else {
            cur += ch;
        }
    }
    cols.push(cur);
    return cols;
}

function showImportModal(imported, skipped, errors) {
    const modal = document.getElementById('import-modal');
    const body  = document.getElementById('import-modal-body');

    let html = '';

    if (imported > 0) {
        html += `<div class="import-stat success">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ${imported} transaction${imported !== 1 ? 's' : ''} imported successfully
        </div>`;
    }
    if (skipped > 0) {
        html += `<div class="import-stat warning">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            ${skipped} row${skipped !== 1 ? 's' : ''} skipped
        </div>`;
    }
    if (imported === 0 && skipped === 0 && errors.length === 0) {
        html += `<div class="import-stat warning">No data rows found in the file.</div>`;
    }
    if (errors.length > 0) {
        html += `<div class="import-errors"><ul>${errors.map(e => `<li>⚠ ${e}</li>`).join('')}</ul></div>`;
    }

    html += `<div class="import-hint">
        Expected CSV format:<br>
        date, description, amount, category<br>
        2025-01-15, Groceries, -850.00, Food<br>
        2025-01-01, Salary, 25000.00, Income
    </div>`;

    body.innerHTML = html;
    modal.style.display = 'flex';
}

function closeImportModal(event) {
    if (event.target === document.getElementById('import-modal')) {
        document.getElementById('import-modal').style.display = 'none';
    }
}

window.closeImportModal = closeImportModal;
window.exportCSV = exportCSV;
window.importCSV = importCSV;

async function logout() {
    const { error } = await _supabase.auth.signOut();
    if (error) {
        console.error("Error logging out:", error.message);
    } else {
        // Clear local storage if you saved anything there and redirect
        window.location.href = 'login.html';
    }
}

// Ensure the button in HTML can see this function
window.logout = logout;


document.addEventListener('DOMContentLoaded', init);