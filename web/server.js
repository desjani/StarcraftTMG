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

app.listen(PORT, () => {
  console.log(`✅  Web UI → http://localhost:${PORT}`);
  console.log(`    API    → http://localhost:${PORT}/api/roster/<seed>`);
});
