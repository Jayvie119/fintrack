const CAT_COLORS = {
    Income: '#2dd4a0', Food: '#4f8ef7', Transport: '#9b7ef8',
    Housing: '#f0a94f', Health: '#2dd4a0', Utilities: '#9b7ef8',
    Entertainment: '#f05a5a', Other: '#7a7f94'
};

let charts = {
    donut: null,
    bar: null,
    net: null,
    savings: null,
    catLine: null
};

function safeDestroy(chartKey) {
    if (charts[chartKey]) {
        charts[chartKey].destroy();
        charts[chartKey] = null;
    }
}

function renderDonut(data) {
    const el = document.getElementById('donutChart');
    if (!el) return;

    safeDestroy('donut'); // Kill existing chart instance

    const cats = ['Food', 'Transport', 'Housing', 'Health', 'Utilities', 'Entertainment', 'Other'];
    const vals = cats.map(c => data.filter(t => t.category === c && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0));
    const nonzero = cats.map((c, i) => ({ c, v: vals[i] })).filter(x => x.v > 0);
    
    const ctx = el.getContext('2d');
    charts.donut = new Chart(ctx, { // Save new instance to charts.donut
        type: 'doughnut',
        data: { labels: nonzero.map(x => x.c), datasets: [{ data: nonzero.map(x => x.v), backgroundColor: nonzero.map(x => CAT_COLORS[x.c] + 'cc'), borderColor: nonzero.map(x => CAT_COLORS[x.c]), borderWidth: 1.5, hoverOffset: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: i => ' ' + fmt(i.raw) } } } }
    });
    
    const total = nonzero.reduce((s, x) => s + x.v, 0);
    document.getElementById('donut-legend').innerHTML = nonzero.map(x => `<span style="display:flex;align-items:center;gap:5px;"><span style="width:8px;height:8px;border-radius:2px;background:${CAT_COLORS[x.c]};display:inline-block;"></span>${x.c} ${total ? Math.round(x.v / total * 100) : 0}%</span>`).join('');
}

function renderBar(data) {
    const el = document.getElementById('barChart');
    if (!el) return;

    safeDestroy('bar');

    const months = getLast6Months();
    const income = months.map(m => data.filter(t => getMonthKey(t.date) === m && t.amount > 0).reduce((s, t) => s + t.amount, 0));
    const exp = months.map(m => data.filter(t => getMonthKey(t.date) === m && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0));
    
    const ctx = el.getContext('2d');
    charts.bar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months.map(getMonthLabel), datasets: [
                { label: 'Income', data: income, backgroundColor: '#2dd4a033', borderColor: '#2dd4a0', borderWidth: 1.5, borderRadius: 4 },
                { label: 'Expenses', data: exp, backgroundColor: '#f05a5a33', borderColor: '#f05a5a', borderWidth: 1.5, borderRadius: 4 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#7a7f94', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#7a7f94', font: { size: 11 }, callback: v => '₱' + Math.round(v / 1000) + 'k' }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: i => ' ' + fmt(i.raw) } } } }
    });
}

function renderNetLine(data) {
    const el = document.getElementById('netChart');
    if (!el) return;

    safeDestroy('net');

    const months = getLast6Months();
    let cumNet = 0;
    const netVals = months.map(m => {
        const inc = data.filter(t => getMonthKey(t.date) === m && t.amount > 0).reduce((s, t) => s + t.amount, 0);
        const exp = data.filter(t => getMonthKey(t.date) === m && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
        cumNet += inc - exp; return cumNet;
    });
    
    const ctx = el.getContext('2d');
    charts.net = new Chart(ctx, { type: 'line', data: { labels: months.map(getMonthLabel), datasets: [{ label: 'Net', data: netVals, borderColor: '#4f8ef7', backgroundColor: 'rgba(79,142,247,0.08)', fill: true, borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#4f8ef7', tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#7a7f94', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#7a7f94', font: { size: 11 }, callback: v => '₱' + Math.round(v / 1000) + 'k' }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: i => ' ' + fmt(i.raw) } } } } });
}

function renderSavingsBar(data) {
    const el = document.getElementById('savingsChart');
    if (!el) return;

    safeDestroy('savings');

    const months = getLast6Months();
    const saveVals = months.map(m => {
        const inc = data.filter(t => getMonthKey(t.date) === m && t.amount > 0).reduce((s, t) => s + t.amount, 0);
        const exp = data.filter(t => getMonthKey(t.date) === m && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
        return inc > 0 ? Math.round((inc - exp) / inc * 100) : 0;
    });
    const colors = saveVals.map(v => v >= 0 ? '#2dd4a0aa' : '#f05a5aaa');
    
    const ctx = el.getContext('2d');
    charts.savings = new Chart(ctx, { type: 'bar', data: { labels: months.map(getMonthLabel), datasets: [{ label: 'Savings %', data: saveVals, backgroundColor: colors, borderColor: colors.map(c => c.replace('aa', 'ff')), borderWidth: 1, borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { ticks: { color: '#7a7f94', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#7a7f94', font: { size: 11 }, callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: i => i.raw + '%' } } } } });
}

function renderCatLine(data) {
    const el = document.getElementById('catLineChart');
    if (!el) return;

    safeDestroy('catLine'); 

    const months = getLast6Months();
    
    // 1. Get ALL unique categories present in the current data
    const activeCategories = [...new Set(data
        .filter(t => t.amount < 0) // Only look at expenses
        .map(t => t.category)
    )];

    // 2. Map only those active categories to datasets
    const datasets = activeCategories.map(c => {
        const monthlyData = months.map(m => 
            data.filter(t => 
                t.category === c && 
                getMonthKey(t.date) === m && 
                t.amount < 0
            ).reduce((s, t) => s + Math.abs(t.amount), 0)
        );

        return {
            label: c,
            data: monthlyData,
            borderColor: CAT_COLORS[c] || '#7a7f94',
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: CAT_COLORS[c] || '#7a7f94',
            tension: 0.3
        };
    });

    const ctx = el.getContext('2d');
    charts.catLine = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(getMonthLabel),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    ticks: { color: '#7a7f94', font: { size: 11 } },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    beginAtZero: true,
                    ticks: { 
                        color: '#7a7f94', 
                        font: { size: 11 },
                        callback: v => v >= 1000 ? '₱' + (v/1000) + 'k' : '₱' + v
                    },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { 
                    backgroundColor: '#1a1e2a',
                    padding: 10,
                    titleFont: { size: 13, weight: 'bold' },
                    callbacks: { 
                        label: i => ` ${i.dataset.label}: ${fmt(i.raw)}` 
                    } 
                }
            }
        }
    });
}