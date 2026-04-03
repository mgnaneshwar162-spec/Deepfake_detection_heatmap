// ── Utility Helpers ──────────────────────────────

function pct(a, b) {
  return b > 0 ? Math.round(a / b * 100) : 0;
}

function setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}

function mkChart(key, ctx, cfg) {
  if (charts[key]) charts[key].destroy();
  charts[key] = new Chart(ctx, cfg);
}

let _tt;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast ' + type + ' show';
  clearTimeout(_tt);
  _tt = setTimeout(() => el.classList.remove('show'), 3200);
}

function pushHistory(file, type, verdict, confidence) {
  history.unshift({
    file, type, verdict, confidence,
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  });
  if (history.length > 50) history.pop();
  localStorage.setItem('dfd_history', JSON.stringify(history));
}

// ── Verdict Helpers ─────────────────────────────
function vInfo(v) {
  if (v === 'AI GENERATED' || v === 'LIKELY DEEPFAKE')
    return {
      cls: 'ai', pill: 'pill-ai', color: '#dc2626',
      icon: '<polyline points="12 9 12 13"/><circle cx="12" cy="17" r="1"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>'
    };
  if (v === 'REAL IMAGE' || v === 'LIKELY REAL')
    return {
      cls: 'real', pill: 'pill-real', color: '#16a34a',
      icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
    };
  return {
    cls: 'unsure', pill: 'pill-unsure', color: '#b45309',
    icon: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
  };
}

function scoreBar(label, pct, color) {
  const p = Math.round(pct * 100);
  return `<div class="score-row"><span class="score-lbl">${label}</span><div class="score-track"><div class="score-fill" style="width:${p}%;background:${color}"></div></div><span class="score-val">${p}%</span></div>`;
}
