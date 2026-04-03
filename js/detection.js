// ── Single Image / Video Detect ──────────────────
async function detect(kind) {
  const fileInput = document.getElementById(kind + 'File');
  if (!fileInput.files.length) return toast('Please select a file first', 'error');
  const btn = document.getElementById(kind + 'Btn');
  const prog = document.getElementById(kind + 'Progress');
  const out = document.getElementById(kind + 'Result');
  btn.disabled = true; btn.textContent = 'Analyzing…';
  prog.style.display = 'block'; out.innerHTML = '';
  const file = fileInput.files[0];

  try {
    // ── Step 1: main detection ──────────────────────
    const fd1 = new FormData();
    fd1.append(kind === 'image' ? 'file' : 'video', file);
    const res  = await fetch(BACKEND + (kind === 'image' ? '/detect' : '/detect_video'), { method: 'POST', body: fd1, headers: HDR });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // ── Step 2: heatmap (parallel, non-blocking) ────
    try {
      if (kind === 'image') {
        document.getElementById('imageProgLabel') && (document.getElementById('imageProgLabel').textContent = 'Generating heatmap…');
        const fd2 = new FormData();
        fd2.append('file', file);
        const hmRes  = await fetch(BACKEND + '/heatmap', { method: 'POST', body: fd2, headers: HDR });
        const hmData = await hmRes.json();
        if (!hmData.error) {
          data.heatmap_b64  = hmData.overlay_b64;   // overlay goes into heatmapCard()
          data.original_b64 = hmData.heatmap_b64;   // raw heatmap shown on "Original" tab
        }
      } else {
        document.getElementById('videoProgLabel') && (document.getElementById('videoProgLabel').textContent = 'Generating frame heatmaps…');
        const fd2 = new FormData();
        fd2.append('video', file);
        const hmRes  = await fetch(BACKEND + '/heatmap_video', { method: 'POST', body: fd2, headers: HDR });
        const hmData = await hmRes.json();
        data.heatmaps = hmData.heatmaps || [];
      }
    } catch (_) { /* heatmap is optional — don't fail the whole result */ }

    pushHistory(file.name, kind, data.verdict, data.confidence ?? data.ai_frame_ratio ?? 0);
    kind === 'image' ? renderImage(out, data) : renderVideo(out, data);
    toast('Analysis complete', 'success');
  } catch (err) { toast(err.message || 'Something went wrong', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Analyze ' + (kind === 'image' ? 'Image' : 'Video'); prog.style.display = 'none'; }
}

// ── Batch Detect ─────────────────────────────────
async function detectBatch() {
  const input = document.getElementById('batchFiles');
  if (!input.files.length) return toast('Please select files first', 'error');
  const btn = document.getElementById('batchBtn');
  const prog = document.getElementById('batchProgress');
  const out = document.getElementById('batchResult');
  btn.disabled = true; btn.textContent = 'Analyzing…';
  prog.style.display = 'block'; out.innerHTML = '';
  document.getElementById('batchProgLabel').textContent = `Analyzing ${input.files.length} images…`;
  const fd = new FormData();
  [...input.files].forEach(f => fd.append('files[]', f));
  try {
    const res  = await fetch(BACKEND + '/detect_batch', { method: 'POST', body: fd, headers: HDR });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    pushHistory(`Batch (${input.files.length} files)`, 'batch', data.summary.ai_ratio > 0.4 ? 'AI GENERATED' : 'REAL IMAGE', data.summary.ai_ratio);
    renderBatch(out, data);
    toast(`Batch complete: ${data.summary.total} images analyzed`, 'success');
  } catch (err) { toast(err.message || 'Batch analysis failed', 'error'); }
  finally { btn.disabled = false; btn.textContent = `Run Batch Analysis (${input.files.length} files)`; prog.style.display = 'none'; }
}

// ── YouTube Detect ───────────────────────────────
async function detectYoutube() {
  const url = document.getElementById('ytUrl').value.trim();
  if (!url) return toast('Please enter a YouTube URL', 'error');
  const btn = document.getElementById('ytBtn');
  const prog = document.getElementById('ytProgress');
  const out = document.getElementById('ytResult');
  btn.disabled = true; btn.textContent = 'Analyzing…';
  prog.style.display = 'block'; out.innerHTML = '';
  document.getElementById('ytProgLabel').textContent = 'Fetching video info via yt-dlp…';
  try {
    const res  = await fetch(BACKEND + '/analyze_youtube', { method: 'POST', headers: { ...HDR, 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    pushHistory(data.title || url, 'youtube', data.verdict, data.ai_frame_ratio ?? 0);
    renderYoutube(out, data);
    toast('YouTube analysis complete', 'success');
  } catch (err) { toast(err.message || 'YouTube analysis failed', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Analyze YouTube URL'; prog.style.display = 'none'; }
}
