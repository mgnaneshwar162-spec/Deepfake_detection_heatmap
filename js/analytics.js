// ── Analytics Dashboard ──────────────────────────

async function loadAnalytics() {
  try { buildAnalytics(await (await fetch(BACKEND + '/analytics', { headers: HDR })).json()); }
  catch { buildFromHistory(); }
}

function setFilter(el) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  loadAnalytics();
}

function buildFromHistory() {
  const ai     = history.filter(h => h.verdict === 'AI GENERATED' || h.verdict === 'LIKELY DEEPFAKE').length;
  const real   = history.filter(h => h.verdict === 'REAL IMAGE' || h.verdict === 'LIKELY REAL').length;
  const unsure = history.filter(h => h.verdict === 'UNCERTAIN').length;
  buildAnalytics({
    'AI GENERATED': ai, 'REAL IMAGE': real, 'UNCERTAIN': unsure, 'LIKELY DEEPFAKE': 0, 'LIKELY REAL': 0,
    total_images:   history.filter(h => h.type === 'image').length,
    total_videos:   history.filter(h => h.type === 'video').length,
    total_batchs:   history.filter(h => h.type === 'batch').length,
    total_youtubes: history.filter(h => h.type === 'youtube').length
  });
}

function buildAnalytics(d) {
  const aiN   = (d['AI GENERATED'] ?? 0) + (d['LIKELY DEEPFAKE'] ?? 0);
  const realN = (d['REAL IMAGE'] ?? 0) + (d['LIKELY REAL'] ?? 0);
  const unsN  = d['UNCERTAIN'] ?? 0;
  const total = aiN + realN + unsN;
  const imgs  = d.total_images ?? 0, vids = d.total_videos ?? 0;
  const bats  = d.total_batchs ?? 0, yts  = d.total_youtubes ?? 0;
  const files = imgs + vids + bats + yts || 1;

  setText('kpi-total', total); setText('kpi-ai', aiN); setText('kpi-real', realN); setText('kpi-unsure', unsN);
  if (total > 0) {
    setText('kpi-total-sub', total + ' total scans');
    setText('kpi-ai-sub',    pct(aiN, total) + '% of scans');
    setText('kpi-real-sub',  pct(realN, total) + '% of scans');
    setText('kpi-unsure-sub', pct(unsN, total) + '% of scans');
  }

  const setBar = (id, lbl, val, denom) => {
    const p = pct(val, denom);
    setText(id + '-lbl', val + ' (' + p + '%)');
    setTimeout(() => { const el = document.getElementById(id + '-bar'); if (el) el.style.width = p + '%'; }, 120);
  };
  setBar('img', 'img', imgs, files);
  setBar('vid', 'vid', vids, files);
  setBar('bat', 'bat', bats, files);
  setBar('yt',  'yt',  yts,  files);

  mkChart('donut', document.getElementById('donutChart'), { type: 'doughnut', data: { labels: ['AI / Deepfake', 'Real / Human', 'Uncertain'], datasets: [{ data: [aiN, realN, unsN], backgroundColor: ['#fecaca', '#bbf7d0', '#fde68a'], borderColor: ['#dc2626', '#16a34a', '#b45309'], borderWidth: 2 }] }, options: { plugins: { legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 11 }, padding: 12 } } }, cutout: '58%' } });

  const seed = [.08, .14, .18, .22, .16, .12, .10];
  mkChart('bar', document.getElementById('barChart'), { type: 'bar', data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ label: 'Scans', data: seed.map(s => Math.max(1, Math.round(s * (total || 20)))), backgroundColor: 'rgba(92,107,192,.15)', borderColor: '#5c6bc0', borderWidth: 2, borderRadius: 5, borderSkipped: false }] }, options: { plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#f3f4f6' }, ticks: { font: { family: 'Poppins', size: 10 } } }, x: { grid: { display: false }, ticks: { font: { family: 'Poppins', size: 10 } } } } } });

  const tbody = document.getElementById('recentBody');
  if (!history.length) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:18px 0">No detections yet.</td></tr>'; setText('recent-count', '0 results'); return; }
  const rows = history.slice(0, 10);
  setText('recent-count', 'Showing ' + rows.length + ' most recent');
  const typePill = { image: 'pill-img', video: 'pill-vid', batch: 'pill-batch', youtube: 'pill-yt' };
  tbody.innerHTML = rows.map((h, i) => {
    const vi = vInfo(h.verdict); const cp = Math.round((h.confidence || 0) * 100);
    return `<tr>
      <td style="color:var(--subtle)">${i + 1}</td>
      <td style="font-weight:500;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${h.file}</td>
      <td><span class="pill ${typePill[h.type] || 'pill-img'}">${h.type}</span></td>
      <td><span class="pill ${vi.pill}">${h.verdict}</span></td>
      <td><div class="conf-cell"><div class="conf-bar"><div class="conf-inner" style="width:${cp}%;background:${vi.color}"></div></div><span style="font-size:10px;font-weight:600">${cp}%</span></div></td>
      <td style="color:var(--muted)">${h.date}</td>
    </tr>`;
  }).join('');
}
