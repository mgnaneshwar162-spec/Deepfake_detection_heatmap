// ── Health Check (Boot) ──────────────────────────
window.addEventListener('DOMContentLoaded', checkHealth);

async function checkHealth() {
  const dot = document.getElementById('statusDot');
  const txt = document.getElementById('statusText');
  try {
    const r = await fetch(BACKEND + '/health', { signal: AbortSignal.timeout(8000), headers: HDR });
    const d = await r.json();
    if (d.status === 'ok') { dot.className = 'sdot on'; txt.textContent = 'Online · ' + d.device; }
    else throw 0;
  } catch { dot.className = 'sdot off'; txt.textContent = 'Offline'; }
}

// ── Page Navigation ──────────────────────────────
function showPage(name, e, doAnalytics) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  if (e) e.currentTarget.classList.add('active');
  if (doAnalytics) loadAnalytics();
  window.scrollTo(0, 0);
}

// ── Drag & Drop ──────────────────────────────────
function onDrag(e, id) { e.preventDefault(); document.getElementById(id).classList.add('drag'); }
function offDrag(id) { document.getElementById(id).classList.remove('drag'); }

function onDrop(e, kind) {
  e.preventDefault(); offDrag(kind + 'Zone');
  if (!e.dataTransfer.files.length) return;
  const dt = new DataTransfer(); dt.items.add(e.dataTransfer.files[0]);
  document.getElementById(kind + 'File').files = dt.files;
  previewFile(kind);
}

function onDropBatch(e) {
  e.preventDefault(); offDrag('batchZone');
  if (!e.dataTransfer.files.length) return;
  const dt = new DataTransfer();
  [...e.dataTransfer.files].forEach(f => dt.items.add(f));
  document.getElementById('batchFiles').files = dt.files;
  previewBatch();
}

// ── File Preview ─────────────────────────────────
function previewFile(kind) {
  const input = document.getElementById(kind + 'File');
  if (!input.files[0]) return;
  const tag = document.getElementById(kind + 'FileName');
  tag.textContent = input.files[0].name; tag.style.display = 'block';
  if (kind === 'image') {
    const r = new FileReader();
    r.onload = ev => { document.getElementById('imagePreview').src = ev.target.result; document.getElementById('imagePreviewWrap').style.display = 'block'; };
    r.readAsDataURL(input.files[0]);
  } else {
    document.getElementById('videoPreview').src = URL.createObjectURL(input.files[0]);
    document.getElementById('videoPreviewWrap').style.display = 'block';
  }
  document.getElementById(kind + 'Btn').disabled = false;
}

function previewBatch() {
  const input = document.getElementById('batchFiles');
  const files = [...input.files];
  if (!files.length) return;
  const list = document.getElementById('batchList');
  list.style.display = 'block';
  list.innerHTML = files.map(f => `
    <div class="batch-list-item">
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</span>
      <span style="color:var(--subtle);flex-shrink:0">${(f.size / 1024).toFixed(0)} KB</span>
    </div>`).join('');
  document.getElementById('batchBtn').disabled = false;
  document.getElementById('batchBtn').textContent = `Run Batch Analysis (${files.length} files)`;
}

// ── YouTube URL Watcher ──────────────────────────
function onYtInput() {
  const url = document.getElementById('ytUrl').value.trim();
  const btn = document.getElementById('ytBtn');
  const meta = document.getElementById('ytMeta');
  btn.disabled = !url.includes('youtube.com') && !url.includes('youtu.be');
  if (btn.disabled) { meta.style.display = 'none'; return; }
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (m) {
    document.getElementById('ytThumb').src = `https://img.youtube.com/vi/${m[1]}/mqdefault.jpg`;
    document.getElementById('ytTitle').textContent = 'YouTube video detected';
    document.getElementById('ytSub').textContent = url;
    meta.style.display = 'flex';
  }
}
