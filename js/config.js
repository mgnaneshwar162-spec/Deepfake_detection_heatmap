// ── Backend Configuration ────────────────────────
const BACKEND = 'https://benzoic-suppletive-sarita.ngrok-free.dev'; // ← update this
const HDR     = { 'ngrok-skip-browser-warning': 'true' };

// ── Shared State ─────────────────────────────────
const charts  = {};
const history = JSON.parse(localStorage.getItem('dfd_history') || '[]');
