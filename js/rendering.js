// ── Heatmap helpers ──────────────────────────────

function heatmapCard(b64original, b64heatmap) {
  if (!b64heatmap) {
    return `<div class="heatmap-card"><div class="card-title">Grad-CAM Heatmap <span class="heatmap-badge">AI Attention</span></div><div class="heatmap-skip-note">Heatmap requires ResNet50 model to be loaded.</div></div>`;
  }
  const id = 'hm' + Date.now();
  return `<div class="heatmap-card">
    <div class="card-title">Grad-CAM Heatmap <span class="heatmap-badge">AI Attention</span></div>
    <div class="heatmap-toggle-row">
      <button class="heatmap-toggle active" onclick="switchHeatmap('${id}','overlay',this)">Heatmap Overlay</button>
      <button class="heatmap-toggle" onclick="switchHeatmap('${id}','original',this)">Original</button>
    </div>
    <div class="heatmap-single">
      <div class="heatmap-img-wrap">
        <img id="${id}-overlay" src="data:image/jpeg;base64,${b64heatmap}" alt="Heatmap">
        <img id="${id}-original" src="data:image/jpeg;base64,${b64original}" alt="Original" style="display:none">
        <div class="heatmap-img-label">Red = regions the model focused on most</div>
      </div>
      <div style="flex-shrink:0;min-width:120px">
        <div class="heatmap-legend"><span>Low</span><div class="heatmap-legend-bar"></div><span>High</span></div>
        <div style="font-size:10px;color:var(--muted);margin-top:8px;line-height:1.6">
          <strong>How to read:</strong><br>
          🔴 Red = strong AI signal<br>
          🟡 Yellow = moderate<br>
          🔵 Blue = low attention
        </div>
      </div>
    </div>
  </div>`;
}

function switchHeatmap(id, mode, btn) {
  document.querySelectorAll(`[id^="${id}"]`).forEach(el => el.style.display = 'none');
  document.getElementById(`${id}-${mode}`).style.display = 'block';
  btn.closest('.heatmap-toggle-row').querySelectorAll('.heatmap-toggle').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function heatmapFrameGrid(heatmaps) {
  if (!heatmaps || !heatmaps.length) {
    return `<div class="heatmap-card"><div class="card-title">Frame Heatmaps <span class="heatmap-badge">Grad-CAM</span></div><div class="heatmap-skip-note">Heatmaps require ResNet50 model to be loaded.</div></div>`;
  }
  const frames = heatmaps.map((h, i) => `
    <div class="heatmap-frame">
      <img src="data:image/jpeg;base64,${h.heatmap}" alt="Frame ${i+1}">
      <div class="heatmap-frame-meta">
        <span>Frame ${h.frame_idx ?? (i+1)}</span>
        <span class="ai-hot">${(h.ai_prob * 100).toFixed(0)}% AI</span>
      </div>
    </div>`).join('');
  return `<div class="heatmap-card">
    <div class="card-title">Frame Heatmaps <span class="heatmap-badge">Grad-CAM · Top ${heatmaps.length} frames</span></div>
    <div class="heatmap-legend" style="margin-bottom:10px"><span>Low</span><div class="heatmap-legend-bar"></div><span>High attention</span></div>
    <div class="heatmap-grid">${frames}</div>
  </div>`;
}

// ── Render: Image ────────────────────────────────
function renderImage(container, d) {
  const vi  = vInfo(d.verdict);
  const uid = 'ic' + Date.now();
  let rows = '';
  if (d.per_model) for (const [name, r] of Object.entries(d.per_model)) {
    const mi = vInfo(r.verdict);
    rows += `<tr><td>${name}</td><td>${(r.ai_probability*100).toFixed(1)}%</td><td>${(r.real_probability*100).toFixed(1)}%</td><td><span class="pill ${mi.pill}">${r.verdict}</span></td></tr>`;
  }
  container.innerHTML = `<div class="result-area">
    <div class="verdict-banner ${vi.cls}"><div class="verdict-icon-box"><svg viewBox="0 0 24 24">${vi.icon}</svg></div><div><div class="verdict-label">${d.verdict}</div><div class="verdict-detail">Confidence: ${(d.confidence*100).toFixed(1)}% · AI: ${(d.ai_probability*100).toFixed(1)}% · Real: ${(d.real_probability*100).toFixed(1)}%</div></div></div>
    <div class="stat-row">
      <div class="stat-box"><div class="val">${(d.confidence*100).toFixed(1)}%</div><div class="lbl">Confidence</div></div>
      <div class="stat-box"><div class="val" style="color:var(--danger)">${(d.ai_probability*100).toFixed(1)}%</div><div class="lbl">AI Prob</div></div>
      <div class="stat-box"><div class="val" style="color:var(--success)">${(d.real_probability*100).toFixed(1)}%</div><div class="lbl">Real Prob</div></div>
    </div>
    <div class="info-card"><div class="card-title">Confidence Scores</div>${scoreBar('AI Generated',d.ai_probability,'#dc2626')}${scoreBar('Real Image',d.real_probability,'#16a34a')}</div>
    ${heatmapCard(d.original_b64 || '', d.heatmap_b64 || null)}
    ${rows?`<div class="info-card"><div class="card-title">Model-wise Breakdown</div><table class="data-tbl"><thead><tr><th>Model</th><th>AI Prob</th><th>Real Prob</th><th>Result</th></tr></thead><tbody>${rows}<tr style="background:var(--primary-bg)"><td style="font-weight:700;color:var(--primary)">Ensemble</td><td style="color:var(--danger);font-weight:700">${(d.ai_probability*100).toFixed(1)}%</td><td style="color:var(--success);font-weight:700">${(d.real_probability*100).toFixed(1)}%</td><td><span class="pill ${vi.pill}">${d.verdict}</span></td></tr></tbody></table></div>`:''}
    <div class="info-card"><div class="card-title">Distribution</div><div style="max-width:200px;margin:0 auto"><canvas id="${uid}"></canvas></div></div>
  </div>`;
  if (charts[uid]) charts[uid].destroy();
  charts[uid] = new Chart(document.getElementById(uid), { type:'doughnut', data:{ labels:['AI','Real'], datasets:[{data:[d.ai_probability,d.real_probability],backgroundColor:['#fecaca','#bbf7d0'],borderColor:['#dc2626','#16a34a'],borderWidth:2}]}, options:{plugins:{legend:{position:'bottom',labels:{font:{family:'Poppins',size:11},padding:12}}},cutout:'62%'}});
}

// ── Render: Video ────────────────────────────────
function renderVideo(container, d) {
  const vi  = vInfo(d.verdict);
  const uid = 'vc' + Date.now();
  let rows = '';
  if (d.per_model_avg) for (const [n,r] of Object.entries(d.per_model_avg))
    rows += `<tr><td>${n}</td><td>${(r.avg_ai_probability*100).toFixed(1)}%</td><td>${(r.avg_real_probability*100).toFixed(1)}%</td></tr>`;
  const frames = d.total_frames_sampled ?? d.timeline?.length ?? 0;
  container.innerHTML = `<div class="result-area">
    <div class="verdict-banner ${vi.cls}"><div class="verdict-icon-box"><svg viewBox="0 0 24 24">${vi.icon}</svg></div><div><div class="verdict-label">${d.verdict}</div><div class="verdict-detail">AI frame ratio: ${(d.ai_frame_ratio*100).toFixed(1)}% · Frames: ${frames}</div></div></div>
    <div class="stat-row">
      <div class="stat-box"><div class="val" style="color:var(--danger)">${(d.ai_frame_ratio*100).toFixed(1)}%</div><div class="lbl">AI Frame Ratio</div></div>
      <div class="stat-box"><div class="val">${d.avg_ai_prob!=null?(d.avg_ai_prob*100).toFixed(1)+'%':'—'}</div><div class="lbl">Avg AI Prob</div></div>
      <div class="stat-box"><div class="val">${frames}</div><div class="lbl">Frames</div></div>
    </div>
    ${rows?`<div class="info-card"><div class="card-title">Model Averages</div><table class="data-tbl"><thead><tr><th>Model</th><th>Avg AI</th><th>Avg Real</th></tr></thead><tbody>${rows}</tbody></table></div>`:''}
    <div class="info-card"><div class="card-title">AI Probability Per Frame</div><canvas id="${uid}" style="max-height:180px"></canvas></div>
    ${heatmapFrameGrid(d.heatmaps || null)}
  </div>`;
  if (charts[uid]) charts[uid].destroy();
  charts[uid] = new Chart(document.getElementById(uid), { type:'line', data:{ labels:d.timeline.map((_,i)=>'F'+(i+1)), datasets:[{label:'AI Prob',data:d.timeline,borderColor:'#5c6bc0',backgroundColor:'rgba(92,107,192,.08)',borderWidth:2,pointRadius:3,fill:true,tension:.3},{label:'Threshold (0.6)',data:Array(d.timeline.length).fill(.6),borderColor:'#dc2626',borderWidth:1.5,borderDash:[5,4],pointRadius:0}]}, options:{scales:{y:{min:0,max:1,grid:{color:'#f3f4f6'},ticks:{font:{family:'Poppins',size:11}}},x:{grid:{display:false},ticks:{font:{family:'Poppins',size:11},maxTicksLimit:10}}},plugins:{legend:{labels:{font:{family:'Poppins',size:11},padding:12}}}}});
}

// ── Render: Batch ────────────────────────────────
function renderBatch(container, d) {
  const s = d.summary;
  container.innerHTML = `<div class="result-area">
    <div class="batch-summary-grid">
      <div class="stat-box"><div class="val">${s.total}</div><div class="lbl">Total</div></div>
      <div class="stat-box"><div class="val" style="color:var(--danger)">${s.ai_generated}</div><div class="lbl">AI Generated</div></div>
      <div class="stat-box"><div class="val" style="color:var(--success)">${s.real_image}</div><div class="lbl">Real Image</div></div>
      <div class="stat-box"><div class="val" style="color:var(--warn)">${s.uncertain}</div><div class="lbl">Uncertain</div></div>
    </div>
    <div class="info-card">
      <div class="card-title">Aggregate Scores</div>
      ${scoreBar('AI Ratio', s.ai_ratio, '#dc2626')}
      ${scoreBar('Avg AI Probability', s.avg_ai_prob, '#5c6bc0')}
    </div>
    <div class="info-card"><div class="card-title">Per-file Results (${d.results.length})</div>
      <div class="batch-result-list">
        ${d.results.map(r => {
          if (r.error) return `<div class="batch-result-row"><span class="br-name" style="color:var(--danger)">${r.filename}</span><span style="font-size:11px;color:var(--muted)">${r.error}</span></div>`;
          const vi = vInfo(r.verdict);
          const ai = Math.round(r.ai_probability*100), re = Math.round(r.real_probability*100);
          return `<div class="batch-result-row">
            <span class="br-name">${r.filename}</span>
            <span class="pill ${vi.pill}" style="flex-shrink:0">${r.verdict}</span>
            <div class="br-bars">
              <div class="br-bar-row"><span style="width:26px">AI</span><div class="br-bar-track"><div class="br-bar-fill" style="width:${ai}%;background:#dc2626"></div></div><span class="br-bar-val">${ai}%</span></div>
              <div class="br-bar-row"><span style="width:26px">Real</span><div class="br-bar-track"><div class="br-bar-fill" style="width:${re}%;background:#16a34a"></div></div><span class="br-bar-val">${re}%</span></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
  </div>`;
}

// ── Render: YouTube ──────────────────────────────
function renderYoutube(container, d) {
  const vi  = vInfo(d.verdict);
  const uid = 'yt' + Date.now();
  const isLive = d.type === 'live_stream';
  let rows = '';
  if (d.per_model_avg) for (const [n,r] of Object.entries(d.per_model_avg))
    rows += `<tr><td>${n}</td><td>${(r.avg_ai_probability*100).toFixed(1)}%</td><td>${(r.avg_real_probability*100).toFixed(1)}%</td></tr>`;
  const frames = d.total_frames_sampled ?? d.timeline?.length ?? 0;
  container.innerHTML = `<div class="result-area">
    ${d.thumbnail?`<div class="yt-result-header"><img class="yt-result-thumb" src="${d.thumbnail}" onerror="this.style.display='none'"><div class="yt-result-meta"><div class="yt-result-title">${d.title||'Unknown'}${isLive?'<span class="yt-live-badge"><span class="yt-live-dot"></span>LIVE</span>':''}</div><div class="yt-result-sub">${d.uploader||''} · ${isLive?'Live Stream':'Duration: '+(d.duration||'?')+'s'}</div></div></div>`:''}
    <div class="verdict-banner ${vi.cls}"><div class="verdict-icon-box"><svg viewBox="0 0 24 24">${vi.icon}</svg></div><div><div class="verdict-label">${d.verdict}</div><div class="verdict-detail">AI frame ratio: ${((d.ai_frame_ratio||0)*100).toFixed(1)}% · Frames: ${frames} · Confidence: ${d.confidence||'—'}</div></div></div>
    <div class="stat-row">
      <div class="stat-box"><div class="val" style="color:var(--danger)">${((d.ai_frame_ratio||0)*100).toFixed(1)}%</div><div class="lbl">AI Frame Ratio</div></div>
      <div class="stat-box"><div class="val">${d.avg_ai_prob!=null?(d.avg_ai_prob*100).toFixed(1)+'%':'—'}</div><div class="lbl">Avg AI Prob</div></div>
      <div class="stat-box"><div class="val">${frames}</div><div class="lbl">Frames</div></div>
    </div>
    ${rows?`<div class="info-card"><div class="card-title">Model Averages</div><table class="data-tbl"><thead><tr><th>Model</th><th>Avg AI</th><th>Avg Real</th></tr></thead><tbody>${rows}</tbody></table></div>`:''}
    ${d.timeline?.length?`<div class="info-card"><div class="card-title">AI Probability Per Frame</div><canvas id="${uid}" style="max-height:180px"></canvas></div>`:''}
    ${heatmapFrameGrid(d.heatmaps || null)}
  </div>`;
  if (d.timeline?.length) {
    if (charts[uid]) charts[uid].destroy();
    charts[uid] = new Chart(document.getElementById(uid), { type:'line', data:{ labels:d.timeline.map((_,i)=>'F'+(i+1)), datasets:[{label:'AI Prob',data:d.timeline,borderColor:'#b91c1c',backgroundColor:'rgba(185,28,28,.08)',borderWidth:2,pointRadius:3,fill:true,tension:.3},{label:'Threshold (0.6)',data:Array(d.timeline.length).fill(.6),borderColor:'#dc2626',borderWidth:1.5,borderDash:[5,4],pointRadius:0}]}, options:{scales:{y:{min:0,max:1,grid:{color:'#f3f4f6'},ticks:{font:{family:'Poppins',size:11}}},x:{grid:{display:false},ticks:{font:{family:'Poppins',size:11},maxTicksLimit:10}}},plugins:{legend:{labels:{font:{family:'Poppins',size:11},padding:12}}}}});
  }
}
