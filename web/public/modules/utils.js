/**
 * Pure string / number utilities.
 * No DOM, no state, no side effects.
 */

// ─── HTML escaping ────────────────────────────────────────────────────────────
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─── ANSI → HTML ──────────────────────────────────────────────────────────────
// Approximates Discord dark-theme ANSI block rendering.
const ANSI_FG = {
  30: '#808080', 31: '#ff5555', 32: '#55ff55', 33: '#ffcc00',
  34: '#5b8fe8', 35: '#ff79c6', 36: '#8be9fd', 37: '#f8f8f2',
};

export function ansiToHtml(raw) {
  let text = raw
    .replace(/^```(?:ansi)?\r?\n/, '')
    .replace(/\r?\n```$/, '');

  let html  = '';
  let bold  = false;
  let color = null;

  const parts = text.split('\u001b[');
  for (let i = 0; i < parts.length; i++) {
    if (i === 0) {
      html += escapeHtml(parts[i]).replace(/\n/g, '<br>');
      continue;
    }
    const m = parts[i].match(/^([0-9;]*)m([\s\S]*)/);
    if (!m) { html += escapeHtml(parts[i]).replace(/\n/g, '<br>'); continue; }

    const codes = m[1].split(';').map(Number);
    const rest  = m[2];

    for (const code of codes) {
      if (code === 0)         { bold = false; color = null; }
      else if (code === 1)    { bold = true; }
      else if (ANSI_FG[code]) { color = ANSI_FG[code]; }
    }

    const escaped = escapeHtml(rest).replace(/\n/g, '<br>');
    if (color || bold) {
      const style = [color ? `color:${color}` : '', bold ? 'font-weight:bold' : ''].filter(Boolean).join(';');
      html += `<span style="${style}">${escaped}</span>`;
    } else {
      html += escaped;
    }
  }
  return html;
}

// ─── Seed / string helpers ────────────────────────────────────────────────────
export function sanitizeSeed(seed) {
  return String(seed || '').trim().toUpperCase();
}

export function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

export function formatPlayDateTime(iso) {
  if (!iso) return 'unknown';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  return d.toLocaleString();
}
