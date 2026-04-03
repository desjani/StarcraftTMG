/**
 * StarCraft TMG Roster Web UI — Express server.
 * Run with: node web/server.js
 *
 * Routes:
 *   GET /                          → index.html
 *   GET /lib/*                     → shared ES-module library (also imported by the browser)
 *   GET /api/roster/:seed          → JSON: { ok, roster }
 *   GET /api/format/:seed          → plain-text Discord code block
 *     ?plain=1   → no ANSI
 *     ?stats=1   → include unit stats
 *     ?abbr=1    → abbreviate paid upgrades inline (e.g. {HB, BA})
 *     ?tactLine=1   → tactical cards on separate lines
 *     ?tactAbbr=1   → abbreviate tactical card names
 *     ?tactSupply=1 → show tactical supply types (e.g. [S+2])
 *     ?tactResource=1 → show tactical card faction-resource values (e.g. 1cp)
 *     ?tactGas=1    → show tactical card gas costs (e.g. 35g)
 *     ?slotBreakdown=1 → move supply to dedicated line with slot used/total values
 *     ?limit=N   → character limit (default 2000)
 */
import 'dotenv/config';
import express from 'express';
import path    from 'path';
import { fileURLToPath } from 'url';
import { fetchRoster, fetchTacticalCards }   from '../lib/firestoreClient.js';
import { parseRoster }   from '../lib/rosterParser.js';
import { formatCompact, formatJson } from '../lib/formatter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = parseInt(process.env.PORT ?? '3000', 10);

// ── Puppeteer lazy singleton ──────────────────────────────────────────────────
let _browser = null;
async function getBrowser() {
  if (!_browser) {
    const { default: puppeteer } = await import('puppeteer');
    _browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    _browser.on('disconnected', () => { _browser = null; });
  }
  return _browser;
}

// ── Static assets ─────────────────────────────────────────────────────────────
// Expose lib/ so the browser can do: import { fetchRoster } from '/lib/firestoreClient.js'
app.use('/lib',    express.static(path.join(__dirname, '../lib')));
app.use(express.static(path.join(__dirname, 'public')));

// ── API: parsed roster JSON ───────────────────────────────────────────────────
app.get('/api/roster/:seed', async (req, res) => {
  try {
    const flat   = await fetchRoster(req.params.seed);
    const tacticalCards = await fetchTacticalCards(flat.state?.tacticalCardIds ?? []);
    const roster = parseRoster(flat, { tacticalCards });
    res.json({ ok: true, roster });
  } catch (err) {
    const status = err.status === 404 ? 404 : 500;
    res.status(status).json({ ok: false, error: err.message });
  }
});

// ── API: formatted Discord output ─────────────────────────────────────────────
app.get('/api/format/:seed', async (req, res) => {
  const plain     = req.query.plain === '1' || req.query.plain === 'true';
  const showStats = req.query.stats === '1' || req.query.stats === 'true';
  const abbreviateUpgrades = req.query.abbr === '1' || req.query.abbr === 'true';
  const tacticalPerLine = req.query.tactLine === '1' || req.query.tactLine === 'true';
  const abbreviateTacticalCards = req.query.tactAbbr === '1' || req.query.tactAbbr === 'true';
  const showTacticalSupplyTypes = req.query.tactSupply === '1' || req.query.tactSupply === 'true';
  const showTacticalResourceCosts = req.query.tactResource === '1' || req.query.tactResource === 'true';
  const showTacticalGasCosts = req.query.tactGas === '1' || req.query.tactGas === 'true';
  const showSlotBreakdown = req.query.slotBreakdown === '1' || req.query.slotBreakdown === 'true';
  const charLimit = parseInt(req.query.limit ?? '2000', 10);
  try {
    const flat   = await fetchRoster(req.params.seed);
    const tacticalCards = await fetchTacticalCards(flat.state?.tacticalCardIds ?? []);
    const roster = parseRoster(flat, { tacticalCards });
    const output = formatCompact(roster, {
      plain,
      showStats,
      abbreviateUpgrades,
      tacticalPerLine,
      abbreviateTacticalCards,
      showTacticalSupplyTypes,
      showTacticalResourceCosts,
      showTacticalGasCosts,
      showSlotBreakdown,
      charLimit,
    });
    res.type('text/plain').send(output);
  } catch (err) {
    const status = err.status === 404 ? 404 : 500;
    res.status(status).type('text/plain').send(`Error: ${err.message}`);
  }
});

// ── API: roster JSON (formatted for readability) ──────────────────────────────
app.get('/api/json/:seed', async (req, res) => {
  try {
    const flat   = await fetchRoster(req.params.seed);
    const tacticalCards = await fetchTacticalCards(flat.state?.tacticalCardIds ?? []);
    const roster = parseRoster(flat, { tacticalCards });
    res.type('text/plain').send(formatJson(roster));
  } catch (err) {
    const status = err.status === 404 ? 404 : 500;
    res.status(status).type('text/plain').send(`Error: ${err.message}`);
  }
});

// ── API: roster card PNG image ─────────────────────────────────────────────────
// GET /api/card/:seed[.png]  — optional query params to override defaults:
//   upgrades, stats, size, cost, tactical, tact-resource, tact-gas,
//   tact-supply, slots   (0=off, 1=on; default: all on except stats)
const CARD_SEED_RE = /^([A-Za-z0-9]{4,8})(\.png)?$/;
app.get('/api/card/:seed', async (req, res) => {
  const m = CARD_SEED_RE.exec(req.params.seed);
  if (!m) return res.status(400).type('text/plain').send('Invalid seed');
  const seed = m[1].toUpperCase();

  // Build the internal URL for the headless render
  const qs = new URLSearchParams({ s: seed, tab: 'roster', _img: '1' });
  for (const key of ['upgrades','stats','size','cost','tactical','tact-resource','tact-gas','tact-supply','slots']) {
    if (req.query[key] !== undefined) qs.set(key, req.query[key]);
  }
  const targetUrl = `http://127.0.0.1:${PORT}/?${qs.toString()}`;

  let page;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 560, height: 1600, deviceScaleFactor: 2 });
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 20000 });

    // Wait for the readiness signal set by app.js after loadRoster finishes
    await page.waitForFunction(
      () => document.documentElement.dataset.imgReady === '1',
      { timeout: 15000 }
    );

    // Forcibly make the card visible and measure it in one evaluate call
    const box = await page.evaluate(() => {
      const card = document.querySelector('#roster-card .roster-card');
      if (!card) return null;
      // Walk every ancestor up to <body> and force it visible
      let el = card.parentElement;
      while (el && el !== document.documentElement) {
        el.removeAttribute('hidden');
        el.style.setProperty('display', 'block', 'important');
        el = el.parentElement;
      }
      card.style.setProperty('display', 'inline-block', 'important');
      // Force layout recalc
      void card.offsetWidth;
      const r = card.getBoundingClientRect();
      return r.width > 0 ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
    });

    if (!box) {
      await page.close();
      return res.status(500).type('text/plain').send('Could not measure card element — card may be empty');
    }

    // Resize viewport to exactly match the card so nothing is clipped
    await page.setViewport({ width: Math.ceil(box.width) + 4, height: Math.ceil(box.height) + 4, deviceScaleFactor: 2 });

    const png = await page.screenshot({
      type: 'png',
      clip: { x: box.x, y: box.y, width: box.width, height: box.height },
      omitBackground: false,
    });
    await page.close();

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=300');
    res.send(png);
  } catch (err) {
    if (page) page.close().catch(() => {});
    const status = err.message?.includes('timeout') ? 504 : 500;
    res.status(status).type('text/plain').send(`Image generation failed: ${err.message}`);
  }
});

// ── Clean URL: /:seed/card.png → /api/card/:seed ───────────────────────────────
app.get('/:seed/card.png', (req, res) => {
  const qs = new URLSearchParams(req.query);
  res.redirect(302, `/api/card/${encodeURIComponent(req.params.seed)}.png?${qs.toString()}`);
});

// ── Clean URL: /:seed → loads the SPA with ?s=SEED ───────────────────────────
// Supports optional ?tab= and other query params being forwarded.
const SEED_URL_RE = /^[A-Za-z0-9]{4,8}$/;
app.get('/:seed', (req, res, next) => {
  if (!SEED_URL_RE.test(req.params.seed)) return next();
  const qs = new URLSearchParams(req.query);
  qs.set('s', req.params.seed.toUpperCase());
  res.redirect(302, `/?${qs.toString()}`);
});

app.listen(PORT, () => {
  console.log(`✅  Web UI → http://localhost:${PORT}`);
  console.log(`    API    → http://localhost:${PORT}/api/roster/<seed>`);
  console.log(`    Links  → http://localhost:${PORT}/<seed>`);
});
